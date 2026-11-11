#!/usr/bin/env node
/**
 * Fail if any .ts/.tsx under src/libs exceeds MAX_LINES (default 300).
 */
import fs from 'fs';
import path from 'path';

const MAX_LINES = Number(process.env.MAX_FILE_LINES || 300);
const ROOTS = ['src', 'libs'];
const SKIP_DIR = new Set(['node_modules', 'dist', 'coverage']);

function walk(dir, out = []) {
    if (!fs.existsSync(dir)) return out;
    for (const name of fs.readdirSync(dir)) {
        if (SKIP_DIR.has(name)) continue;
        const full = path.join(dir, name);
        const st = fs.statSync(full);
        if (st.isDirectory()) walk(full, out);
        else if (/\.(ts|tsx)$/.test(name) && !name.endsWith('.d.ts')) out.push(full);
    }
    return out;
}

const offenders = [];
for (const root of ROOTS) {
    for (const file of walk(root)) {
        const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/).length;
        if (lines > MAX_LINES) offenders.push({ file: file.replace(/\\/g, '/'), lines });
    }
}

if (offenders.length === 0) {
    console.log(`check:structure OK (≤${MAX_LINES} lines)`);
    process.exit(0);
}

console.error(`check:structure FAIL — ${offenders.length} file(s) >${MAX_LINES} lines:`);
for (const { file, lines } of offenders.sort((a, b) => b.lines - a.lines)) {
    console.error(`  ${lines}\t${file}`);
}
process.exit(1);
