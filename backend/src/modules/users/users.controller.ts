import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Department } from './entities/department.entity';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { Specialty } from '../../common/enums/specialty.enum';

@ApiTags('Usuarios y Departamentos (RBAC)')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(Role.ADMIN, Role.TECHNICIAN)
  @ApiOperation({
    summary: 'Listar usuarios del sistema',
    description: 'Solo administradores y técnicos pueden consultar la lista general de usuarios',
  })
  @ApiQuery({ name: 'role', enum: Role, required: false })
  async findAll(@Query('role') role?: Role): Promise<User[]> {
    return this.usersService.findAll(role);
  }

  @Get('technicians')
  @Roles(Role.ADMIN, Role.TECHNICIAN)
  @ApiOperation({
    summary: 'Listar técnicos activos',
    description: 'Permite filtrar técnicos por especialidad (hardware, redes, etc.) para asignación de tickets',
  })
  @ApiQuery({ name: 'specialty', enum: Specialty, required: false })
  async findTechnicians(@Query('specialty') specialty?: Specialty): Promise<User[]> {
    return this.usersService.findTechnicians(specialty);
  }

  @Get('departments')
  @ApiOperation({
    summary: 'Listar áreas / departamentos de la pyme',
    description: 'Devuelve todos los departamentos para asignación de empleados o equipos',
  })
  async findAllDepartments(): Promise<Department[]> {
    return this.usersService.findAllDepartments();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.TECHNICIAN)
  @ApiOperation({ summary: 'Obtener detalle de un usuario por ID' })
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<User> {
    return this.usersService.findById(id);
  }

  @Patch(':id/toggle-active')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Activar o desactivar cuenta de usuario',
    description: 'Solo accesible por administradores. Registra auditoría automática.',
  })
  async toggleActive(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') adminId: string,
  ): Promise<User> {
    return this.usersService.toggleActive(id, adminId);
  }
}
