import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';

@Entity('vehicles')
export class Vehicle extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ length: 100 })
  make: string;

  @Column({ length: 100 })
  model: string;

  @Column({ type: 'smallint' })
  year: number;

  @Column({ length: 17, nullable: true })
  vin: string;

  @Column({ name: 'fuel_type', length: 10 })
  fuelType: string;

  @Column({ type: 'integer', default: 0 })
  odometer: number;

  @Column({ length: 50, nullable: true })
  color: string;

  @Column({ name: 'health_score', type: 'smallint', nullable: true })
  healthScore: number;

  @Column({ name: 'plate_number', length: 20, nullable: true })
  plateNumber: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne('User')
  @JoinColumn({ name: 'user_id' })
  user: any;

  @OneToMany('AiAnalysis', (analysis: any) => analysis.vehicle)
  aiAnalyses: any[];

  @OneToMany('ServiceRecord', (record: any) => record.vehicle)
  serviceRecords: any[];
}
