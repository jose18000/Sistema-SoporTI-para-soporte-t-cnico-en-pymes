import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../modules/users/entities/user.entity';
import { Department } from '../modules/users/entities/department.entity';
import { UserDataConsent } from '../modules/auth/entities/user-data-consent.entity';
import { AuditLog } from '../modules/audit/entities/audit-log.entity';
import { Ticket } from '../modules/tickets/entities/ticket.entity';
import { TicketComment } from '../modules/tickets/entities/ticket-comment.entity';
import { TicketHistory } from '../modules/tickets/entities/ticket-history.entity';
import { SatisfactionSurvey } from '../modules/tickets/entities/satisfaction-survey.entity';
import { TicketAttachment } from '../modules/tickets/entities/ticket-attachment.entity';
import { Notification } from '../modules/notifications/entities/notification.entity';

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
        entities: [
          User,
          Department,
          UserDataConsent,
          AuditLog,
          Ticket,
          TicketComment,
          TicketHistory,
          SatisfactionSurvey,
          TicketAttachment,
          Notification,
        ],
        synchronize: false,
        logging: configService.get<string>('nodeEnv') === 'development' ? ['error', 'warn'] : false,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
