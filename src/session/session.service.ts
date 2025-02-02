import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as session from 'express-session';
import IORedis from 'ioredis';
import { RedisStore } from 'connect-redis';
import { convertToSecondsUtil, parseBoolean } from '@common/utils';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class SessionService {
    private readonly redis: IORedis;

    constructor(private readonly config: ConfigService) {
        this.redis = new IORedis(this.config.getOrThrow<string>('REDIS_URI'));
    }

    createSessionMiddleware() {
        return session({
            secret: this.config.getOrThrow<string>('SESSION_SECRET'),
            name: this.config.getOrThrow<string>('SESSION_NAME'),
            resave: false,
            saveUninitialized: false,
            cookie: {
                domain: this.config.get<string>('SESSION_DOMAIN'),
                maxAge: convertToSecondsUtil(this.config.getOrThrow<string>('SESSION_MAX_AGE')),
                httpOnly: parseBoolean(this.config.getOrThrow<string>('SESSION_HTTP_ONLY')),
                secure: parseBoolean(this.config.getOrThrow<string>('SESSION_SECURE')),
                sameSite: 'lax',
            },
            store: new RedisStore({
                client: this.redis,
                prefix: this.config.get<string>('SESSION_FOLDER', 'session:'),
            }),
        }) as session.SessionOptions & ((req: Request, res: Response, next: NextFunction) => void);
    }
}
