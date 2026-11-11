import { ApiProperty } from '@nestjs/swagger';

/** JSON body from login / refresh / OAuth success (`setRefreshTokenToCookies`). */
export class AccessTokenResponseDto {
    @ApiProperty({ description: 'Short-lived JWT access token (raw; client sends as Bearer)' })
    accessToken: string;
}
