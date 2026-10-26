import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { TicketStatus } from '../enums/ticket-status.enum';
import { TicketPriority } from '../enums/ticket-priority.enum';
import { TicketType } from '../enums/ticket-type.enum';
import { SlaStatus } from '../enums/sla-status.enum';
import { TicketComment } from './ticket-comment.entity';
import { TicketAttachment } from './ticket-attachment.entity';
import { TicketHistory } from './ticket-history.entity';
import { SatisfactionSurvey } from './satisfaction-survey.entity';

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  code: string; // ej. SOP-0001

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 20 })
  type: TicketType;

  @Column({ type: 'varchar', length: 20 })
  priority: TicketPriority;

  @Column({ type: 'varchar', length: 20, default: TicketStatus.NEW })
  status: TicketStatus;

  @Column({ name: 'requester_id', type: 'uuid' })
  requesterId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'requester_id' })
  requester: User;

  @Column({ name: 'assigned_technician_id', type: 'uuid', nullable: true })
  assignedTechnicianId?: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'assigned_technician_id' })
  assignedTechnician?: User;

  @Column({ name: 'asset_id', type: 'uuid', nullable: true })
  assetId?: string;

  @Column({ name: 'parent_incident_id', type: 'uuid', nullable: true })
  parentIncidentId?: string;

  @ManyToOne(() => Ticket, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'parent_incident_id' })
  parentIncident?: Ticket;

  @Column({ name: 'sla_first_response_deadline', type: 'timestamptz' })
  slaFirstResponseDeadline: Date;

  @Column({ name: 'sla_resolution_deadline', type: 'timestamptz' })
  slaResolutionDeadline: Date;

  @Column({ name: 'first_response_at', type: 'timestamptz', nullable: true })
  firstResponseAt?: Date;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt?: Date;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt?: Date;

  @Column({ name: 'sla_status', type: 'varchar', length: 20, default: SlaStatus.ON_TIME })
  slaStatus: SlaStatus;

  @OneToMany(() => TicketComment, (comment) => comment.ticket)
  comments: TicketComment[];

  @OneToMany(() => TicketAttachment, (attachment) => attachment.ticket)
  attachments: TicketAttachment[];

  @OneToMany(() => TicketHistory, (history) => history.ticket)
  history: TicketHistory[];

  @OneToOne(() => SatisfactionSurvey, (survey) => survey.ticket)
  survey?: SatisfactionSurvey;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
