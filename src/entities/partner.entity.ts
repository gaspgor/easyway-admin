import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, OneToMany } from 'typeorm';
import { PartnerAuth } from './partner-auth.entity.js';
import { PartnerContact } from './partner-contact.entity.js';
import { PartnerProduct } from './partner-product.entity.js';
import { PartnerService } from './partner-service.entity.js';

export enum PartnerSphere {
  SERVICE = 'service',
  STORE = 'store',
  BOTH = 'both',
}

export enum PartnerStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  BLOCKED = 'blocked',
  UNFINISHED = 'unfinished',
}

@Entity('partners')
export class Partner extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_name', length: 255 })
  companyName: string;

  @Column({ name: 'company_sphere', type: 'enum', enum: PartnerSphere })
  companySphere: PartnerSphere;

  @Column({ name: 'company_type', length: 50 })
  companyType: string;

  @Column({ name: 'location', type: 'text' })
  location: string;

  @Column({ name: 'email', length: 255, unique: true })
  email: string;

  @Column({ name: 'phone', length: 50 })
  phone: string;

  @Column({ name: 'website', length: 255, nullable: true })
  website: string | null;

  @Column({ name: 'status', type: 'enum', enum: PartnerStatus, default: PartnerStatus.UNFINISHED })
  status: PartnerStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'modified_at', type: 'timestamptz' })
  modifiedAt: Date;

  @OneToOne(() => PartnerAuth, (auth: any) => auth.partner)
  auth: any;

  @OneToMany(() => PartnerContact, (contact: any) => contact.partner)
  contacts: any[];

  @OneToOne(() => PartnerProduct, (pp: any) => pp.partner)
  products: any;

  @OneToOne(() => PartnerService, (ps: any) => ps.partner)
  services: any;
}
