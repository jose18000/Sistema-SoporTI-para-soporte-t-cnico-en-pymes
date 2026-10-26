import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Ticket } from './ticket.entity';
import { User } from '../../users/entities/user.entity';

@Entity('ticket_history')
export class TicketHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'ticket_id', type: 'uuid' })
  ticketId: string;

  @ManyToOne(() => Ticket, (ticket) => ticket.history, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticket_id' })
  ticket: Ticket;

  @Column({ name: 'changed_by_id', type: 'uuid', nullable: true })
  changedById?: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'changed_by_id' })
  changedBy?: User;

  @Column({ name: 'field_changed', type: 'varchar', length: 50 })
  fieldChanged: string; // status, priority, technician, etc.

  @Column({ name: 'old_value', type: 'text', nullable: true })
  oldValue?: string;

  @Column({ name: 'new_value', type: 'text', nullable: true })
  newValue?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
