import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Department } from './entities/department.entity';
import { Role } from '../../common/enums/role.enum';
import { Specialty } from '../../common/enums/specialty.enum';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Department)
    private readonly deptRepo: Repository<Department>,
    private readonly auditService: AuditService,
  ) {}

  async findAll(role?: Role): Promise<User[]> {
    const query = this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.department', 'department')
      .orderBy('user.fullName', 'ASC');

    if (role) {
      query.andWhere('user.role = :role', { role });
    }

    return query.getMany();
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['department', 'consents'],
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return user;
  }

  async findTechnicians(specialty?: Specialty): Promise<User[]> {
    const query = this.userRepo
      .createQueryBuilder('user')
      .where('user.role = :role', { role: Role.TECHNICIAN })
      .andWhere('user.isActive = :isActive', { isActive: true });

    if (specialty) {
      query.andWhere('(user.specialty = :specialty OR user.specialty = :general)', {
        specialty,
        general: Specialty.GENERAL,
      });
    }

    return query.getMany();
  }

  async toggleActive(id: string, adminUserId: string): Promise<User> {
    const user = await this.findById(id);
    const oldStatus = user.isActive;
    user.isActive = !oldStatus;
    const updated = await this.userRepo.save(user);

    await this.auditService.log({
      userId: adminUserId,
      action: user.isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
      entity: 'USERS',
      entityId: user.id,
      oldValues: { isActive: oldStatus },
      newValues: { isActive: user.isActive },
    });

    return updated;
  }

  async findAllDepartments(): Promise<Department[]> {
    return this.deptRepo.find({ order: { name: 'ASC' } });
  }

  async seedDefaults(): Promise<void> {
    const count = await this.deptRepo.count();
    if (count === 0) {
      this.logger.log('Seeding default departments for SME...');
      const defaultDepts = [
        { name: 'Tecnología e Informática', code: 'TI' },
        { name: 'Recursos Humanos', code: 'RRHH' },
        { name: 'Finanzas y Contabilidad', code: 'FIN' },
        { name: 'Operaciones y Logística', code: 'OPS' },
        { name: 'Ventas y Mercadeo', code: 'VEN' },
      ];
      for (const d of defaultDepts) {
        await this.deptRepo.save(this.deptRepo.create(d));
      }
      this.logger.log('Departments seeded successfully');
    }
  }
}
