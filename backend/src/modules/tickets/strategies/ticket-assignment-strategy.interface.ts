import { User } from '../../users/entities/user.entity';
import { TicketType } from '../enums/ticket-type.enum';

export interface AssignCandidateInfo {
  technician: User;
  activeTicketsCount: number;
}

export interface TicketAssignmentStrategy {
  readonly name: string;
  assign(
    type: TicketType,
    candidates: AssignCandidateInfo[],
  ): Promise<User | null>;
}
