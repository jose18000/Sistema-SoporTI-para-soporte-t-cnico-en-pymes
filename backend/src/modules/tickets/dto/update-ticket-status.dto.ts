import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TicketStatus } from '../enums/ticket-status.enum';

export class UpdateTicketStatusDto {
  @ApiProperty({
    example: TicketStatus.IN_PROGRESS,
    enum: TicketStatus,
    description: 'Nuevo estado del ticket',
  })
  @IsEnum(TicketStatus, { message: 'Estado inválido' })
  @IsNotEmpty()
  status: TicketStatus;

  @ApiPropertyOptional({
    example: 'Iniciando diagnóstico presencial en la sede de finanzas.',
    description: 'Comentario opcional para registrar el motivo del cambio',
  })
  @IsString()
  @IsOptional()
  comment?: string;
}
