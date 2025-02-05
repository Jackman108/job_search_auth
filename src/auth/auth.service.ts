import {
    ConflictException,
    HttpException,
    HttpStatus,
    Injectable,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';
import { Provider, User } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { UserService } from '@user/user.service';
import { compareSync } from 'bcrypt';

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
    ) {}

    async register(dto: RegisterDto) {
        const user: User = await this.userService.findOne(dto.email).catch((err) => {
            this.logger.error(err);
            return null;
        });
        if (user) {
            throw new ConflictException('Пользователь с таким email уже зарегистрирован');
        }
        return this.userService.save(dto).catch((err) => {
            this.logger.error(err);
            return null;
        });
    }

    async login(dto: LoginDto, agent: string): Promise<Tokens> {
        const user: User = await this.userService.findOne(dto.email, true).catch((err) => {
            this.logger.error(err);
            return null;
        });
        if (!user || !compareSync(dto.password, user.password)) {
            throw new UnauthorizedException('Не верный логин или пароль');
        }
        return this.tokenService.generateTokens(user, agent);
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
