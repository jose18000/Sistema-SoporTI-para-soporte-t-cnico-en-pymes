import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubmitSurveyDto {
  @ApiProperty({ example: 5, minimum: 1, maximum: 5, description: 'Calificación de satisfacción (1 a 5 estrellas)' })
  @IsInt({ message: 'La calificación debe ser un número entero' })
  @Min(1, { message: 'La calificación mínima es 1' })
  @Max(5, { message: 'La calificación máxima es 5' })
  @IsNotEmpty()
  rating: number;

  @ApiPropertyOptional({ example: 'Excelente atención, resolvieron el atasco de inmediato.', description: 'Comentario opcional' })
  @IsString()
  @IsOptional()
  feedback?: string;
}
