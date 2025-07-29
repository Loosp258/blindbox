// src/entity/comment.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { UserEntity } from './user.entity';
import { Show } from './show.entity';

@Entity('comment')
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  content: string; // 评论内容

  @ManyToOne(() => UserEntity, user => user.comments)
  user: UserEntity; // 评论者

  @ManyToOne(() => Show, show => show.comments)
  show: Show; // 关联的帖子

  @CreateDateColumn()
  createdAt: Date; // 评论时间
}
