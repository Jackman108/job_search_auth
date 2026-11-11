import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
    @ApiProperty({ example: 'user@market-hunter.local' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ minLength: 6, example: 'Aa12345678' })
    @IsString()
    @MinLength(6)
    @IsNotEmpty()
    password: string;
}
