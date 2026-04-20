import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { Partner } from './partner.entity.js';

@Entity('partners_services')
export class PartnerService extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'jsonb', default: [] })
  services: { name: string; price: number; availability: boolean }[];

  @Column({ name: 'services_excel_file', type: 'text', nullable: true })
  servicesExcelFile: string | null;

  @OneToOne(() => Partner, (partner: any) => partner.services, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'partner_id' })
  partner: any;

  @Column({ name: 'partner_id' })
  partnerId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'modified_at', type: 'timestamptz' })
  modifiedAt: Date;
}
