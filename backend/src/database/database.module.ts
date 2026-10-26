import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../modules/users/entities/user.entity';
import { Department } from '../modules/users/entities/department.entity';
import { UserDataConsent } from '../modules/auth/entities/user-data-consent.entity';
import { AuditLog } from '../modules/audit/entities/audit-log.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.name'),
        entities: [User, Department, UserDataConsent, AuditLog],
        synchronize: false, // Usar esquema SQL predefinido y migraciones para evitar pérdida de datos
        logging: configService.get<string>('nodeEnv') === 'development' ? ['error', 'warn'] : false,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
