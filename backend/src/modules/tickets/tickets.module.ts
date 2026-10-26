import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from './entities/ticket.entity';
import { TicketComment } from './entities/ticket-comment.entity';
import { TicketHistory } from './entities/ticket-history.entity';
import { SatisfactionSurvey } from './entities/satisfaction-survey.entity';
import { TicketAttachment } from './entities/ticket-attachment.entity';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { SpecialtyAndWorkloadStrategy } from './strategies/specialty-workload.strategy';
import { RoundRobinStrategy } from './strategies/round-robin.strategy';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Ticket,
      TicketComment,
      TicketHistory,
      SatisfactionSurvey,
      TicketAttachment,
    ]),
    UsersModule,
  ],
  providers: [
    TicketsService,
    SpecialtyAndWorkloadStrategy,
    RoundRobinStrategy,
  ],
  controllers: [TicketsController],
  exports: [TicketsService, TypeOrmModule],
})
export class TicketsModule {}
