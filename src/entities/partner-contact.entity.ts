import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Partner } from './partner.entity.js';

@Entity('partners_contact_persons')
export class PartnerContact extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name', length: 100 })
  name: string;

  @Column({ name: 'surname', length: 100 })
  surname: string;

  @Column({ name: 'phone', length: 50 })
  phone: string;

  @Column({ name: 'email', length: 255 })
  email: string;

  @Column({ name: 'address', type: 'text' })
  address: string;

  @ManyToOne(() => Partner, (partner: any) => partner.contacts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'partner_id' })
  partner: any;

  @Column({ name: 'partner_id' })
  partnerId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'modified_at', type: 'timestamptz' })
  modifiedAt: Date;
}
