import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssetCategory } from '../enums/asset-category.enum';
import { AssetStatus } from '../enums/asset-status.enum';

export class CreateAssetDto {
  @ApiProperty({ example: 'Laptop ThinkPad E14 Gen 5', description: 'Nombre descriptivo del activo' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre del activo es obligatorio' })
  @MaxLength(150)
  name: string;

  @ApiProperty({ example: 'computer', enum: AssetCategory })
  @IsEnum(AssetCategory, { message: 'Categoría inválida' })
  @IsNotEmpty()
  category: AssetCategory;

  @ApiPropertyOptional({ example: 'Lenovo' })
  @IsString()
  @IsOptional()
  brand?: string;

  @ApiPropertyOptional({ example: 'ThinkPad E14 Gen 5' })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiPropertyOptional({ example: 'SN-ABC123XYZ789' })
  @IsString()
  @IsOptional()
  serialNumber?: string;

  @ApiPropertyOptional({ example: 'assigned', enum: AssetStatus, default: AssetStatus.IN_STOCK })
  @IsEnum(AssetStatus)
  @IsOptional()
  status?: AssetStatus;

  @ApiPropertyOptional({ example: '2025-03-15' })
  @IsDateString({}, { message: 'Fecha de compra inválida' })
  @IsOptional()
  purchaseDate?: string;

  @ApiPropertyOptional({ example: '2028-03-15' })
  @IsDateString({}, { message: 'Fecha de garantía inválida' })
  @IsOptional()
  warrantyExpiration?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Empleado responsable' })
  @IsUUID('4')
  @IsOptional()
  assignedToUserId?: string;

  @ApiPropertyOptional({ description: 'ID del departamento' })
  @IsUUID('4')
  @IsOptional()
  departmentId?: string;
}
