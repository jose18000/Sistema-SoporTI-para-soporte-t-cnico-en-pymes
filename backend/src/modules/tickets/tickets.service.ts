import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between } from 'typeorm';
import { Ticket } from './entities/ticket.entity';
import { TicketComment } from './entities/ticket-comment.entity';
import { TicketHistory } from './entities/ticket-history.entity';
import { SatisfactionSurvey } from './entities/satisfaction-survey.entity';
import { TicketAttachment } from './entities/ticket-attachment.entity';
import { User } from '../users/entities/user.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { FilterTicketsDto } from './dto/filter-tickets.dto';
import { AddCommentDto } from './dto/add-comment.dto';
import { SubmitSurveyDto } from './dto/submit-survey.dto';
import { TicketStatus } from './enums/ticket-status.enum';
import { SlaStatus } from './enums/sla-status.enum';
import { Role } from '../../common/enums/role.enum';
import { SlaCalculator } from './utils/sla-calculator.util';
import { SpecialtyAndWorkloadStrategy } from './strategies/specialty-workload.strategy';
import { AssignCandidateInfo } from './strategies/ticket-assignment-strategy.interface';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);

  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
    @InjectRepository(TicketComment)
    private readonly commentRepo: Repository<TicketComment>,
    @InjectRepository(TicketHistory)
    private readonly historyRepo: Repository<TicketHistory>,
    @InjectRepository(SatisfactionSurvey)
    private readonly surveyRepo: Repository<SatisfactionSurvey>,
    @InjectRepository(TicketAttachment)
    private readonly attachmentRepo: Repository<TicketAttachment>,
    private readonly usersService: UsersService,
    private readonly specialtyStrategy: SpecialtyAndWorkloadStrategy,
    private readonly notificationsService: NotificationsService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Genera el siguiente código legible (ej. SOP-0001) usando la secuencia de PostgreSQL
   */
  private async getNextTicketCode(): Promise<string> {
    const result = await this.ticketRepo.query("SELECT nextval('ticket_code_seq') AS seq;");
    const seq = result[0]?.seq || 1;
    return `SOP-${seq.toString().padStart(4, '0')}`;
  }

  /**
   * Detecta si hay incidentes masivos similares en los últimos 30 minutos
   */
  private async detectMassIncident(type: string, title: string): Promise<string | null> {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const recentTickets = await this.ticketRepo.find({
      where: {
        type: type as any,
        createdAt: Between(thirtyMinutesAgo, new Date()),
      },
      order: { createdAt: 'ASC' },
    });

    if (recentTickets.length >= 2) {
      // Si ya existen 2 o más tickets del mismo tipo recientemente, agrupar bajo el primero como incidente masivo
      return recentTickets[0].id;
    }
    return null;
  }

  async create(dto: CreateTicketDto, requester: User): Promise<Ticket> {
    const code = await this.getNextTicketCode();
    const deadlines = SlaCalculator.calculateDeadlines(dto.priority);

    // 1. Asignación automática usando el patrón Strategy
    const allTechnicians = await this.usersService.findTechnicians();
    const candidateInfos: AssignCandidateInfo[] = [];

    for (const tech of allTechnicians) {
      const activeTicketsCount = await this.ticketRepo.count({
        where: {
          assignedTechnicianId: tech.id,
          status: In([TicketStatus.ASSIGNED, TicketStatus.IN_PROGRESS]),
        },
      });
      candidateInfos.push({ technician: tech, activeTicketsCount });
    }

    const assignedTechnician = await this.specialtyStrategy.assign(dto.type, candidateInfos);

    // 2. Detección de incidentes masivos
    const parentIncidentId = await this.detectMassIncident(dto.type, dto.title);

    // 3. Crear entidad Ticket
    const ticket = this.ticketRepo.create({
      code,
      title: dto.title.trim(),
      description: dto.description.trim(),
      type: dto.type,
      priority: dto.priority,
      status: assignedTechnician ? TicketStatus.ASSIGNED : TicketStatus.NEW,
      requesterId: requester.id,
      assignedTechnicianId: assignedTechnician ? assignedTechnician.id : null,
      assetId: dto.assetId || null,
      parentIncidentId,
      slaFirstResponseDeadline: deadlines.firstResponseDeadline,
      slaResolutionDeadline: deadlines.resolutionDeadline,
      slaStatus: SlaStatus.ON_TIME,
    });

    const savedTicket = await this.ticketRepo.save(ticket);

    // 4. Registro en historial
    await this.historyRepo.save(
      this.historyRepo.create({
        ticketId: savedTicket.id,
        changedById: requester.id,
        fieldChanged: 'status',
        oldValue: null,
        newValue: savedTicket.status,
      }),
    );

    if (assignedTechnician) {
      await this.historyRepo.save(
        this.historyRepo.create({
          ticketId: savedTicket.id,
          changedById: requester.id,
          fieldChanged: 'assigned_technician',
          oldValue: null,
          newValue: assignedTechnician.fullName,
        }),
      );
    }

    // 5. Notificaciones (In-App y Correo en Mailpit)
    await this.notificationsService.notifyTicketCreated(
      savedTicket,
      requester,
      assignedTechnician || undefined,
    );

    // 6. Auditoría
    await this.auditService.log({
      userId: requester.id,
      action: 'CREATE_TICKET',
      entity: 'TICKETS',
      entityId: savedTicket.id,
      newValues: { code: savedTicket.code, priority: savedTicket.priority, type: savedTicket.type },
    });

    return this.findOne(savedTicket.id, requester);
  }

  async findAll(filter: FilterTicketsDto, user: User) {
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const qb = this.ticketRepo
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.requester', 'requester')
      .leftJoinAndSelect('ticket.assignedTechnician', 'technician')
      .leftJoinAndSelect('ticket.survey', 'survey')
      .orderBy('ticket.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    // Restricciones RBAC: Empleados solo ven sus tickets
    if (user.role === Role.EMPLOYEE) {
      qb.andWhere('ticket.requesterId = :requesterId', { requesterId: user.id });
    }

    // Filtros opcionales
    if (filter.status) {
      qb.andWhere('ticket.status = :status', { status: filter.status });
    }
    if (filter.priority) {
      qb.andWhere('ticket.priority = :priority', { priority: filter.priority });
    }
    if (filter.type) {
      qb.andWhere('ticket.type = :type', { type: filter.type });
    }
    if (filter.search) {
      qb.andWhere('(ticket.title ILIKE :search OR ticket.code ILIKE :search)', {
        search: `%${filter.search}%`,
      });
    }

    const [items, total] = await qb.getManyAndCount();

    return {
      data: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, user: User): Promise<Ticket> {
    const ticket = await this.ticketRepo.findOne({
      where: { id },
      relations: [
        'requester',
        'assignedTechnician',
        'comments',
        'comments.author',
        'history',
        'history.changedBy',
        'survey',
        'attachments',
      ],
      order: {
        comments: { createdAt: 'ASC' },
        history: { createdAt: 'DESC' },
      },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket con ID ${id} no encontrado`);
    }

    // Restricción RBAC
    if (user.role === Role.EMPLOYEE && ticket.requesterId !== user.id) {
      throw new ForbiddenException('No tienes permisos para ver este ticket');
    }

    // Filtrar notas internas si el usuario es un empleado
    if (user.role === Role.EMPLOYEE && ticket.comments) {
      ticket.comments = ticket.comments.filter((c) => !c.isInternal);
    }

    return ticket;
  }

  async updateStatus(id: string, dto: UpdateTicketStatusDto, user: User): Promise<Ticket> {
    const ticket = await this.findOne(id, user);
    const oldStatus = ticket.status;

    if (oldStatus === dto.status) {
      return ticket;
    }

    // Empleados solo pueden cerrar o calificar tickets resueltos
    if (user.role === Role.EMPLOYEE && dto.status !== TicketStatus.CLOSED) {
      throw new ForbiddenException('Los empleados solo pueden cerrar sus tickets resueltos');
    }

    const now = new Date();
    ticket.status = dto.status;

    // Actualización de tiempos de SLA
    if (
      !ticket.firstResponseAt &&
      (dto.status === TicketStatus.IN_PROGRESS || user.role === Role.TECHNICIAN)
    ) {
      ticket.firstResponseAt = now;
    }

    if (dto.status === TicketStatus.RESOLVED) {
      ticket.resolvedAt = now;
    }

    if (dto.status === TicketStatus.CLOSED) {
      ticket.closedAt = now;
    }

    // Reevaluar estado de SLA
    ticket.slaStatus = SlaCalculator.evaluateStatus(
      now,
      ticket.slaFirstResponseDeadline,
      ticket.slaResolutionDeadline,
      ticket.firstResponseAt,
      ticket.resolvedAt,
    );

    const updatedTicket = await this.ticketRepo.save(ticket);

    // Registro de historial
    await this.historyRepo.save(
      this.historyRepo.create({
        ticketId: ticket.id,
        changedById: user.id,
        fieldChanged: 'status',
        oldValue: oldStatus,
        newValue: dto.status,
      }),
    );

    // Si viene con comentario explicativo
    if (dto.comment) {
      await this.commentRepo.save(
        this.commentRepo.create({
          ticketId: ticket.id,
          authorId: user.id,
          comment: dto.comment,
          isInternal: false,
        }),
      );
    }

    // Notificaciones
    if (ticket.requester) {
      await this.notificationsService.notifyStatusChanged(
        updatedTicket,
        oldStatus,
        dto.status,
        ticket.requester,
      );
    }

    // Auditoría
    await this.auditService.log({
      userId: user.id,
      action: 'UPDATE_TICKET_STATUS',
      entity: 'TICKETS',
      entityId: ticket.id,
      oldValues: { status: oldStatus },
      newValues: { status: dto.status },
    });

    return this.findOne(ticket.id, user);
  }

  async assignTechnician(id: string, technicianId: string, user: User): Promise<Ticket> {
    if (user.role === Role.EMPLOYEE) {
      throw new ForbiddenException('No tienes permisos para reasignar técnicos');
    }

    const ticket = await this.findOne(id, user);
    const technician = await this.usersService.findById(technicianId);

    if (technician.role !== Role.TECHNICIAN && technician.role !== Role.ADMIN) {
      throw new BadRequestException('El usuario asignado debe tener rol técnico o administrador');
    }

    const oldTechName = ticket.assignedTechnician ? ticket.assignedTechnician.fullName : 'Sin asignar';
    ticket.assignedTechnicianId = technician.id;
    if (ticket.status === TicketStatus.NEW) {
      ticket.status = TicketStatus.ASSIGNED;
    }

    const updated = await this.ticketRepo.save(ticket);

    // Registro en historial
    await this.historyRepo.save(
      this.historyRepo.create({
        ticketId: ticket.id,
        changedById: user.id,
        fieldChanged: 'assigned_technician',
        oldValue: oldTechName,
        newValue: technician.fullName,
      }),
    );

    await this.notificationsService.notifyTicketAssigned(updated, technician);

    await this.auditService.log({
      userId: user.id,
      action: 'ASSIGN_TICKET',
      entity: 'TICKETS',
      entityId: ticket.id,
      oldValues: { technician: oldTechName },
      newValues: { technician: technician.fullName },
    });

    return this.findOne(ticket.id, user);
  }

  async addComment(id: string, dto: AddCommentDto, user: User): Promise<TicketComment> {
    const ticket = await this.findOne(id, user);

    // Un empleado no puede dejar notas internas
    const isInternal = user.role === Role.EMPLOYEE ? false : !!dto.isInternal;

    const comment = this.commentRepo.create({
      ticketId: ticket.id,
      authorId: user.id,
      comment: dto.comment.trim(),
      isInternal,
    });

    const saved = await this.commentRepo.save(comment);

    // Si es la primera respuesta del técnico, registrar timestamp de SLA
    if (user.role === Role.TECHNICIAN && !ticket.firstResponseAt) {
      ticket.firstResponseAt = new Date();
      await this.ticketRepo.save(ticket);
    }

    return saved;
  }

  async submitSurvey(ticketId: string, dto: SubmitSurveyDto, user: User): Promise<SatisfactionSurvey> {
    const ticket = await this.findOne(ticketId, user);

    if (ticket.requesterId !== user.id) {
      throw new ForbiddenException('Solo el usuario que solicitó el ticket puede calificar el servicio');
    }

    if (ticket.status !== TicketStatus.RESOLVED && ticket.status !== TicketStatus.CLOSED) {
      throw new BadRequestException('Solo se pueden calificar tickets resueltos o cerrados');
    }

    const existingSurvey = await this.surveyRepo.findOne({ where: { ticketId } });
    if (existingSurvey) {
      throw new BadRequestException('Este ticket ya cuenta con una encuesta de satisfacción registrada');
    }

    const survey = this.surveyRepo.create({
      ticketId,
      rating: dto.rating,
      feedback: dto.feedback?.trim(),
    });

    const saved = await this.surveyRepo.save(survey);

    // Si el ticket estaba en RESUELTO, cerrarlo automáticamente tras la encuesta
    if (ticket.status === TicketStatus.RESOLVED) {
      ticket.status = TicketStatus.CLOSED;
      ticket.closedAt = new Date();
      await this.ticketRepo.save(ticket);
    }

    return saved;
  }

  /**
   * Tarea periódica para detectar y alertar incumplimientos de SLA
   */
  async checkSlaAlerts(): Promise<number> {
    const now = new Date();
    const openTickets = await this.ticketRepo.find({
      where: {
        status: In([TicketStatus.NEW, TicketStatus.ASSIGNED, TicketStatus.IN_PROGRESS, TicketStatus.ON_HOLD]),
      },
      relations: ['assignedTechnician'],
    });

    let alertsSent = 0;
    for (const ticket of openTickets) {
      const newStatus = SlaCalculator.evaluateStatus(
        now,
        ticket.slaFirstResponseDeadline,
        ticket.slaResolutionDeadline,
        ticket.firstResponseAt,
        ticket.resolvedAt,
      );

      if (newStatus !== ticket.slaStatus) {
        ticket.slaStatus = newStatus;
        await this.ticketRepo.save(ticket);

        if ((newStatus === SlaStatus.WARNING || newStatus === SlaStatus.BREACHED) && ticket.assignedTechnician) {
          await this.notificationsService.notifySlaAlert(
            ticket,
            ticket.assignedTechnician,
            newStatus === SlaStatus.BREACHED,
          );
          alertsSent++;
        }
      }
    }
    return alertsSent;
  }
}
