import { AuthMethod, Role, User } from '@prisma/client';
import { Exclude } from 'class-transformer';

export class UserResponse implements User {
    id: string;
    email: string;

    @Exclude()
    password: string;

    @Exclude()
    displayName: string;

    @Exclude()
    picture: string;

    @Exclude()
    method: AuthMethod;

    @Exclude()
    isVerified: boolean;

    @Exclude()
    isTwoFactor: boolean;

    @Exclude()
    isBlocked: boolean;

    @Exclude()
    createdAt: Date;

    updatedAt: Date;
    roles: Role[];
    constructor(user: User) {
        Object.assign(this, user);
    }
}
