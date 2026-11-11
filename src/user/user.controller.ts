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
import { User } from '@prisma/client';
import { UserResponse } from './responses';
import { UserService } from './user.service';
import { Authorization } from '@common/decorators/auth.decorator';
import { Authorized } from '@common/decorators/authorized.decorator';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserResponseDto } from '@auth/dto';

@ApiTags('user')
@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Current user account (JWT)' })
    @ApiOkResponse({ description: 'Authenticated user profile', type: UserResponseDto })
    @Authorization()
    @Get('account')
    public async findAccount(@Authorized('id') userId: string) {
        return this.userService.findById(userId);
    }

    @UseInterceptors(ClassSerializerInterceptor)
    @Get(':idOrEmail')
    async findOneUser(@Param('idOrEmail') idOrEmail: string) {
        const user = await this.userService.findOne(idOrEmail);
        return new UserResponse(user);
    }

    @Delete(':id')
    async deleteUser(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
        return this.userService.delete(id, user);
    }

    @UseInterceptors(ClassSerializerInterceptor)
    @Get()
    async getCurrentUser(@CurrentUser() user: JwtPayload): Promise<UserResponse> {
        return new UserResponse(await this.userService.findOne(user.id));
    }

    @UseInterceptors(ClassSerializerInterceptor)
    @Put()
    async updateUser(@Body() body: Partial<User>) {
        const user = await this.userService.save(body);
        return new UserResponse(user);
    }
}
