import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddCommentDto {
  @ApiProperty({
    example: 'Se revisó la bandeja de papel, se retiró el papel doblado y se realizaron 3 impresiones de prueba exitosas.',
    description: 'Texto del comentario o avance técnico',
  })
  @IsString()
  @IsNotEmpty({ message: 'El comentario no puede estar vacío' })
  comment: string;

  @ApiPropertyOptional({
    example: false,
    default: false,
    description: 'Si es verdadero, la nota es interna y solo visible para técnicos y administradores',
  })
  @IsBoolean()
  @IsOptional()
  isInternal?: boolean;
}
