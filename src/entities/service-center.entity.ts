import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, OneToMany, BaseEntity } from 'typeorm';
import { User } from './user.entity.js';

@Entity('service_centers')
export class ServiceCenter extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column('text')
  address: string;

  @Column({ length: 100 })
  city: string;

  @Column('decimal', { precision: 9, scale: 6 })
  lat: number;

  @Column('decimal', { precision: 9, scale: 6 })
  lng: number;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ length: 255, nullable: true })
  email: string;

  @Column({ name: 'is_premium', default: false })
  isPremium: boolean;

  @Column({ name: 'is_ev_certified', default: false })
  isEvCertified: boolean;

  @Column({ length: 50, default: 'both' })
  sphere: string; // 'service', 'store', or 'both'

  @Column({ length: 20, default: 'standard' })
  tier: string;

  @Column('decimal', { precision: 2, scale: 1, nullable: true })
  rating: number;

  @Column({ name: 'rating_count', default: 0 })
  ratingCount: number;

  @Column('text', { array: true, default: [] })
  services: string[];

  @Column('jsonb', { nullable: true })
  openHours: any;

  @Column('decimal', { precision: 4, scale: 2, default: 0.12 })
  commissionRate: number;

  @Column('decimal', { name: 'premium_discount', precision: 4, scale: 2, default: 0.15 })
  premiumDiscount: number;

  @Column({ name: 'partner_user_id', type: 'uuid', nullable: true })
  partnerUserId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'partner_user_id' })
  partnerUser: User;
}
