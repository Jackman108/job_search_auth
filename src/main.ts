import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { SessionService } from '@session/session.service';
import { setupSwagger } from './swagger/setupSwagger';

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
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );
    app.use(cookieParser());
    app.setGlobalPrefix('api');
    app.use(sessionService.createSessionMiddleware());
    setupSwagger(app);
    await app.listen(config.getOrThrow<number>('APP_PORT'));
    Logger.log(`Auth listening on :${config.getOrThrow<number>('APP_PORT')}/api`, 'Bootstrap');
}
bootstrap().catch((err) => {
    console.error('Ошибка при запуске сервера:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection', reason);
});
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception', error);
    process.exit(1);
});
