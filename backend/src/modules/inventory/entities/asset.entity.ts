import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Relation,
} from 'typeorm';
import { AssetCategory } from '../enums/asset-category.enum';
import { AssetStatus } from '../enums/asset-status.enum';
import { User } from '../../users/entities/user.entity';
import { Department } from '../../users/entities/department.entity';
import type { Ticket } from '../../tickets/entities/ticket.entity';
import type { AssetMaintenance } from './asset-maintenance.entity';
import type { License } from './license.entity';

@Entity('assets')
export class Asset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string; // ej. ACT-0001 (Placa de inventario)

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 30 })
  category: AssetCategory;

  @Column({ type: 'varchar', length: 80, nullable: true })
  brand?: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  model?: string;

  @Column({ name: 'serial_number', type: 'varchar', length: 100, unique: true, nullable: true })
  serialNumber?: string;

  @Column({ type: 'varchar', length: 20, default: AssetStatus.IN_STOCK })
  status: AssetStatus;

  @Column({ name: 'purchase_date', type: 'date', nullable: true })
  purchaseDate?: Date;

  @Column({ name: 'warranty_expiration', type: 'date', nullable: true })
  warrantyExpiration?: Date;

  @Column({ name: 'assigned_to_user_id', type: 'uuid', nullable: true })
  assignedToUserId?: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'assigned_to_user_id' })
  assignedToUser?: Relation<User>;

  @Column({ name: 'department_id', type: 'uuid', nullable: true })
  departmentId?: string;

  @ManyToOne(() => Department, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'department_id' })
  department?: Relation<Department>;

  @Column({ name: 'qr_token', type: 'varchar', length: 100, unique: true })
  qrToken: string;

  @OneToMany('Ticket', (ticket: Ticket) => ticket.asset)
  tickets: Relation<Ticket[]>;

  @OneToMany('AssetMaintenance', (m: AssetMaintenance) => m.asset)
  maintenances: Relation<AssetMaintenance[]>;

  @OneToMany('License', (lic: License) => lic.asset)
  licenses: Relation<License[]>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
