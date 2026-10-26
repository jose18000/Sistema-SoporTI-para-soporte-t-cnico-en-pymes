import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Relation,
} from 'typeorm';
import type { Asset } from './asset.entity';
import { LicenseStatus } from '../enums/license-status.enum';

@Entity('licenses')
export class License {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'asset_id', type: 'uuid', nullable: true })
  assetId?: string;

  @ManyToOne('Asset', (asset: Asset) => asset.licenses, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'asset_id' })
  asset?: Relation<Asset>;

  @Column({ name: 'software_name', type: 'varchar', length: 120 })
  softwareName: string;

  @Column({ name: 'license_key_encrypted', type: 'varchar', length: 255, nullable: true })
  licenseKeyEncrypted?: string;

  @Column({ name: 'expiration_date', type: 'date', nullable: true })
  expirationDate?: Date;

  @Column({ name: 'seats_total', type: 'int', default: 1 })
  seatsTotal: number;

  @Column({ name: 'seats_used', type: 'int', default: 0 })
  seatsUsed: number;

  @Column({ type: 'varchar', length: 20, default: LicenseStatus.ACTIVE })
  status: LicenseStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
