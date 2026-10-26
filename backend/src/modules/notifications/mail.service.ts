import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Ticket } from '../tickets/entities/ticket.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;
  private readonly mailFrom: string;
  private readonly frontendUrl: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST', 'localhost');
    const port = this.configService.get<number>('SMTP_PORT', 1025);
    const user = this.configService.get<string>('SMTP_USER', '');
    const pass = this.configService.get<string>('SMTP_PASS', '');

    this.mailFrom = this.configService.get<string>(
      'MAIL_FROM',
      '"SoporTI Mesa de Ayuda" <soporte@soporti.local>',
    );
    this.frontendUrl = this.configService.get<string>(
      'frontendUrl',
      'http://localhost:5173',
    );

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user ? { user, pass } : undefined,
    });
  }

  private getEmailTemplate(title: string, badge: string, contentHtml: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px; color: #1e293b; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
        .header { background: #0f172a; padding: 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 700; }
        .header p { margin: 4px 0 0; font-size: 13px; color: #94a3b8; }
        .content { padding: 30px; }
        .badge { display: inline-block; padding: 4px 10px; font-size: 12px; font-weight: 600; border-radius: 12px; background: #e0e7ff; color: #3730a3; margin-bottom: 16px; }
        .ticket-box { background: #f8fafc; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 4px; margin: 20px 0; }
        .ticket-title { font-weight: 700; font-size: 16px; margin: 0 0 6px; }
        .ticket-meta { font-size: 13px; color: #64748b; margin: 0; }
        .btn { display: inline-block; padding: 10px 20px; font-size: 14px; font-weight: 600; text-decoration: none; color: #ffffff !important; background: #2563eb; border-radius: 6px; margin-top: 15px; }
        .footer { background: #f8fafc; padding: 18px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>SoporTI</h1>
          <p>Mesa de Ayuda y Gestión de Activos TI</p>
        </div>
        <div class="content">
          <div class="badge">${badge}</div>
          <h2 style="margin-top:0; color:#0f172a;">${title}</h2>
          ${contentHtml}
        </div>
        <div class="footer">
          Este es un correo transaccional automático del sistema SoporTI.<br>
          En cumplimiento de la Ley 1581 de 2012 (Colombia), la información contenida es confidencial.
        </div>
      </div>
    </body>
    </html>
    `;
  }

  async sendTicketCreated(ticket: Ticket, recipient: User): Promise<void> {
    const content = `
      <p>Hola <strong>${recipient.fullName}</strong>,</p>
      <p>Tu solicitud ha sido registrada exitosamente en nuestra plataforma de soporte técnico.</p>
      <div class="ticket-box">
        <p class="ticket-title">[${ticket.code}] ${ticket.title}</p>
        <p class="ticket-meta"><strong>Tipo:</strong> ${ticket.type.toUpperCase()} | <strong>Prioridad:</strong> ${ticket.priority.toUpperCase()}</p>
        <p style="margin: 10px 0 0; font-size: 13px; color: #334155;">${ticket.description.slice(0, 200)}...</p>
      </div>
      <p>Un técnico asignado atenderá tu caso conforme al nivel de servicio (SLA).</p>
      <a href="${this.frontendUrl}/tickets/${ticket.id}" class="btn">Ver estado de mi Ticket</a>
    `;

    await this.sendMail(
      recipient.email,
      `[${ticket.code}] Solicitud de soporte creada exitosamente`,
      this.getEmailTemplate('Ticket Registrado', 'Nuevo Caso', content),
    );
  }

  async sendTicketAssigned(ticket: Ticket, technician: User): Promise<void> {
    const content = `
      <p>Hola <strong>${technician.fullName}</strong>,</p>
      <p>Se te ha asignado un nuevo ticket de soporte según tu especialidad y carga actual:</p>
      <div class="ticket-box" style="border-left-color: #8b5cf6;">
        <p class="ticket-title">[${ticket.code}] ${ticket.title}</p>
        <p class="ticket-meta"><strong>Prioridad:</strong> ${ticket.priority.toUpperCase()} | <strong>Plazo de Respuesta:</strong> ${ticket.slaFirstResponseDeadline.toLocaleString()}</p>
        <p style="margin: 10px 0 0; font-size: 13px; color: #334155;">${ticket.description.slice(0, 250)}...</p>
      </div>
      <a href="${this.frontendUrl}/tickets/${ticket.id}" class="btn" style="background:#7c3aed;">Atender Ticket</a>
    `;

    await this.sendMail(
      technician.email,
      `[Asignación] Ticket ${ticket.code}: ${ticket.title}`,
      this.getEmailTemplate('Nuevo Caso Asignado', 'Asignación Técnica', content),
    );
  }

  async sendTicketStatusChanged(
    ticket: Ticket,
    oldStatus: string,
    newStatus: string,
    recipient: User,
  ): Promise<void> {
    const content = `
      <p>Hola <strong>${recipient.fullName}</strong>,</p>
      <p>El estado de tu ticket ha sido actualizado:</p>
      <div class="ticket-box" style="border-left-color: #10b981;">
        <p class="ticket-title">[${ticket.code}] ${ticket.title}</p>
        <p class="ticket-meta"><strong>Estado anterior:</strong> ${oldStatus.toUpperCase()} → <strong>Nuevo estado:</strong> ${newStatus.toUpperCase()}</p>
      </div>
      <a href="${this.frontendUrl}/tickets/${ticket.id}" class="btn">Revisar Ticket</a>
    `;

    await this.sendMail(
      recipient.email,
      `[${ticket.code}] Actualización de estado: ${newStatus.toUpperCase()}`,
      this.getEmailTemplate('Estado de Ticket Actualizado', 'Actualización', content),
    );
  }

  async sendSlaAlert(ticket: Ticket, technician: User, isBreached: boolean): Promise<void> {
    const badge = isBreached ? 'SLA INCUMPLIDO' : 'ADVERTENCIA SLA';
    const borderCol = isBreached ? '#ef4444' : '#f59e0b';
    const content = `
      <p>Hola <strong>${technician.fullName}</strong>,</p>
      <p style="color: ${borderCol}; font-weight:600;">
        ${isBreached ? 'El tiempo límite acordado (SLA) para este ticket ha sido superado.' : 'El plazo de resolución de este ticket está próximo a vencer.'}
      </p>
      <div class="ticket-box" style="border-left-color: ${borderCol};">
        <p class="ticket-title">[${ticket.code}] ${ticket.title}</p>
        <p class="ticket-meta"><strong>Prioridad:</strong> ${ticket.priority.toUpperCase()} | <strong>Plazo Máximo:</strong> ${ticket.slaResolutionDeadline.toLocaleString()}</p>
      </div>
      <a href="${this.frontendUrl}/tickets/${ticket.id}" class="btn" style="background:${borderCol};">Gestionar Inmediatamente</a>
    `;

    await this.sendMail(
      technician.email,
      `[Alerta SLA ${badge}] ${ticket.code} - ${ticket.title}`,
      this.getEmailTemplate(`Alerta de Nivel de Servicio (${badge})`, badge, content),
    );
  }

  private async sendMail(to: string, subject: string, html: string): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: this.mailFrom,
        to,
        subject,
        html,
      });
      this.logger.log(`Email enviado con éxito a ${to} (ID: ${info.messageId})`);
    } catch (error) {
      this.logger.error(`Error al enviar correo a ${to}: ${error.message}`);
    }
  }
}
