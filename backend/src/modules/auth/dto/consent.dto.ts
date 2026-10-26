import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ConsentDto {
  @ApiProperty({ example: true, description: 'Aceptación explícita de la política de datos' })
  @IsBoolean()
  @IsNotEmpty()
  accepted: boolean;

  @ApiPropertyOptional({ example: 'v1.0', description: 'Versión del aviso de privacidad' })
  @IsString()
  @IsOptional()
  policyVersion?: string;
}
