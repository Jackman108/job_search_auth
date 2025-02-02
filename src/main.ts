import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { SessionService } from '@session/session.service';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
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
    await app.listen(config.getOrThrow<number>('APP_PORT'));
}
bootstrap().catch((err) => {
    console.error('Ошибка при запуске сервера:', err);
    process.exit(1);
});
