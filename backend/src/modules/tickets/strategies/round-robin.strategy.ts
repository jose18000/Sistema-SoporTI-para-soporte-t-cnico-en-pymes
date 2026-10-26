import { Injectable } from '@nestjs/common';
import {
  TicketAssignmentStrategy,
  AssignCandidateInfo,
} from './ticket-assignment-strategy.interface';
import { User } from '../../users/entities/user.entity';
import { TicketType } from '../enums/ticket-type.enum';

@Injectable()
export class RoundRobinStrategy implements TicketAssignmentStrategy {
  readonly name = 'RoundRobin';
  private currentIndex = 0;

  async assign(
    type: TicketType,
    candidates: AssignCandidateInfo[],
  ): Promise<User | null> {
    if (!candidates || candidates.length === 0) {
      return null;
    }

    const assigned = candidates[this.currentIndex % candidates.length].technician;
    this.currentIndex++;
    return assigned;
  }
}
