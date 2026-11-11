import { Logger } from '@nestjs/common';

/** Known insecure placeholders — never accept these in production. */
export const WEAK_JWT_SECRETS = new Set(['your-secret-key', 'change_me', 'very_secret']);

const MIN_JWT_SECRET_LENGTH = 32;
const logger = new Logger('JwtSecret');

export type JwtSecretCheck = {
    ok: boolean;
    reason?: string;
};

export function evaluateJwtSecret(secret: string | undefined): JwtSecretCheck {
    if (!secret || !secret.trim()) {
        return { ok: false, reason: 'JWT_SECRET is missing or empty' };
    }
    const value = secret.trim();
    if (WEAK_JWT_SECRETS.has(value)) {
        return { ok: false, reason: `JWT_SECRET is a known insecure default (${value})` };
    }
    if (value.length < MIN_JWT_SECRET_LENGTH) {
        return {
            ok: false,
            reason: `JWT_SECRET is too short (min ${MIN_JWT_SECRET_LENGTH} chars, got ${value.length})`,
        };
    }
    return { ok: true };
}

/**
 * Production: fail boot on missing/weak/default JWT secret.
 * Development/test: allow with a loud warn.
 */
export function assertJwtSecret(secret: string | undefined, nodeEnv?: string): string {
    const env = nodeEnv || process.env.NODE_ENV || 'development';
    const check = evaluateJwtSecret(secret);
    if (check.ok && secret) {
        return secret.trim();
    }

    const message = check.reason || 'Invalid JWT_SECRET';
    if (env === 'production') {
        throw new Error(`[boot] ${message}. Set a strong JWT_SECRET (≥${MIN_JWT_SECRET_LENGTH} chars).`);
    }

    logger.warn(`[boot] ${message}. Continuing in ${env} — do not use this in production.`);
    return (secret || '').trim() || 'dev-only-insecure-jwt-secret-replace-me!!';
}
