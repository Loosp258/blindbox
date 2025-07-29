// blindbox.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  UpdateDateColumn, CreateDateColumn
} from 'typeorm';
import { UserEntity } from './user.entity';
import { BoxItem } from './boxitem.entity';

@Entity()
export class BlindBox {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.00 })
  price: number;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ default: 0 })
  stock: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @ManyToOne(() => UserEntity, user => user.createdBlindBoxes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'creatorId' })
  creator: UserEntity;

  @OneToMany(() => BoxItem, item => item.blindBox, { cascade: true })
  items: BoxItem[];

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;

  @Column({ nullable: false })
  category: string;
}
