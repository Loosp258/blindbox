import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { InventoryEntity } from './inventory.entity';
import { Order } from './order.entity';
import { Show } from './show.entity';
import { Comment } from './comment.entity';
import { BlindBox } from './blindbox.entity';

@Entity('user')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  username: string;

  @Column({ length: 100 })
  password: string;

  @Column({ length: 100, unique: true })
  email: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 10000 })
  balance: number;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;

  @OneToMany(() => InventoryEntity, inventory => inventory.user)
  inventories: InventoryEntity[];

  @OneToMany(() => Order, order => order.user)
  orders: Order[];

  @OneToMany(() => Show, show => show.user)
  shows: Show[];

  @OneToMany(() => Comment, comment => comment.user)
  comments: Comment[];

  @OneToMany(() => BlindBox, blindBox => blindBox.creator)
  createdBlindBoxes: BlindBox[];
}
