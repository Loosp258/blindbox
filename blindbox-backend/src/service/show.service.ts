// src/service/show.service.ts
import { Provide } from '@midwayjs/decorator';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { Show } from '../entity/show.entity';
import { UserEntity } from '../entity/user.entity';
import { InventoryEntity } from '../entity/inventory.entity';
import { CommentListDTO, CreateShowDTO, ShowListDTO } from '../dto/show.dto';
import { Comment } from '../entity/comment.entity';
import { CreateCommentDTO } from '../dto/show.dto';

// 使用 @Provide() 替代 @Injectable()
@Provide()
export class ShowService {
  // 使用 @InjectEntityModel 替代 @InjectRepository
  @InjectEntityModel(Show)
  showRepo: Repository<Show>;

  @InjectEntityModel(Comment)
  commentRepo: Repository<Comment>;

  @InjectEntityModel(InventoryEntity)
  inventoryRepo: Repository<InventoryEntity>;
  @InjectEntityModel(Show)
  showRepository: Repository<Show>;

  // 创建帖子
  async createShow(userId: number, dto: CreateShowDTO) {
    // 验证用户是否拥有该物品
    const inventoryItem = await this.inventoryRepo.findOne({
      where: { id: dto.inventoryItemId, user: { id: userId } },
      relations: ['item']
    });

    if (!inventoryItem) {
      throw new Error('你没有这个物品，无法展示');
    }

    const show = new Show();
    show.title = dto.title;
    show.content = dto.content;
    show.imageUrl = dto.imageUrl;
    show.user = { id: userId } as UserEntity;
    show.inventoryItem = inventoryItem;

    return this.showRepo.save(show);
  }
  async checkOwnership(showId: number, userId: number): Promise<boolean> {
    const show = await this.showRepository.findOne({
      where: { id: showId, user: { id: userId } },
      relations: ['user']
    });
    return !!show && show.user.id === userId;
  }

  // 新增：删除帖子
  async deleteShow(showId: number, userId: number): Promise<boolean> {
    // 先校验权限
    const isOwner = await this.checkOwnership(showId, userId);
    if (!isOwner) {
      throw new Error('无权删除此帖子');
    }

    // 执行删除
    await this.showRepository.delete(showId);
    return true;
  }

  // 获取帖子列表
  async getShowList(dto: ShowListDTO) {
    const [shows, total] = await this.showRepo.findAndCount({
      skip: (dto.page - 1) * dto.pageSize,
      take: dto.pageSize,
      relations: ['user', 'inventoryItem', 'inventoryItem.item'],
      order: { createdAt: 'DESC' }
    });

    // 格式化返回数据，提取物品信息
    const formattedShows = shows.map(show => ({
      ...show,
      item: show.inventoryItem?.item
    }));

    return { shows: formattedShows, total };
  }

  // 获取帖子详情
  async getShowDetail(id: number) {
    const show = await this.showRepo.findOne({
      where: { id },
      relations: ['user', 'inventoryItem', 'inventoryItem.item', 'comments', 'comments.user']
    });

    if (!show) {
      throw new Error('帖子不存在');
    }

    // 格式化返回数据，提取物品信息
    return {
      ...show,
      item: show.inventoryItem?.item
    };
  }

  // 创建评论
  async createComment(userId: number, showId: number, dto: CreateCommentDTO) {
    const show = await this.showRepo.findOne({ where: { id: showId } });
    if (!show) {
      throw new Error('帖子不存在');
    }

    const comment = new Comment();
    comment.content = dto.content;
    comment.user = { id: userId } as UserEntity;
    comment.show = show;

    return this.commentRepo.save(comment);
  }
  async getComments(showId: number, dto: CommentListDTO) {
    const [comments, total] = await this.commentRepo.findAndCount({
      where: { show: { id: showId } },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip: (dto.page - 1) * dto.pageSize,
      take: dto.pageSize
    });

    return {
      items: comments,
      total
    };
  }
}
