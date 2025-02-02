import {
    ConflictException,
    HttpException,
    HttpStatus,
    Injectable,
    InternalServerErrorException,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthMethod, Token, User } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { UserService } from '@user/user.service';
import { compareSync } from 'bcrypt';
import { add } from 'date-fns';
import { v4 } from 'uuid';
import { LoginDto, RegisterDto } from './dto';
import { Tokens } from './interfaces';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        private readonly prismaService: PrismaService,
        private readonly configService: ConfigService,
    ) {}

    async refreshTokens(refreshToken: string, agent: string): Promise<Tokens> {
        const token = await this.prismaService.token.delete({ where: { token: refreshToken } });
        if (!token || new Date(token.expiresIn) < new Date()) {
            throw new UnauthorizedException();
        }
        const user = await this.userService.findById(token.userId);
        return this.generateTokens(user, agent);
    }

    async register(dto: RegisterDto) {
        const user: User = await this.userService.findByEmail(dto.email).catch((err) => {
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

    async login(dto: LoginDto, agent: string): Promise<{ tokens: Tokens; user: User }> {
        const user: User = await this.userService.findByEmail(dto.email, true).catch((err) => {
            this.logger.error(err);
            return null;
        });
        if (!user || !compareSync(dto.password, user.password)) {
            throw new UnauthorizedException('Не верный логин или пароль');
        }
        const tokens = await this.generateTokens(user, agent);
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
            });
            resolve();
        });
    }

    private async generateTokens(user: User, agent: string): Promise<Tokens> {
        const accessToken: string =
            'Bearer ' +
            this.jwtService.sign({
                id: user.id,
                email: user.email,
                roles: user.roles,
            });
        const refreshToken: Token = await this.getRefreshToken(user.id, agent);
        return { accessToken, refreshToken };
    }

    private async getRefreshToken(userId: string, agent: string): Promise<Token> {
        const existingToken: Token | null = await this.prismaService.token.findFirst({
            where: {
                userId,
                userAgent: agent,
            },
        });

        if (existingToken) {
            return this.updateToken(existingToken.token);
        } else {
            return this.createToken(userId, agent);
        }
    }

    private async updateToken(token: string): Promise<Token> {
        return this.prismaService.token.update({
            where: { token },
            data: {
                token: v4(),
                expiresIn: add(new Date(), { months: 1 }),
            },
        });
    }

    private async createToken(userId: string, agent: string): Promise<Token> {
        return this.prismaService.token.create({
            data: {
                token: v4(),
                expiresIn: add(new Date(), { months: 1 }),
                type: 'VERIFICATION',
                userId,
                userAgent: agent,
            },
        });
    }

    deleteRefreshToken(token: string) {
        return this.prismaService.token.delete({ where: { token } });
    }

    async providerAuth(email: string, agent: string, method: AuthMethod) {
        const userExists = await this.userService.findByEmail(email);
        if (userExists) {
            const user = await this.userService.save({ email, method }).catch((err) => {
                this.logger.error(err);
                return null;
            });
            return this.generateTokens(user, agent);
        }
        const user = await this.userService.save({ email, method }).catch((err) => {
            this.logger.error(err);
            return null;
        });
        if (!user) {
            throw new HttpException(
                `Не получилось создать пользователя с email ${email} в Google auth`,
                HttpStatus.BAD_REQUEST,
            );
        }
        return this.generateTokens(user, agent);
    }
}
