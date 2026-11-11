import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createAuthApp } from './create-auth-app';

/**
 * Register → login → account → logout path (no HH).
 * Needs local `.env`, Postgres, Redis (same as `yarn start:dev`).
 */
describe('Auth register/login path (e2e)', () => {
    let app: INestApplication;
    const email = `e2e_${Date.now()}@market-hunter.local`;
    const password = 'Aa12345678';

    beforeAll(async () => {
        app = await createAuthApp();
    }, 60_000);

    afterAll(async () => {
        if (app) {
            await app.close();
        }
    });

    it('register → login → account with bearer → logout', async () => {
        const register = await request(app.getHttpServer())
            .post('/api/auth/register')
            .send({ email, password, passwordRepeat: password })
            .expect(201);
        expect(register.body.email).toBe(email);
        expect(register.body.password).toBeUndefined();

        const login = await request(app.getHttpServer()).post('/api/auth/login').send({ email, password }).expect(201);
        expect(login.body.accessToken).toEqual(expect.any(String));
        const cookies = login.headers['set-cookie'];
        expect(cookies).toBeDefined();

        const account = await request(app.getHttpServer())
            .get('/api/user/account')
            .set('Authorization', `Bearer ${login.body.accessToken}`)
            .expect(200);
        expect(account.body.email).toBe(email);

        await request(app.getHttpServer()).get('/api/auth/logout').set('Cookie', cookies).expect(200);
    });
});
