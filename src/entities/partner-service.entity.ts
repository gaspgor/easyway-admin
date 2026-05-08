import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, BaseEntity } from 'typeorm';
import { ServiceCenter } from './service-center.entity.js';
import { Partner } from './partner.entity.js';

@Entity('partner_services')
export class PartnerService extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'service_center_id', type: 'uuid', nullable: true })
  serviceCenterId: string;

  @Column({ name: 'partner_id', type: 'uuid', nullable: true })
  partnerId: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  basePrice: number;

  @Column({ name: 'car_based_prices', type: 'jsonb', nullable: true })
  carBasedPrices: any[]; // e.g. [{"make": "Toyota", "model": "Prius", "price": 50}, {"make": "BMW", "price": 150}]

  @Column({ length: 3, default: 'USD' })
  currency: string;

  @Column({ name: 'estimated_duration_minutes', type: 'int', nullable: true })
  estimatedDurationMinutes: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  // UUIDs of partner_locations where this service is available
  @Column({ name: 'location_ids', type: 'jsonb', nullable: true })
  locationIds: string[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => ServiceCenter, { nullable: true })
  @JoinColumn({ name: 'service_center_id' })
  serviceCenter: ServiceCenter;

  @ManyToOne(() => Partner, { nullable: true })
  @JoinColumn({ name: 'partner_id' })
  partner: Partner;
}
