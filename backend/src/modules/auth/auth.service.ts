import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { User } from '../users/entities/user.entity';
import { UserDataConsent } from './entities/user-data-consent.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ConsentDto } from './dto/consent.dto';
import { AuditService } from '../audit/audit.service';
import { Role } from '../../common/enums/role.enum';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: Role;
    departmentId?: string;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserDataConsent)
    private readonly consentRepo: Repository<UserDataConsent>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  async register(
    dto: RegisterDto,
    ipAddress: string,
    userAgent?: string,
  ): Promise<AuthTokens> {
    const existing = await this.userRepo.findOne({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existing) {
      throw new ConflictException('El correo electrónico ya se encuentra registrado');
    }

    // Hashear contraseña con Argon2id (OWASP recommendation)
    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 64 MB
      timeCost: 3,
      parallelism: 1,
    });

    const user = this.userRepo.create({
      email: dto.email.toLowerCase().trim(),
      passwordHash,
      fullName: dto.fullName.trim(),
      role: dto.role || Role.EMPLOYEE,
      specialty: dto.specialty,
      phone: dto.phone,
      departmentId: dto.departmentId,
      isActive: true,
    });

    const savedUser = await this.userRepo.save(user);

    // Cumplimiento Ley 1581 de 2012: Guardar consentimiento explícito inmutable
    const consent = this.consentRepo.create({
      userId: savedUser.id,
      policyVersion: this.configService.get<string>('privacy.version', 'v1.0'),
      accepted: dto.dataConsentAccepted,
      ipAddress: ipAddress || '127.0.0.1',
      userAgent,
    });
    await this.consentRepo.save(consent);

    // Registro de auditoría
    await this.auditService.log({
      userId: savedUser.id,
      action: 'REGISTER',
      entity: 'USERS',
      entityId: savedUser.id,
      newValues: { email: savedUser.email, role: savedUser.role },
      ipAddress,
    });

    return this.generateTokens(savedUser);
  }

  async login(
    dto: LoginDto,
    ipAddress: string,
  ): Promise<AuthTokens> {
    const user = await this.userRepo.findOne({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Esta cuenta ha sido desactivada. Contacte al administrador');
    }

    const isMatch = await argon2.verify(user.passwordHash, dto.password);
    if (!isMatch) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Actualizar último inicio de sesión
    user.lastLoginAt = new Date();
    await this.userRepo.save(user);

    // Registro de auditoría
    await this.auditService.log({
      userId: user.id,
      action: 'LOGIN',
      entity: 'USERS',
      entityId: user.id,
      ipAddress,
    });

    return this.generateTokens(user);
  }

  async refreshToken(token: string): Promise<AuthTokens> {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      const user = await this.userRepo.findOne({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Token de actualización no válido o usuario inactivo');
      }

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Token de actualización inválido o expirado');
    }
  }

  async recordConsent(
    userId: string,
    dto: ConsentDto,
    ipAddress: string,
    userAgent?: string,
  ): Promise<UserDataConsent> {
    const consent = this.consentRepo.create({
      userId,
      policyVersion: dto.policyVersion || this.configService.get<string>('privacy.version', 'v1.0'),
      accepted: dto.accepted,
      ipAddress: ipAddress || '127.0.0.1',
      userAgent,
    });

    const saved = await this.consentRepo.save(consent);

    await this.auditService.log({
      userId,
      action: 'CONSENT_RECORDED',
      entity: 'USER_DATA_CONSENTS',
      entityId: saved.id,
      newValues: { policyVersion: saved.policyVersion, accepted: saved.accepted },
      ipAddress,
    });

    return saved;
  }

  async getConsentHistory(userId: string): Promise<UserDataConsent[]> {
    return this.consentRepo.find({
      where: { userId },
      order: { acceptedAt: 'DESC' },
    });
  }

  private generateTokens(user: User): AuthTokens {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.accessSecret'),
      expiresIn: this.configService.get<string>('jwt.accessExpiresIn', '15m'),
    });

    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<string>('jwt.refreshExpiresIn', '7d'),
      },
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: this.configService.get<string>('jwt.accessExpiresIn', '15m'),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        departmentId: user.departmentId,
      },
    };
  }
}
