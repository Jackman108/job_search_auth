import { JwtPayload } from '@auth/interfaces';
import { CurrentUser } from '@common/decorators';
import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Put,
    UseInterceptors,
} from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { UserResponse } from './responses';
import { UserService } from './user.service';
import { Authorization } from '@common/decorators/auth.decorator';
import { Authorized } from '@common/decorators/authorized.decorator';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}
    @UseInterceptors(ClassSerializerInterceptor)
    @Get(':idOrEmail')
    async findOneUser(@Param('idOrEmail') idOrEmail: string) {
        const user = await this.userService.findOne(idOrEmail);
        return new UserResponse(user);
    }
    @Authorization(Role.ADMIN)
    @Get(':id')
    async findByIdUser(@Param('id') id: string) {
        const user = await this.userService.findById(id);
        return new UserResponse(user);
    }
    @Authorization(Role.ADMIN)
    @Get(':email')
    async findByEmailUser(@Param('email') email: string) {
        const user = await this.userService.findByEmail(email);
        return new UserResponse(user);
    }

    @Delete(':id')
    async deleteUser(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
        return this.userService.delete(id, user);
    }

    @Get('me')
    me(@CurrentUser() user: JwtPayload) {
        console.log(user);
        return user;
    }

    @UseInterceptors(ClassSerializerInterceptor)
    @Put()
    async updateUser(@Body() body: Partial<User>) {
        const user = await this.userService.save(body);
        return new UserResponse(user);
    }

    @Authorization()
    @Get('account/:id')
    public async findAccount(@Authorized('id') userId: string) {
        return this.userService.findById(userId);
    }
}
