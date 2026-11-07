import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TokenService } from '@auth/token.service';

const DEFAULT_INTERVAL_MS = 60 * 60 * 1000;

@Injectable()
export class TokenCleanupService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(TokenCleanupService.name);
    private timer?: NodeJS.Timeout;

    constructor(private readonly tokenService: TokenService, private readonly config: ConfigService) {}

    onModuleInit() {
        void this.runCleanup();
        const intervalMs = this.resolveIntervalMs();
        this.timer = setInterval(() => void this.runCleanup(), intervalMs);
        this.logger.log(`Token cleanup scheduled every ${intervalMs}ms`);
    }

    onModuleDestroy() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = undefined;
        }
    }

    private resolveIntervalMs(): number {
        const raw = this.config.get<string>('TOKEN_CLEANUP_INTERVAL_MS');
        const parsed = raw ? Number(raw) : DEFAULT_INTERVAL_MS;
        return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_INTERVAL_MS;
    }

    private async runCleanup() {
        try {
            const deleted = await this.tokenService.deleteExpiredTokens();
            if (deleted > 0) {
                this.logger.log(`Deleted ${deleted} expired refresh token(s)`);
            }
        } catch (err) {
            this.logger.warn(`Token cleanup failed: ${(err as Error).message}`);
        }
    }
}
