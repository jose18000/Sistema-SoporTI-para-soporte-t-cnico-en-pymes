import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
  Relation,
} from 'typeorm';
import { Ticket } from './ticket.entity';

@Entity('satisfaction_surveys')
export class SatisfactionSurvey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'ticket_id', type: 'uuid', unique: true })
  ticketId: string;

  @OneToOne(() => Ticket, (ticket) => ticket.survey, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticket_id' })
  ticket: Relation<Ticket>;

  @Column({ type: 'int' })
  rating: number; // 1 a 5

  @Column({ type: 'text', nullable: true })
  feedback?: string;

  @CreateDateColumn({ name: 'submitted_at', type: 'timestamptz' })
  submittedAt: Date;
}
