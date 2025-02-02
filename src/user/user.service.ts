import { JwtPayload } from '@auth/interfaces';
import { convertToSecondsUtil } from '@common/utils';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthMethod, Role, User } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { genSaltSync, hashSync } from 'bcrypt';
import { Cache } from 'cache-manager';

@Injectable()
export class UserService {
    constructor(
        private readonly prismaService: PrismaService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
        private readonly configService: ConfigService,
    ) {}

    private isValidUuid(uuid: string): boolean {
        const regex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
        return regex.test(uuid);
    }

    async save(user: Partial<User>) {
        const hashedPassword = user?.password ? this.hashPassword(user.password) : null;
        const savedUser = await this.prismaService.user.upsert({
            where: {
                email: user.email,
            },
            update: {
                password: hashedPassword ?? undefined,
                method: user?.method ?? undefined,
                roles: user?.roles ?? undefined,
                isBlocked: user?.isBlocked ?? undefined,
            },
            create: {
                email: user.email,
                password: hashedPassword,
                displayName: user?.displayName ?? 'user',
                picture: user?.picture ?? 'user',
                method: AuthMethod.CREDENTIALS,
                roles: Role.USER,
                isVerified: false,
            },
            include: {
                accounts: true,
            },
        });
        await this.cacheManager.set(savedUser.id.toString(), savedUser);
        await this.cacheManager.set(savedUser.email, savedUser);
        return savedUser;
    }

    async findOne(idOrEmail: string, isReset = false): Promise<User> {
        if (isReset) {
            await this.cacheManager.del(idOrEmail);
        }
        const user = await this.cacheManager.get<User>(idOrEmail);
        if (!user) {
            let user: User;
            if (this.isValidUuid(idOrEmail)) {
                user = await this.prismaService.user.findUnique({
                    where: {
                        id: idOrEmail,
                    },
                    include: {
                        accounts: true,
                    },
                });
            } else {
                user = await this.prismaService.user.findUnique({
                    where: {
                        email: idOrEmail,
                    },
                    include: {
                        accounts: true,
                    },
                });
            }

            if (!user) {
                return null;
            }
            await this.cacheManager.set(idOrEmail, user, convertToSecondsUtil(this.configService.get('JWT_EXP')));
            return user;
        }
        return user;
    }

    async findById(id: string, isReset = false): Promise<User> {
        if (isReset) {
            await this.cacheManager.del(id);
        }
        const user = await this.cacheManager.get<User>(id);
        if (!user) {
            const user = await this.prismaService.user.findUnique({
                where: {
                    id,
                },
                include: {
                    accounts: true,
                },
            });
            if (!user) {
                return null;
            }
            await this.cacheManager.set(id, user, convertToSecondsUtil(this.configService.get('JWT_EXP')));
            return user;
        }
        return user;
    }

    async findByEmail(email: string, isReset = false): Promise<User> {
        if (isReset) {
            await this.cacheManager.del(email);
        }
        const user = await this.cacheManager.get<User>(email);
        if (!user) {
            const user = await this.prismaService.user.findUnique({
                where: {
                    email,
                },
                include: {
                    accounts: true,
                },
            });

            if (!user) {
                return null;
            }
            await this.cacheManager.set(email, user, convertToSecondsUtil(this.configService.get('JWT_EXP')));
            return user;
        }
        return user;
    }

    async delete(id: string, user: JwtPayload) {
        if (user.id !== id && !user.roles.includes(Role.ADMIN)) {
            throw new ForbiddenException();
        }
        await Promise.all([this.cacheManager.del(id), this.cacheManager.del(user.email)]);
        return this.prismaService.user.delete({ where: { id }, select: { id: true } });
    }

    private hashPassword(password: string) {
        return hashSync(password, genSaltSync(10));
    }
}
