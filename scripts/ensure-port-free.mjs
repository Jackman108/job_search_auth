/**
 * Free APP_PORT (default 8001) before nest --watch so a leftover node
 * from a previous crash/webpack restart does not cause EADDRINUSE.
 * Windows-focused; no-op if nothing is listening.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function loadDotEnvPort() {
    const envPath = path.join(root, '.env');
    if (!fs.existsSync(envPath)) return undefined;
    const text = fs.readFileSync(envPath, 'utf8');
    for (const line of text.split(/\r?\n/)) {
        const m = line.match(/^\s*APP_PORT\s*=\s*(\d+)\s*$/);
        if (m) return Number(m[1]);
    }
    return undefined;
}

const port = Number(process.env.APP_PORT || process.argv[2] || loadDotEnvPort() || 8001);
if (!Number.isFinite(port) || port < 1) {
    console.error(`[ensure-port-free] invalid port: ${port}`);
    process.exit(1);
}

function listenerPidsWin(p) {
    const pids = new Set();
    let out = '';
    try {
        out = execSync('netstat -ano -p TCP', { encoding: 'utf8' });
    } catch {
        return pids;
    }
    const re = new RegExp(`:\\s*${p}\\s+.+LISTENING\\s+(\\d+)\\s*$`, 'i');
    for (const line of out.split(/\r?\n/)) {
        const m = line.match(re);
        if (m) pids.add(Number(m[1]));
    }
    return pids;
}

function listenerPidsUnix(p) {
    const pids = new Set();
    try {
        const out = execSync(`lsof -t -iTCP:${p} -sTCP:LISTEN`, { encoding: 'utf8' });
        for (const line of out.split(/\r?\n/)) {
            const id = Number(line.trim());
            if (id > 0) pids.add(id);
        }
    } catch {
        // nothing listening or lsof missing
    }
    return pids;
}

const isWin = process.platform === 'win32';
const pids = isWin ? listenerPidsWin(port) : listenerPidsUnix(port);

if (pids.size === 0) {
    console.log(`[ensure-port-free] :${port} free`);
    process.exit(0);
}

for (const pid of pids) {
    if (pid === process.pid) continue;
    try {
        if (isWin) {
            execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'ignore' });
        } else {
            process.kill(pid, 'SIGTERM');
        }
        console.log(`[ensure-port-free] killed PID ${pid} on :${port}`);
    } catch (err) {
        console.warn(`[ensure-port-free] could not kill PID ${pid}: ${err.message}`);
    }
}

process.exit(0);
