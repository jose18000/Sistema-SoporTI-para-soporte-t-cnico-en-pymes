import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TicketType } from '../enums/ticket-type.enum';
import { TicketPriority } from '../enums/ticket-priority.enum';

export class CreateTicketDto {
  @ApiProperty({
    example: 'La impresora del área de finanzas no responde y tiene atasco',
    description: 'Título resumido del incidente',
  })
  @IsString()
  @IsNotEmpty({ message: 'El título del ticket es obligatorio' })
  @MinLength(5, { message: 'El título debe tener al menos 5 caracteres' })
  @MaxLength(200, { message: 'El título no puede exceder 200 caracteres' })
  title: string;

  @ApiProperty({
    example: 'Al enviar a imprimir facturas desde el equipo de contabilidad, la impresora HP emite un pitido y la bandeja queda trabada.',
    description: 'Descripción detallada de la falla o requerimiento',
  })
  @IsString()
  @IsNotEmpty({ message: 'La descripción del ticket es obligatoria' })
  @MinLength(10, { message: 'La descripción debe tener al menos 10 caracteres' })
  description: string;

  @ApiProperty({
    example: TicketType.HARDWARE,
    enum: TicketType,
    description: 'Tipo de incidente: network, software, hardware, access',
  })
  @IsEnum(TicketType, { message: 'Tipo de ticket inválido' })
  @IsNotEmpty()
  type: TicketType;

  @ApiProperty({
    example: TicketPriority.HIGH,
    enum: TicketPriority,
    description: 'Prioridad calculada o asignada: low, medium, high, critical',
  })
  @IsEnum(TicketPriority, { message: 'Prioridad inválida' })
  @IsNotEmpty()
  priority: TicketPriority;

  @ApiPropertyOptional({
    example: 'd9b2d63d-a233-4123-8478-f9b87bbf1111',
    description: 'ID del activo de inventario vinculado al problema',
  })
  @IsUUID('4', { message: 'El ID del equipo debe ser un UUID válido' })
  @IsOptional()
  assetId?: string;
}
