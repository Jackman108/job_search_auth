import { validate } from 'class-validator';
import { LoginDto } from './login.dto';

describe('LoginDto', () => {
    it('accepts valid email + password', async () => {
        const dto = Object.assign(new LoginDto(), {
            email: 'user@market-hunter.local',
            password: 'Aa12345678',
        });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
    });

    it('rejects bad email and short password', async () => {
        const dto = Object.assign(new LoginDto(), {
            email: 'not-an-email',
            password: '123',
        });
        const errors = await validate(dto);
        const props = errors.map((e) => e.property).sort();
        expect(props).toEqual(['email', 'password']);
    });
});
