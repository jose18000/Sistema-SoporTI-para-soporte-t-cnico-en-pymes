import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  IsBoolean,
  Equals,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../../common/enums/role.enum';
import { Specialty } from '../../../common/enums/specialty.enum';

export class RegisterDto {
  @ApiProperty({ example: 'juan.perez@empresa.com', description: 'Correo electrónico corporativo' })
  @IsEmail({}, { message: 'El correo electrónico no tiene un formato válido' })
  @IsNotEmpty({ message: 'El correo electrónico es requerido' })
  email: string;

  @ApiProperty({ example: 'MiClaveSegura2026*', minLength: 8, description: 'Contraseña del usuario' })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  password: string;

  @ApiProperty({ example: 'Juan Pérez García', description: 'Nombre completo' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre completo es requerido' })
  fullName: string;

  @ApiPropertyOptional({ example: '+57 300 123 4567', description: 'Teléfono o WhatsApp' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'admin', enum: Role, default: Role.EMPLOYEE })
  @IsEnum(Role, { message: 'Rol inválido. Debe ser admin, technician o employee' })
  @IsOptional()
  role?: Role;

  @ApiPropertyOptional({ example: 'hardware', enum: Specialty, description: 'Especialidad (solo técnicos)' })
  @IsEnum(Specialty, { message: 'Especialidad inválida' })
  @IsOptional()
  specialty?: Specialty;

  @ApiPropertyOptional({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', description: 'ID de departamento' })
  @IsUUID('4', { message: 'El ID de departamento debe ser un UUID válido' })
  @IsOptional()
  departmentId?: string;

  @ApiProperty({
    example: true,
    description: 'Consentimiento explícito de tratamiento de datos personales conforme a la Ley 1581 de 2012',
  })
  @IsBoolean({ message: 'El consentimiento debe ser un booleano' })
  @Equals(true, { message: 'Debe aceptar la política de tratamiento de datos personales (Ley 1581) para registrarse' })
  dataConsentAccepted: boolean;
}
