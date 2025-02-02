import { GoogleGuard } from './google.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './role.guard';
import { YandexGuard } from './yandex.guard';
import { AuthGuard } from '@auth/guards/auth.guard';

export const GUARDS = [JwtAuthGuard, RolesGuard, GoogleGuard, YandexGuard, AuthGuard];
