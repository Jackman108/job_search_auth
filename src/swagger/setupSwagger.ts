import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/** Mount OpenAPI UI at `/api/docs` (global prefix already applied). */
export function setupSwagger(app: INestApplication): void {
    const config = new DocumentBuilder()
        .setTitle('Market Hunter Auth')
        .setDescription('Auth + user HTTP API (GraphQL is separate). Refresh token is httpOnly cookie `refreshtoken`.')
        .setVersion('0.1.0')
        .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
        .addCookieAuth('refreshtoken')
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
}
