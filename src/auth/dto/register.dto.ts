import { IsPasswordsMatchingConstraint } from '@common/decorators';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, Validate } from 'class-validator';

export class RegisterDto {
    @ApiProperty({ example: 'user@market-hunter.local' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ minLength: 6 })
    @IsString()
    @MinLength(6)
    @IsNotEmpty()
    password: string;

    @ApiProperty({ minLength: 6, description: 'Must match password' })
    @IsString()
    @MinLength(6)
    @Validate(IsPasswordsMatchingConstraint)
    @IsNotEmpty()
    passwordRepeat: string;
}
