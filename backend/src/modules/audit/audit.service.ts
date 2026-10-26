import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

export interface CreateAuditLogParams {
  userId?: string;
  action: string;
  entity: string;
  entityId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async log(params: CreateAuditLogParams): Promise<AuditLog> {
    try {
      const entry = this.auditRepo.create(params);
      const saved = await this.auditRepo.save(entry);
      this.logger.log(`Audit: [${params.action}] on ${params.entity}:${params.entityId} by user ${params.userId || 'ANONYMOUS'}`);
      return saved;
    } catch (error) {
      this.logger.error(`Failed to record audit log: ${error.message}`, error.stack);
      // Don't crash the primary business logic if audit writing fails, but log error
      return null;
    }
  }

  async findRecent(limit = 100): Promise<AuditLog[]> {
    return this.auditRepo.find({
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['user'],
    });
  }
}
