import { TicketPriority } from '../enums/ticket-priority.enum';
import { SlaStatus } from '../enums/sla-status.enum';

export interface SlaDeadlines {
  firstResponseDeadline: Date;
  resolutionDeadline: Date;
}

export class SlaCalculator {
  /**
   * Calcula los plazos de SLA para un ticket según su prioridad
   */
  static calculateDeadlines(priority: TicketPriority, baseDate: Date = new Date()): SlaDeadlines {
    const start = baseDate.getTime();
    let responseMinutes = 240; // Default Medium: 4 horas
    let resolutionMinutes = 1440; // Default Medium: 24 horas

    switch (priority) {
      case TicketPriority.CRITICAL:
        responseMinutes = 15; // 15 minutos
        resolutionMinutes = 120; // 2 horas
        break;
      case TicketPriority.HIGH:
        responseMinutes = 60; // 1 hora
        resolutionMinutes = 360; // 6 horas
        break;
      case TicketPriority.MEDIUM:
        responseMinutes = 240; // 4 horas
        resolutionMinutes = 1440; // 24 horas
        break;
      case TicketPriority.LOW:
        responseMinutes = 480; // 8 horas
        resolutionMinutes = 2880; // 48 horas
        break;
    }

    return {
      firstResponseDeadline: new Date(start + responseMinutes * 60 * 1000),
      resolutionDeadline: new Date(start + resolutionMinutes * 60 * 1000),
    };
  }

  /**
   * Evalúa el estado de cumplimiento del SLA en tiempo real
   */
  static evaluateStatus(
    now: Date,
    firstResponseDeadline: Date,
    resolutionDeadline: Date,
    firstResponseAt?: Date,
    resolvedAt?: Date,
  ): SlaStatus {
    const currentTime = now.getTime();
    const resDeadlineTime = resolutionDeadline.getTime();
    const respDeadlineTime = firstResponseDeadline.getTime();

    // 1. Si ya está resuelto, verificar si se cumplieron ambos plazos
    if (resolvedAt) {
      const isResolutionBreached = resolvedAt.getTime() > resDeadlineTime;
      const isResponseBreached = firstResponseAt ? firstResponseAt.getTime() > respDeadlineTime : false;
      return isResolutionBreached || isResponseBreached ? SlaStatus.BREACHED : SlaStatus.ON_TIME;
    }

    // 2. Si aún no está resuelto y ya superó la fecha límite de resolución
    if (currentTime > resDeadlineTime) {
      return SlaStatus.BREACHED;
    }

    // 3. Si aún no ha habido primera respuesta y ya superó la fecha límite de respuesta
    if (!firstResponseAt && currentTime > respDeadlineTime) {
      return SlaStatus.BREACHED;
    }

    // 4. Advertencia (WARNING): si queda menos del 20% del tiempo para la resolución
    const totalDuration = resDeadlineTime - (resDeadlineTime - 1440 * 60 * 1000); // base aproximada
    const timeRemaining = resDeadlineTime - currentTime;
    const warningThreshold = 60 * 60 * 1000; // Alerta si queda menos de 1 hora

    if (timeRemaining <= warningThreshold) {
      return SlaStatus.WARNING;
    }

    return SlaStatus.ON_TIME;
  }
}
