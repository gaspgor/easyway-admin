import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { Partner } from './partner.entity.js';

@Entity('partners_products')
export class PartnerProduct extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'jsonb', default: [] })
  products: { name: string; price: number; availability: boolean }[];

  @Column({ name: 'products_excel_file', type: 'text', nullable: true })
  productsExcelFile: string | null;

  @OneToOne(() => Partner, (partner: any) => partner.products, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'partner_id' })
  partner: any;

  @Column({ name: 'partner_id' })
  partnerId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'modified_at', type: 'timestamptz' })
  modifiedAt: Date;
}
