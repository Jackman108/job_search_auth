import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UserModule } from '@user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { options } from './config';
import { GUARDS } from './guards';
import { STRATEGIES } from './strategies';
import { HttpModule } from '@nestjs/axios';
import { TokenService } from '@auth/token.service';

@Module({
    controllers: [AuthController],
    providers: [AuthService, TokenService, ...STRATEGIES, ...GUARDS],
    imports: [PassportModule, JwtModule.registerAsync(options()), UserModule, HttpModule],
})
export class AuthModule {}
