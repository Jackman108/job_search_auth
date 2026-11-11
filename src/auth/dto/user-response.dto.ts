import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

/** Public fields returned by register / account (password excluded). */
export class UserResponseDto {
    @ApiProperty({ format: 'uuid' })
    id: string;

    @ApiProperty({ example: 'user@market-hunter.local' })
    email: string;

    @ApiProperty()
    updatedAt: Date;

    @ApiProperty({ enum: Role, isArray: true })
    roles: Role[];
}
