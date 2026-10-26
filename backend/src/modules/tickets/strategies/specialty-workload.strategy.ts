import { Injectable } from '@nestjs/common';
import {
  TicketAssignmentStrategy,
  AssignCandidateInfo,
} from './ticket-assignment-strategy.interface';
import { User } from '../../users/entities/user.entity';
import { TicketType } from '../enums/ticket-type.enum';
import { Specialty } from '../../../common/enums/specialty.enum';

@Injectable()
export class SpecialtyAndWorkloadStrategy implements TicketAssignmentStrategy {
  readonly name = 'SpecialtyAndWorkload';

  private readonly typeToSpecialtyMap: Record<TicketType, Specialty> = {
    [TicketType.NETWORK]: Specialty.REDES,
    [TicketType.HARDWARE]: Specialty.HARDWARE,
    [TicketType.SOFTWARE]: Specialty.SOFTWARE,
    [TicketType.ACCESS]: Specialty.ACCESOS,
  };

  async assign(
    type: TicketType,
    candidates: AssignCandidateInfo[],
  ): Promise<User | null> {
    if (!candidates || candidates.length === 0) {
      return null;
    }

    const targetSpecialty = this.typeToSpecialtyMap[type];

    // 1. Filtrar técnicos con la especialidad requerida o especialidad "general"
    let matchingCandidates = candidates.filter(
      (c) =>
        c.technician.specialty === targetSpecialty ||
        c.technician.specialty === Specialty.GENERAL,
    );

    // Si ningún técnico tiene la especialidad exacta, considerar a todos los candidatos
    if (matchingCandidates.length === 0) {
      matchingCandidates = candidates;
    }

    // 2. Ordenar por menor cantidad de tickets activos (menor carga de trabajo)
    matchingCandidates.sort((a, b) => a.activeTicketsCount - b.activeTicketsCount);

    return matchingCandidates[0].technician;
  }
}
