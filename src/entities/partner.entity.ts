import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BaseEntity } from 'typeorm';

export enum PartnerSphere {
  SERVICE = 'service',
  STORE = 'store',
  BOTH = 'both',
}

export enum PartnerStatus {
  ACTIVE = 'active',
  UNFINISHED = 'unfinished',
  BLOCKED = 'blocked',
  ARCHIVED = 'archived',
}

@Entity('partners')
export class Partner extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_name', length: 255 })
  companyName: string;

  @Column({ name: 'company_sphere', length: 50, nullable: true })
  companySphere: string;

  @Column({ name: 'email', length: 255, unique: true })
  email: string;

  @Column({ name: 'status', length: 50, default: 'unfinished' })
  status: string;

  @Column({ name: 'phone', length: 50, nullable: true })
  phone: string;

  @Column({ name: 'rating', type: 'float', default: 0 })
  rating: number;

  @Column({ name: 'logo_url', length: 1000, nullable: true })
  logoUrl: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string;

  @Column({ name: 'website', length: 255, nullable: true })
  website: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'modified_at', type: 'timestamptz' })
  modifiedAt: Date;
}
