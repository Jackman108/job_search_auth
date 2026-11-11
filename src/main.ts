import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { SessionService } from '@session/session.service';
import { PrismaService } from '@prisma/prisma.service';
import { assertJwtSecret } from './config/assertJwtSecret';
import { setupSwagger } from './swagger/setupSwagger';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const config = app.get(ConfigService);
    assertJwtSecret(config.get<string>('JWT_SECRET'), config.get<string>('NODE_ENV'));
    const sessionService = app.get(SessionService);
    const prisma = app.get(PrismaService);
    app.enableShutdownHooks();
    await prisma.enableShutdownHooks(app);
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
    const port = config.getOrThrow<number>('APP_PORT');
    await app.listen(port);
    Logger.log(`Auth listening on :${port}/api`, 'Bootstrap');
}

bootstrap().catch((err) => {
    const code = err && typeof err === 'object' && 'code' in err ? (err as NodeJS.ErrnoException).code : undefined;
    if (code === 'EADDRINUSE') {
        console.error(
            'Ошибка при запуске сервера: port already in use (EADDRINUSE). ' +
                'Stop the orphan process or re-run yarn start:dev (ensure-port-free clears APP_PORT).',
            err,
        );
    } else {
        console.error('Ошибка при запуске сервера:', err);
    }
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection', reason);
});
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception', error);
    process.exit(1);
});
