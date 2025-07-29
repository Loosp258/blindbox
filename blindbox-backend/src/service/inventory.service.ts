//inventory.service.ts
import { Provide, Logger } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryEntity } from '../entity';
import { UserEntity } from '../entity';
import { BoxItem } from '../entity/boxitem.entity';
import { InventoryFilterDTO, PaginationDTO } from "../dto/inventory.dto";

@Provide()
export class InventoryService {
  @InjectEntityModel(InventoryEntity)
  inventoryRepo: Repository<InventoryEntity>;

  @InjectEntityModel(BoxItem)
  boxItemRepo: Repository<BoxItem>;

  @Logger() // 注入日志服务
  logger;

  // 添加物品到库存（保持不变）
  async addItemToInventory(user: UserEntity, item: BoxItem): Promise<InventoryEntity> {
    const itemExists = await this.boxItemRepo.exists({
      where: { id: item.id }
    });
    if (!itemExists) {
      throw new Error(`物品ID=${item.id}不存在，无法添加到库存`);
    }

    let inventory = await this.inventoryRepo.findOne({
      where: { user: { id: user.id }, item: { id: item.id } }
    });

    if (inventory) {
      inventory.quantity += 1;
      return this.inventoryRepo.save(inventory);
    }

    inventory = new InventoryEntity();
    inventory.user = user;
    inventory.item = item;
    return this.inventoryRepo.save(inventory);
  }

  // 获取用户库存（修复查询条件和参数校验）
  // inventory.service.ts（修复过滤逻辑）
  async getUserInventory(
    userId: number,
    filter: InventoryFilterDTO,
    pagination: PaginationDTO
  ): Promise<[InventoryEntity[], number]> {
    try {
      const page = Math.max(1, pagination.page || 1);
      const limit = Math.max(1, Math.min(100, pagination.limit || 10));

      const query = this.inventoryRepo
        .createQueryBuilder('inventory')
        .leftJoinAndSelect('inventory.item', 'item')
        .leftJoinAndSelect('inventory.user', 'user')
        .where('user.id = :userId', { userId })
        .skip((page - 1) * limit)
        .take(limit);

      // 修复：仅当rarity不是'all'时，才添加过滤条件
      if (filter.rarity && filter.rarity !== 'all') {
        query.andWhere('item.rarity = :rarity', { rarity: filter.rarity });
      }

      // 排序逻辑（保持不变）
      switch (filter.sort) {
        case 'oldest':
          query.orderBy('inventory.acquiredAt', 'ASC');
          break;
        case 'rarity':
          query.orderBy('item.rarity', 'DESC');
          break;
        default:
          query.orderBy('inventory.acquiredAt', 'DESC');
      }

      this.logger.info(`查询用户${userId}的库存，分页：${page}/${limit}，过滤：${JSON.stringify(filter)}`);
      return query.getManyAndCount();
    } catch (error: any) {
      this.logger.error(`获取库存失败：${error.message}`);
      throw new Error('获取库存失败');
    }
  }
}
