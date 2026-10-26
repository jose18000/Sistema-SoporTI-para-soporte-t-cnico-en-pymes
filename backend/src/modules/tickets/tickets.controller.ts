import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { AssignTicketDto } from './dto/assign-ticket.dto';
import { AddCommentDto } from './dto/add-comment.dto';
import { SubmitSurveyDto } from './dto/submit-survey.dto';
import { FilterTicketsDto } from './dto/filter-tickets.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { User } from '../users/entities/user.entity';

@ApiTags('Mesa de Ayuda (Tickets & SLA)')
@ApiBearerAuth('JWT-auth')
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear un nuevo ticket de soporte',
    description: 'Genera código SOP-XXXX, calcula plazos de SLA y asigna automáticamente técnico por especialidad y carga',
  })
  @ApiResponse({ status: 201, description: 'Ticket creado exitosamente' })
  async create(
    @Body() dto: CreateTicketDto,
    @CurrentUser() user: User,
  ) {
    return this.ticketsService.create(dto, user);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar tickets con filtros y paginación',
    description: 'Empleados ven sus propios tickets; técnicos y administradores ven la mesa de ayuda completa',
  })
  async findAll(
    @Query() filter: FilterTicketsDto,
    @CurrentUser() user: User,
  ) {
    return this.ticketsService.findAll(filter, user);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Consultar detalle completo de un ticket',
    description: 'Devuelve ticket, comentarios (notas internas filtradas según rol), historial de cambios y encuesta',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.ticketsService.findOne(id, user);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Actualizar estado del ticket (Flujo de vida)',
    description: 'Cambia estado (new → in_progress → resolved → closed) y computa tiempos de respuesta y resolución',
  })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTicketStatusDto,
    @CurrentUser() user: User,
  ) {
    return this.ticketsService.updateStatus(id, dto, user);
  }

  @Patch(':id/assign')
  @Roles(Role.ADMIN, Role.TECHNICIAN)
  @ApiOperation({
    summary: 'Reasignar técnico al ticket',
    description: 'Asigna manualmente un técnico específico y notifica al involucrado',
  })
  async assign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignTicketDto,
    @CurrentUser() user: User,
  ) {
    return this.ticketsService.assignTechnician(id, dto.technicianId, user);
  }

  @Post(':id/comments')
  @ApiOperation({
    summary: 'Agregar comentario o avance al ticket',
    description: 'Permite registrar notas públicas (visibles al empleado) o notas internas (solo técnicos)',
  })
  async addComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddCommentDto,
    @CurrentUser() user: User,
  ) {
    return this.ticketsService.addComment(id, dto, user);
  }

  @Post(':id/survey')
  @ApiOperation({
    summary: 'Calificar servicio al cerrar ticket (Encuesta de satisfacción)',
    description: 'Registro de 1 a 5 estrellas y retroalimentación para tickets resueltos o cerrados',
  })
  async submitSurvey(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitSurveyDto,
    @CurrentUser() user: User,
  ) {
    return this.ticketsService.submitSurvey(id, dto, user);
  }

  @Post('check-sla')
  @Roles(Role.ADMIN, Role.TECHNICIAN)
  @ApiOperation({
    summary: 'Ejecutar verificación y alertas de SLA',
    description: 'Evalúa tickets abiertos y emite alertas de advertencia o incumplimiento hacia Mailpit',
  })
  async checkSla() {
    const alertsSent = await this.ticketsService.checkSlaAlerts();
    return { message: 'Verificación de SLA ejecutada', alertsSent };
  }
}
