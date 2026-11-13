import { ConfigService } from '@nestjs/config';
import { JwtModuleAsyncOptions, JwtModuleOptions } from '@nestjs/jwt';

const jwtModuleOptions = (config: ConfigService): JwtModuleOptions => ({
    secret: config.get('JWT_SECRET'),
    signOptions: {
        // Access token ≥1 day so HH poll/captcha mid-job doesn't 401 every few minutes.
        // Refresh cookie remains the long-lived session; override via JWT_EXP if needed.
        expiresIn: config.get('JWT_EXP', '24h'),
    },
});

export const options = (): JwtModuleAsyncOptions => ({
    inject: [ConfigService],
    useFactory: (config: ConfigService) => jwtModuleOptions(config),
});
