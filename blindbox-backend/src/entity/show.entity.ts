// src/entity/show.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, CreateDateColumn } from 'typeorm';
import { UserEntity } from './user.entity';
import { InventoryEntity } from './inventory.entity';
import { Comment } from './comment.entity';

@Entity('show')
export class Show {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  title: string;

  @Column('text')
  content: string;

  @Column({ nullable: true })
  imageUrl: string;

  @ManyToOne(() => UserEntity, user => user.shows)
  user: UserEntity;

  @ManyToOne(() => InventoryEntity, inventory => inventory.shows)
  inventoryItem: InventoryEntity; // 关联用户库存中的物品

  @OneToMany(() => Comment, comment => comment.show)
  comments: Comment[];

  @CreateDateColumn()
  createdAt: Date;
}
