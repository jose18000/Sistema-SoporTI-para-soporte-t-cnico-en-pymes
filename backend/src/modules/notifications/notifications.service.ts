import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { MailService } from './mail.service';
import { Ticket } from '../tickets/entities/ticket.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,
    private readonly mailService: MailService,
  ) {}

  async createInApp(
    userId: string,
    title: string,
    message: string,
    type: string,
    metadata?: Record<string, any>,
  ): Promise<Notification> {
    const notif = this.notifRepo.create({
      userId,
      title,
      message,
      type,
      metadata,
    });
    return this.notifRepo.save(notif);
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    return this.notifRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notif = await this.notifRepo.findOne({ where: { id, userId } });
    if (notif) {
      notif.isRead = true;
      return this.notifRepo.save(notif);
    }
    return null;
  }

  async notifyTicketCreated(ticket: Ticket, requester: User, assignedTechnician?: User): Promise<void> {
    // 1. Notificación In-App para empleado
    await this.createInApp(
      requester.id,
      `Ticket Creado: ${ticket.code}`,
      `Tu ticket "${ticket.title}" ha sido registrado con éxito.`,
      'ticket_created',
      { ticketId: ticket.id },
    );

    // 2. Correo al empleado
    await this.mailService.sendTicketCreated(ticket, requester);

    // 3. Si se asignó un técnico de inmediato, notificar al técnico
    if (assignedTechnician) {
      await this.notifyTicketAssigned(ticket, assignedTechnician);
    }
  }

  async notifyTicketAssigned(ticket: Ticket, technician: User): Promise<void> {
    await this.createInApp(
      technician.id,
      `Nuevo Ticket Asignado: ${ticket.code}`,
      `Se te ha asignado el ticket "${ticket.title}" (${ticket.priority.toUpperCase()}).`,
      'ticket_assigned',
      { ticketId: ticket.id },
    );

    await this.mailService.sendTicketAssigned(ticket, technician);
  }

  async notifyStatusChanged(
    ticket: Ticket,
    oldStatus: string,
    newStatus: string,
    recipient: User,
  ): Promise<void> {
    await this.createInApp(
      recipient.id,
      `Ticket ${ticket.code} Actualizado`,
      `Estado cambiado de ${oldStatus.toUpperCase()} a ${newStatus.toUpperCase()}`,
      'ticket_updated',
      { ticketId: ticket.id, newStatus },
    );

    await this.mailService.sendTicketStatusChanged(ticket, oldStatus, newStatus, recipient);
  }

  async notifySlaAlert(ticket: Ticket, technician: User, isBreached: boolean): Promise<void> {
    const title = isBreached ? `🚨 SLA INCUMPLIDO: ${ticket.code}` : `⚠️ Alerta SLA: ${ticket.code}`;
    await this.createInApp(
      technician.id,
      title,
      `El ticket "${ticket.title}" requiere atención inmediata por nivel de servicio.`,
      'sla_warning',
      { ticketId: ticket.id, isBreached },
    );

    await this.mailService.sendSlaAlert(ticket, technician, isBreached);
  }
}
