//boxitem.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn
} from 'typeorm';
import { BlindBox } from './blindbox.entity';

@Entity('blind_box_item')
export class BoxItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  probability: number; // 抽取概率 (0-100)

  @Column({ type: 'varchar', length: 255 }) // 改为必填项
  imageUrl: string;

  @Column({ type: 'varchar', length: 20 })
  rarity: 'common' | 'rare' | 'epic' | 'legendary';

  @Column({ default: true })
  isAvailable: boolean;

  // 新增：物品数量
  @Column({ type: 'int', default: 1 })
  quantity: number;

  @ManyToOne(() => BlindBox, blindBox => blindBox.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blindBoxId' })
  blindBox: BlindBox;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;

}
