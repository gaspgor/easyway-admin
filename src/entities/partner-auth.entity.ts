import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn, BeforeInsert, BeforeUpdate } from 'typeorm';
import { Partner } from './partner.entity.js';
import * as bcrypt from 'bcrypt';

@Entity('partners_auth')
export class PartnerAuth extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'username', length: 150, unique: true })
  username: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @OneToOne(() => Partner, (partner: any) => partner.auth, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'partner_id' })
  partner: any;

  @Column({ name: 'partner_id' })
  partnerId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'modified_at', type: 'timestamptz' })
  modifiedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.passwordHash && !this.passwordHash.startsWith('$2b$')) {
      this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
    }
  }
}
