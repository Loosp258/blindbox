//item.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('item')
export class ItemEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  imageUrl: string;

  @Column({ length: 50 })
  rarity: string; // 稀有度：普通、稀有、史诗、传说

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;
}
