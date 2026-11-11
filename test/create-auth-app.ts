import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { SessionService } from '../src/session/session.service';
import { setupSwagger } from '../src/swagger/setupSwagger';

/** Boot Nest like `main.ts` (prefix, cookies, session, Swagger). Needs .env + Postgres + Redis. */
export async function createAuthApp(): Promise<INestApplication> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
    }).compile();

    const app = moduleFixture.createNestApplication();
    const config = app.get(ConfigService);
    const sessionService = app.get(SessionService);

    app.enableCors({
        origin: config.getOrThrow<string>('ALLOWED_ORIGIN'),
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    });
    app.use(cookieParser());
    app.setGlobalPrefix('api');
    app.use(sessionService.createSessionMiddleware());
    setupSwagger(app);
    await app.init();
    return app;
}
