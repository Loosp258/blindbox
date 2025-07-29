import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { UserEntity } from './user.entity';
import { BlindBox } from './blindbox.entity';
import { BoxItem } from './boxitem.entity';

@Entity('order')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  // 买家（支出订单的归属用户）
  @ManyToOne(() => UserEntity, user => user.orders)
  user: UserEntity;

  // 卖家（收入订单的归属用户，可选）
  @ManyToOne(() => UserEntity)
  seller?: UserEntity;

  @ManyToOne(() => BlindBox)
  blindBox: BlindBox;

  @ManyToOne(() => BoxItem)
  item: BoxItem;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0
  })
  amount: number;

  // 新增：区分订单类型（支出/收入）
  @Column({ type: 'varchar', default: 'expense' })
  type: 'expense' | 'income';
}
