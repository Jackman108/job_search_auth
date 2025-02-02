import { applyDecorators, UseGuards } from '@nestjs/common';
import { Roles } from '@common/decorators/roles.decorator';
import { AuthGuard } from '@auth/guards/auth.guard';
import { RolesGuard } from '@auth/guards/role.guard';
import { Role } from '@prisma/client';

export function Authorization(...roles: Role[]) {
    if (roles.length > 0) {
        return applyDecorators(Roles(...roles), UseGuards(AuthGuard, RolesGuard));
    }

    return applyDecorators(UseGuards(AuthGuard));
}
