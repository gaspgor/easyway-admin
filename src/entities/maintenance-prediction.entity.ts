import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Vehicle } from './vehicle.entity.js';

@Entity('maintenance_predictions')
export class MaintenancePrediction extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'vehicle_id', type: 'uuid' })
  vehicleId: string;

  @Column({ length: 255 })
  component: string;

  @Column({ type: 'integer' })
  predictedMileage: number;

  @Column({ type: 'date' })
  predictedDate: Date;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'jsonb', nullable: true })
  partsNeeded: {
    name: string;
    specs: string;
    recommendedBrands: string[];
  }[];

  @Column({ type: 'jsonb', nullable: true })
  servicesNeeded: string[];

  @Column({ default: 'upcoming' })
  status: string; // upcoming, missed, completed

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => Vehicle, (vehicle: any) => vehicle.id)
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: any;
}
