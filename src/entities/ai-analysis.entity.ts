import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity('ai_analyses')
export class AiAnalysis {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'vehicle_id', type: 'uuid' })
  vehicleId: string;

  @Column({ length: 20, default: 'pending' })
  status: string;

  @Column({ name: 'health_score', type: 'smallint', nullable: true })
  healthScore: number;

  @Column({ name: 'ai_tip', type: 'text', nullable: true })
  aiTip: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne('Vehicle', (vehicle: any) => vehicle.aiAnalyses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: any;
}
