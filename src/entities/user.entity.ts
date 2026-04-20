import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

@Entity('users')
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'phone', length: 20, unique: true })
  phone: string;

  @Column({ name: 'name', length: 100 })
  name: string;

  @Column({ name: 'surname', length: 100 })
  surname: string;

  @Column({ name: 'email', length: 255, unique: true })
  email: string;

  @Column({ name: 'onboarding_status', length: 20, default: 'pending' })
  onboardingStatus: string;

  @Column({ name: 'plan', length: 20, default: 'free' })
  plan: string;

  @Column({ name: 'is_blocked', default: false })
  isBlocked: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany('Vehicle', (vehicle: any) => vehicle.user)
  vehicles: any[];
}
