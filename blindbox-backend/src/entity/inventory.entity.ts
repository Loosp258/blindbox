// src/entity/inventory.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn } from 'typeorm';
import { UserEntity } from './user.entity';
import { BoxItem } from './boxitem.entity';
import { Show } from './show.entity';

@Entity('inventory')
export class InventoryEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserEntity, user => user.inventories)
  user: UserEntity;

  @ManyToOne(() => BoxItem)
  item: BoxItem;

  @Column({ default: 1 })
  quantity: number;

  @CreateDateColumn({ type: 'datetime' })
  acquiredAt: Date;

  @OneToMany(() => Show, show => show.inventoryItem)
  shows: Show[];
}
