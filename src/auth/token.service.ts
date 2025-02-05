import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { add } from 'date-fns';
import { v4 } from 'uuid';
import { Token, User } from '@prisma/client';
import { Tokens } from '@auth/interfaces';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TokenService {
    constructor(private readonly prismaService: PrismaService, private readonly jwtService: JwtService) {}

    async getOrCreateRefreshToken(userId: string, agent: string): Promise<Token> {
        const existingToken = await this.prismaService.token.findFirst({
            where: { userId, userAgent: agent },
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
            data: { token: v4(), exp: add(new Date(), { months: 1 }) },
        });
    }

    private async createToken(userId: string, agent: string): Promise<Token> {
        return this.prismaService.token.create({
            data: {
                token: v4(),
                exp: add(new Date(), { months: 1 }),
                userId,
                userAgent: agent,
            },
        });
    }

    async generateTokens(user: User, agent: string): Promise<Tokens> {
        const accessToken =
            'Bearer ' +
            this.jwtService.sign({
                id: user.id,
                email: user.email,
                roles: user.roles,
            });
        const refreshToken = await this.getOrCreateRefreshToken(user.id, agent);
        return { accessToken, refreshToken };
    }

    async deleteRefreshToken(token: string) {
        return this.prismaService.token.delete({ where: { token } });
    }
}
