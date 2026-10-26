import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Relation,
} from 'typeorm';
import type { Asset } from './asset.entity';
import { MaintenanceType } from '../enums/maintenance-type.enum';

@Entity('asset_maintenances')
export class AssetMaintenance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'asset_id', type: 'uuid' })
  assetId: string;

  @ManyToOne('Asset', (asset: Asset) => asset.maintenances, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'asset_id' })
  asset: Relation<Asset>;

  @Column({ type: 'varchar', length: 20 })
  type: MaintenanceType;

  @Column({ name: 'scheduled_date', type: 'date' })
  scheduledDate: Date;

  @Column({ name: 'performed_date', type: 'date', nullable: true })
  performedDate?: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0.0 })
  cost: number;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'technician_notes', type: 'text', nullable: true })
  technicianNotes?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
