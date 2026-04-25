import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  BaseEntity,
} from 'typeorm';

@Entity('partner_applications')
export class PartnerApplication extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'business_name', length: 200 })
  businessName: string;

  @Column({ name: 'contact_name', length: 200 })
  contactName: string;

  @Column({ length: 255 })
  email: string;

  @Column({ length: 50 })
  phone: string;

  @Column({ length: 100 })
  city: string;

  @Column({ type: 'text', nullable: true })
  about: string;

  @Column({ length: 30, default: 'pending' })
  status: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
