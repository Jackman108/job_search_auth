import {
    ConflictException,
    HttpException,
    HttpStatus,
    Injectable,
    InternalServerErrorException,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';
import { Provider, User } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { UserService } from '@user/user.service';
import { compareSync } from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';

import { LoginDto, RegisterDto } from './dto';
import { Tokens } from './interfaces';
import { TokenService } from '@auth/token.service';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly userService: UserService,
        private readonly prismaService: PrismaService,
        private readonly tokenService: TokenService,
        private readonly configService: ConfigService,
    ) {}

    async register(dto: RegisterDto) {
        const user: User = await this.userService.findOne(dto.email).catch((err) => {
            this.logger.error(err);
            return null;
        });
        if (user) {
            throw new ConflictException('Пользователь с таким email уже зарегистрирован');
        }
        try {
            return await this.userService.save(dto);
        } catch (err) {
            this.logger.error(err);
            throw new InternalServerErrorException('Не удалось создать пользователя');
        }
    }

    async login(dto: LoginDto, agent: string): Promise<{ tokens: Tokens; user: User }> {
        const user: User = await this.userService.findOne(dto.email, true).catch((err) => {
            this.logger.error(err);
            return null;
        });
        if (!user || !compareSync(dto.password, user.password)) {
            throw new UnauthorizedException('Не верный логин или пароль');
        }
        const tokens = await this.tokenService.generateTokens(user, agent);
        return { tokens, user };
    }

    async saveSession(req: Request, user: User) {
        return new Promise((resolve, reject) => {
            req.session.userId = user.id;
            req.session.save((err: any) => {
                if (err) {
                    return reject(new InternalServerErrorException('Не удалось сохранить сессию'));
                }
                resolve({
                    user,
                });
            });
        });
    }

    async destroySession(req: Request, res: Response) {
        return new Promise<void>((resolve, reject): void => {
            req.session.destroy((err: any) => {
                if (err) {
                    return reject(new InternalServerErrorException('Не удалось завершить сессию'));
                }
                res.clearCookie(this.configService.getOrThrow<string>('SESSION_NAME'));
                resolve();
            });
        });
    }

    async refreshTokens(refreshToken: string, agent: string): Promise<Tokens> {
        const token = await this.prismaService.token.findUnique({ where: { token: refreshToken } });

        if (!token || new Date(token.exp) < new Date()) {
            throw new UnauthorizedException();
        }

        await this.prismaService.token.delete({ where: { token: refreshToken } });

        const user = await this.userService.findOne(token.userId);
        return this.tokenService.generateTokens(user, agent);
    }

    async providerAuth(email: string, agent: string, provider: Provider) {
        const userExists = await this.userService.findOne(email);
        if (userExists) {
            const user = await this.userService.save({ email, provider }).catch((err) => {
                this.logger.error(err);
                return null;
            });
            return this.tokenService.generateTokens(user, agent);
        }
        const user = await this.userService.save({ email, provider }).catch((err) => {
            this.logger.error(err);
            return null;
        });
        if (!user) {
            throw new HttpException(
                `Не получилось создать пользователя с email ${email} в Oauth`,
                HttpStatus.BAD_REQUEST,
            );
        }
        return this.tokenService.generateTokens(user, agent);
    }
}
