import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Ip,
  Headers,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService, AuthTokens } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ConsentDto } from './dto/consent.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Autenticación y Seguridad (Auth & Ley 1581)')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'Registrar un nuevo usuario',
    description: 'Crea una cuenta con contraseña cifrada (Argon2id) y registra el consentimiento obligatorio de la Ley 1581 de 2012',
  })
  @ApiResponse({ status: 201, description: 'Usuario registrado exitosamente y tokens emitidos' })
  @ApiResponse({ status: 409, description: 'El correo electrónico ya existe' })
  async register(
    @Body() dto: RegisterDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<AuthTokens> {
    return this.authService.register(dto, ip, userAgent);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Iniciar sesión',
    description: 'Autentica credenciales corporativas y emite Access Token (15 min) y Refresh Token (7 días)',
  })
  @ApiResponse({ status: 200, description: 'Sesión iniciada con éxito' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas o cuenta desactivada' })
  async login(
    @Body() dto: LoginDto,
    @Ip() ip: string,
  ): Promise<AuthTokens> {
    return this.authService.login(dto, ip);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refrescar Access Token',
    description: 'Emite un nuevo par de tokens usando un Refresh Token válido',
  })
  @ApiResponse({ status: 200, description: 'Tokens renovados exitosamente' })
  @ApiResponse({ status: 401, description: 'Refresh token expirado o inválido' })
  async refresh(@Body() dto: RefreshTokenDto): Promise<AuthTokens> {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener perfil del usuario autenticado',
    description: 'Devuelve la información del usuario en sesión',
  })
  @ApiResponse({ status: 200, description: 'Perfil recuperado exitosamente' })
  async getProfile(@CurrentUser() user: User): Promise<User> {
    return user;
  }

  @Post('consent')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Registrar o actualizar consentimiento Ley 1581',
    description: 'Registra un nuevo consentimiento de tratamiento de datos personales',
  })
  @ApiResponse({ status: 201, description: 'Consentimiento registrado' })
  async recordConsent(
    @CurrentUser('id') userId: string,
    @Body() dto: ConsentDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.authService.recordConsent(userId, dto, ip, userAgent);
  }

  @Get('consent-history')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Historial de consentimientos del usuario',
    description: 'Auditoría del tratamiento de datos personales para cumplimiento legal',
  })
  async getConsentHistory(@CurrentUser('id') userId: string) {
    return this.authService.getConsentHistory(userId);
  }
}
