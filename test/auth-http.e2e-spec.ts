import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createAuthApp } from './create-auth-app';

/**
 * Thin HTTP scaffold for auth routes that OpenAPI documents.
 * Requires local `.env`, Postgres, and Redis (same as `yarn start:dev`).
 */
describe('Auth HTTP (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        app = await createAuthApp();
    }, 60_000);

    afterAll(async () => {
        if (app) {
            await app.close();
        }
    });

    it('GET /api/docs serves Swagger UI', async () => {
        await request(app.getHttpServer()).get('/api/docs').expect(200);
    });

    it('GET /api/docs-json lists register/login/logout/refresh', async () => {
        const res = await request(app.getHttpServer()).get('/api/docs-json').expect(200);
        const paths = Object.keys(res.body.paths ?? {});
        const has = (suffix: string) => paths.some((p) => p === suffix || p.endsWith(suffix));
        expect(has('/auth/register')).toBe(true);
        expect(has('/auth/login')).toBe(true);
        expect(has('/auth/logout')).toBe(true);
        expect(has('/auth/refresh-tokens')).toBe(true);
        expect(has('/user/account')).toBe(true);
    });

    it('GET /api/auth/refresh-tokens without cookie → 401', async () => {
        await request(app.getHttpServer()).get('/api/auth/refresh-tokens').expect(401);
    });

    it('POST /api/auth/login with bad password → 401', async () => {
        await request(app.getHttpServer())
            .post('/api/auth/login')
            .send({ email: 'nobody@example.com', password: 'wrong-password' })
            .expect(401);
    });

    it('GET /api/user/account without bearer → 401', async () => {
        await request(app.getHttpServer()).get('/api/user/account').expect(401);
    });
});
