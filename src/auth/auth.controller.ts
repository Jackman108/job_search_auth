import { Cookie, Public, UserAgent } from '@common/decorators';
import { HttpService } from '@nestjs/axios';
import {
    BadRequestException,
    Body,
    ClassSerializerInterceptor,
    Controller,
    Get,
    HttpStatus,
    Post,
    Query,
    Req,
    Res,
    UnauthorizedException,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    ApiBody,
    ApiCookieAuth,
    ApiCreatedResponse,
    ApiOkResponse,
    ApiOperation,
    ApiQuery,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { UserResponse } from '@user/responses';
import { Request, Response } from 'express';
import { map, mergeMap } from 'rxjs';
import { AuthService } from './auth.service';
import { AccessTokenResponseDto, LoginDto, RegisterDto, UserResponseDto } from './dto';
import { GoogleGuard } from './guards/google.guard';
import { Tokens } from './interfaces';
import { handleTimeoutAndErrors } from '@common/helpers';
import { YandexGuard } from './guards/yandex.guard';
import { Provider } from '@prisma/client';
import { TokenService } from '@auth/token.service';

const REFRESH_TOKEN = 'refreshtoken';

@ApiTags('auth')
@Public()
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
        private readonly tokenService: TokenService,
    ) {}

    @ApiOperation({ summary: 'Register email/password user and open session' })
    @ApiBody({ type: RegisterDto })
    @ApiOkResponse({ description: 'Registered user (password excluded)', type: UserResponseDto })
    @UseInterceptors(ClassSerializerInterceptor)
    @Post('register')
    async register(@Body() dto: RegisterDto, @Req() req: Request) {
        const user = await this.authService.register(dto);
        if (!user) {
            throw new BadRequestException(
                `Не получается зарегистрировать пользователя с данными ${JSON.stringify(dto)}`,
            );
        }
        await this.authService.saveSession(req, user);
        return new UserResponse(user);
    }

    @ApiOperation({ summary: 'Login; sets httpOnly refresh cookie; returns accessToken' })
    @ApiBody({ type: LoginDto })
    @ApiCreatedResponse({
        description: 'JSON `{ accessToken }` + Set-Cookie refreshtoken',
        type: AccessTokenResponseDto,
    })
    @Post('login')
    async login(@Body() dto: LoginDto, @Req() req: Request, @Res() res: Response, @UserAgent() agent: string) {
        const { tokens, user } = await this.authService.login(dto, agent);
        if (!tokens) {
            throw new BadRequestException(`Не получается войти с данными ${JSON.stringify(dto)}`);
        }
        await this.authService.saveSession(req, user);
        this.setRefreshTokenToCookies(tokens, res);
    }

    @ApiOperation({ summary: 'Logout; clears refresh cookie and session' })
    @ApiCookieAuth('refreshtoken')
    @ApiOkResponse({ description: 'Logged out (empty body, HTTP 200)' })
    @Get('logout')
    async logout(
        @Cookie(REFRESH_TOKEN) refreshToken: string,
        @Res({ passthrough: true }) res: Response,
        @Req() req: Request,
    ) {
        if (refreshToken) {
            await this.tokenService.deleteRefreshToken(refreshToken);
        }
        await this.authService.destroySession(req, res);
        res.cookie(REFRESH_TOKEN, '', { httpOnly: true, secure: true, expires: new Date() });
        res.sendStatus(HttpStatus.OK);
    }

    @ApiOperation({ summary: 'Rotate tokens using refreshtoken cookie' })
    @ApiCookieAuth('refreshtoken')
    @ApiCreatedResponse({
        description: 'Rotated access token + refreshed cookie',
        type: AccessTokenResponseDto,
    })
    @Get('refresh-tokens')
    async refreshTokens(@Cookie(REFRESH_TOKEN) refreshToken: string, @Res() res: Response, @UserAgent() agent: string) {
        if (!refreshToken) throw new UnauthorizedException();
        const tokens = await this.authService.refreshTokens(refreshToken, agent);
        this.setRefreshTokenToCookies(tokens, res);
    }

    private setRefreshTokenToCookies(tokens: Tokens, res: Response) {
        res.cookie(REFRESH_TOKEN, tokens.refreshToken.token, {
            httpOnly: true,
            sameSite: 'lax',
            expires: new Date(tokens.refreshToken.exp),
            secure: this.configService.get('NODE_ENV', 'development') === 'production',
            path: '/',
        });
        res.status(HttpStatus.CREATED).json({ accessToken: tokens.accessToken });
    }

    @ApiOperation({
        summary: 'Start Google OAuth (Passport)',
        description: 'Redirects to Google consent. Needs GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET.',
    })
    @ApiResponse({ status: 302, description: 'Redirect to Google OAuth' })
    @UseGuards(GoogleGuard)
    @Get('google')
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    googleAuth() {}

    @ApiOperation({ summary: 'Google OAuth callback → redirect to success-google with provider token' })
    @ApiResponse({ status: 302, description: 'Redirect to /api/auth/success-google?token=…' })
    @UseGuards(GoogleGuard)
    @Get('google/callback')
    googleAuthCallback(@Req() req: Request, @Res() res: Response) {
        const token = req.user['accessToken'];
        return res.redirect(`http://localhost:8001/api/auth/success-google?token=${token}`);
    }

    @ApiOperation({
        summary: 'Finish Google OAuth; issues Market Hunter tokens',
        description: 'Validates Google access token, upserts user (Provider.GOOGLE), sets refresh cookie.',
    })
    @ApiQuery({ name: 'token', required: true, description: 'Google OAuth access token from callback' })
    @ApiCreatedResponse({ type: AccessTokenResponseDto })
    @Get('success-google')
    successGoogle(@Query('token') token: string, @UserAgent() agent: string, @Res() res: Response) {
        return this.httpService.get(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${token}`).pipe(
            mergeMap(({ data: { email } }) => this.authService.providerAuth(email, agent, Provider.GOOGLE)),
            map((data) => this.setRefreshTokenToCookies(data, res)),
            handleTimeoutAndErrors(),
        );
    }

    @ApiOperation({
        summary: 'Start Yandex OAuth (Passport)',
        description: 'Redirects to Yandex consent. Needs YANDEX_APP_ID / YANDEX_APP_SECRET.',
    })
    @ApiResponse({ status: 302, description: 'Redirect to Yandex OAuth' })
    @UseGuards(YandexGuard)
    @Get('yandex')
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    yandexAuth() {}

    @ApiOperation({ summary: 'Yandex OAuth callback → redirect to success-yandex with provider token' })
    @ApiResponse({ status: 302, description: 'Redirect to /api/auth/success-yandex?token=…' })
    @UseGuards(YandexGuard)
    @Get('yandex/callback')
    yandexAuthCallback(@Req() req: Request, @Res() res: Response) {
        const token = req.user['accessToken'];
        return res.redirect(`http://localhost:8001/api/auth/success-yandex?token=${token}`);
    }

    @ApiOperation({
        summary: 'Finish Yandex OAuth; issues Market Hunter tokens',
        description: 'Loads Yandex profile, upserts user (Provider.YANDEX), sets refresh cookie.',
    })
    @ApiQuery({ name: 'token', required: true, description: 'Yandex OAuth token from callback' })
    @ApiCreatedResponse({ type: AccessTokenResponseDto })
    @Get('success-yandex')
    successYandex(@Query('token') token: string, @UserAgent() agent: string, @Res() res: Response) {
        return this.httpService.get(`https://login.yandex.ru/info?format=json&oauth_token=${token}`).pipe(
            mergeMap(({ data: { default_email } }) =>
                this.authService.providerAuth(default_email, agent, Provider.YANDEX),
            ),
            map((data) => this.setRefreshTokenToCookies(data, res)),
            handleTimeoutAndErrors(),
        );
    }
}
