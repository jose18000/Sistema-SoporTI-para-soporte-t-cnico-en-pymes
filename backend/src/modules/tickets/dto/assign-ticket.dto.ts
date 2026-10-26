import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignTicketDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'UUID del técnico al que se reasigna el ticket',
  })
  @IsUUID('4', { message: 'El ID del técnico debe ser un UUID válido' })
  @IsNotEmpty()
  technicianId: string;
}
