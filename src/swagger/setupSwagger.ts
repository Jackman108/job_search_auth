import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/** Mount OpenAPI UI at `/api/docs` (global prefix already applied). */
export function setupSwagger(app: INestApplication): void {
    const config = new DocumentBuilder()
        .setTitle('Market Hunter Auth')
        .setDescription(
            'Auth + user HTTP API (GraphQL is separate). Refresh token is httpOnly cookie `refreshtoken`. ' +
                'OAuth: GET /auth/google|/auth/yandex → provider → callback → success-* issues accessToken + cookie. ' +
                'Email register returns UserResponse; login/refresh/OAuth success return `{ accessToken }` (HTTP 201).',
        )
        .setVersion('0.1.0')
        .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
        .addCookieAuth('refreshtoken')
        .build();

    const document = SwaggerModule.createDocument(app, config);
    // Honor global prefix so UI lives at `/api/docs` (not bare `/docs`).
    SwaggerModule.setup('docs', app, document, { useGlobalPrefix: true });
}
