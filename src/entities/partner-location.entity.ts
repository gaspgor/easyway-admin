import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, BaseEntity,
} from 'typeorm';
import { Partner } from './partner.entity.js';

export enum LocationType {
  MAIN = 'main',
  BRANCH = 'branch',
}

@Entity('partner_locations')
export class PartnerLocation extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'partner_id', type: 'uuid' })
  partnerId: string;

  @Column({ name: 'address', length: 500 })
  address: string;

  @Column({ name: 'lat', type: 'double precision' })
  lat: number;

  @Column({ name: 'lng', type: 'double precision' })
  lng: number;

  @Column({ name: 'type', length: 20, default: LocationType.MAIN })
  type: LocationType;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => Partner)
  @JoinColumn({ name: 'partner_id' })
  partner: Partner;
}
