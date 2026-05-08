import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, BaseEntity } from 'typeorm';
import { ServiceCenter } from './service-center.entity.js';
import { Partner } from './partner.entity.js';

@Entity('partner_products')
export class PartnerProduct extends BaseEntity {
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
  price: number;

  @Column({ length: 3, default: 'USD' })
  currency: string;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_universal', default: false })
  isUniversal: boolean;

  @Column({ type: 'jsonb', nullable: true })
  attributes: any;

  @Column({ name: 'product_type', length: 100, nullable: true })
  productType: string;

  @Column({ name: 'compatible_vehicles', type: 'jsonb', nullable: true })
  compatibleVehicles: any[];

  // Legacy — no longer populated
  @Column({ name: 'compatible_makes', type: 'jsonb', nullable: true })
  compatibleMakes: string[];

  @Column({ name: 'compatible_models', type: 'jsonb', nullable: true })
  compatibleModels: string[];

  @Column({ name: 'compatible_years', type: 'jsonb', nullable: true })
  compatibleYears: string[];

  // UUIDs of partner_locations where this product is available
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
