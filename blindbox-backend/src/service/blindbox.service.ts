//blindbox.service.ts
import { Provide } from '@midwayjs/decorator';
import { Repository } from 'typeorm';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { BlindBox } from '../entity/blindbox.entity';
import { BoxItem as DBBoxItem } from '../entity/boxitem.entity';
import { UserEntity } from '../entity/user.entity';
import { CreateBlindBoxDTO, AddItemToBoxDTO, BlindBoxSearchDTO, BoxItemDTO } from '../dto/blindbox.dto';
import { Not } from 'typeorm';

@Provide()
export class BlindBoxService {
  @InjectEntityModel(BlindBox)
  blindBoxRepository: Repository<BlindBox>;

  @InjectEntityModel(DBBoxItem)
  boxItemRepository: Repository<DBBoxItem>;

  @InjectEntityModel(UserEntity)
  userRepository: Repository<UserEntity>;

  // 创建盲盒（确保category入库）
  async createBlindBox(creatorId: number, dto: CreateBlindBoxDTO) {
    const creator = await this.userRepository.findOne({ where: { id: creatorId } });
    if (!creator) {
      throw new Error('创建者不存在');
    }

    // 1. 创建盲盒主体（强制包含category）
    const blindBox = this.blindBoxRepository.create({
      name: dto.name,
      description: dto.description,
      price: dto.price,
      imageUrl: dto.imageUrl,
      stock: dto.stock,
      isActive: true,
      creator: { id: creatorId } as UserEntity,
      category: dto.category, // 关键：从DTO获取category
    });
    const savedBox = await this.blindBoxRepository.save(blindBox);

    // 2. 创建盲盒物品
    const boxItems = dto.items.map((item: BoxItemDTO) => this.boxItemRepository.create({
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      imageUrl: item.imageUrl,
      probability: item.probability,
      rarity: item.rarity,
      isAvailable: true,
      blindBox: savedBox,
    }));
    await this.boxItemRepository.save(boxItems);

    return this.getBlindBoxDetail(savedBox.id);
  }

  // 获取用户创建的盲盒（添加category字段）
  async getBlindBoxesByUserId(userId: number) {
    const boxes = await this.blindBoxRepository.find({
      where: { creator: { id: userId } },
      relations: ['items'],
      select: {
        category: true,
        id: true,
        name: true,
        description: true,
        price: true,
        imageUrl: true,
        stock: true,
        isActive: true,
        createdAt: true,
      }
    });

    // 核心修复：强制转换imageUrl为字符串
    return boxes.map(box => ({
      ...box,
      imageUrl: String(box.imageUrl || ''), // 确保是字符串
      items: box.items.map(item => ({
        ...item,
        imageUrl: String(item.imageUrl || '') // 子物品同样处理
      }))
    }));
  }

  // 获取所有激活的盲盒（关键修改：添加category字段）
  async getActiveBlindBoxes() {
    const boxes = await this.blindBoxRepository.find({
      where: { isActive: true },
      relations: ['creator', 'items'],
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        imageUrl: true,
        stock: true,
        isActive: true,
        createdAt: true,
        category: true,
        creator: {
          id: true,
          username: true
        },
        items: {
          id: true,
          name: true,
          rarity: true,
          imageUrl: true
        }
      }
    });

    // 核心修复：强制转换imageUrl为字符串
    return boxes.map(box => ({
      ...box,
      imageUrl: String(box.imageUrl || ''),
      items: box.items.map(item => ({
        ...item,
        imageUrl: String(item.imageUrl || '')
      }))
    }));
  }

  // 获取盲盒详情（确保返回category）
  async getBlindBoxDetail(boxId: number): Promise<BlindBox | null> {
    const box = await this.blindBoxRepository.findOne({
      where: { id: boxId },
      relations: ['creator', 'items'],
      select: {
        category: true,
        id: true,
        name: true,
        description: true,
        price: true,
        imageUrl: true,
        stock: true,
        isActive: true,
        createdAt: true,
        creator: {
          id: true,
          username: true
        },
        items: {
          id: true,
          name: true,
          description: true,
          imageUrl: true,
          rarity: true
        }
      }
    });

    if (!box) return null;

    // 核心修复：强制转换imageUrl为字符串
    return {
      ...box,
      imageUrl: String(box.imageUrl || ''),
      items: box.items.map(item => ({
        ...item,
        imageUrl: String(item.imageUrl || '')
      }))
    };
  }

  // 搜索盲盒（添加category字段）
  async searchBlindBoxes(dto: BlindBoxSearchDTO): Promise<[BlindBox[], number]> {
    const { keyword, minPrice, maxPrice, rarity, sort, page, limit } = dto;
    const skip = (page - 1) * limit;

    const query = this.blindBoxRepository.createQueryBuilder('blindBox')
      .leftJoinAndSelect('blindBox.creator', 'creator')
      .select([
        'blindBox.id',
        'blindBox.name',
        'blindBox.description',
        'blindBox.price',
        'blindBox.imageUrl',
        'blindBox.stock',
        'blindBox.isActive',
        'blindBox.createdAt',
        'blindBox.category', // 新增：查询category
        'creator.id',
        'creator.username'
      ])
      .where('blindBox.isActive = :isActive', { isActive: true });

    if (keyword) {
      query.andWhere('(blindBox.name LIKE :keyword OR blindBox.description LIKE :keyword)', {
        keyword: `%${keyword}%`
      });
    }

    if (minPrice !== undefined) {
      query.andWhere('blindBox.price >= :minPrice', { minPrice });
    }
    if (maxPrice !== undefined) {
      query.andWhere('blindBox.price <= :maxPrice', { maxPrice });
    }

    if (rarity) {
      query.leftJoin('blindBox.items', 'items')
        .andWhere('items.rarity = :rarity', { rarity });
    }

    switch (sort) {
      case 'price-asc':
        query.orderBy('blindBox.price', 'ASC');
        break;
      case 'price-desc':
        query.orderBy('blindBox.price', 'DESC');
        break;
      default:
        query.orderBy('blindBox.createdAt', 'DESC');
    }

    query.skip(skip).take(limit);
    const [items, total] = await query.getManyAndCount();
    return [items, total];
  }

  // 获取创建者的盲盒（未修改）
  async getCreatorBlindBoxes(creatorId: number) {
    return this.blindBoxRepository.find({
      where: { creator: { id: creatorId } },
      relations: ['creator', 'items'],
    });
  }

  // 更新盲盒（未修改）
  async updateBlindBox(creatorId: number, boxId: number, dto: Partial<CreateBlindBoxDTO>) {
    const box = await this.blindBoxRepository.findOne({
      where: { id: boxId, creator: { id: creatorId } },
      relations: ['creator'],
    });

    if (!box) {
      throw new Error('盲盒不存在或无权限修改');
    }

    if (dto.isActive !== undefined) {
      box.isActive = dto.isActive;
    } else {
      dto.isActive = box.isActive;
    }

    if (dto.category) {
      box.category = dto.category;
    }

    Object.assign(box, dto);
    return this.blindBoxRepository.save(box);
  }

  // 删除盲盒（未修改）
  async deleteBlindBox(creatorId: number, boxId: number) {
    const box = await this.blindBoxRepository.findOne({
      where: { id: boxId, creator: { id: creatorId } },
    });

    if (!box) {
      throw new Error('盲盒不存在或无权限删除');
    }

    await this.boxItemRepository.delete({ blindBox: { id: boxId } });
    return this.blindBoxRepository.remove(box);
  }

  // 检查创建者权限（未修改）
  async checkCreatorOwnership(creatorId: number, boxId: number) {
    const box = await this.blindBoxRepository.findOne({
      where: { id: boxId, creator: { id: creatorId } },
    });
    return !!box;
  }

  // 添加盲盒物品（未修改）
  async addBlindBoxItem(boxId: number, dto: AddItemToBoxDTO) {
    const blindBox = await this.blindBoxRepository.findOne({ where: { id: boxId } });
    if (!blindBox) {
      throw new Error('盲盒不存在');
    }

    if (dto.weight < 0 || dto.weight > 100) {
      throw new Error('单个物品概率需在 0~100 之间');
    }

    const existingItems = await this.boxItemRepository.find({
      where: { blindBox: { id: boxId } }
    });
    const totalProbability = existingItems.reduce(
      (sum, item) => sum + item.probability,
      0
    );
    if (totalProbability + dto.weight > 100) {
      throw new Error(`添加后概率总和将超过 100%（当前总和：${totalProbability}%，新增：${dto.weight}%）`);
    }

    const itemData = {
      name: dto.name,
      description: dto.description,
      quantity: dto.quantity,
      imageUrl: dto.imageUrl,
      probability: dto.weight,
      rarity: dto.rarity,
      isAvailable: true,
      blindBox: { id: boxId } as BlindBox,
    };

    const item = this.boxItemRepository.create(itemData);
    return this.boxItemRepository.save(item);
  }

  // 获取盲盒物品（未修改）
  async getBlindBoxItems(boxId: number) {
    return this.boxItemRepository.find({ where: { blindBox: { id: boxId } } });
  }

  // 更新盲盒物品（未修改）
  async updateBlindBoxItem(boxId: number, itemId: number, dto: Partial<AddItemToBoxDTO>) {
    const item = await this.boxItemRepository.findOne({
      where: { id: itemId, blindBox: { id: boxId } },
      relations: ['blindBox'],
    });

    if (!item) {
      throw new Error('物品不存在');
    }

    if (dto.weight !== undefined) {
      const newProbability = dto.weight;
      if (newProbability < 0 || newProbability > 100) {
        throw new Error('单个物品概率需在 0~100 之间');
      }

      const existingItems = await this.boxItemRepository.find({
        where: { blindBox: { id: boxId }, id: Not(itemId) }
      });
      const totalProbability = existingItems.reduce(
        (sum, i) => sum + i.probability,
        0
      );

      if (totalProbability + newProbability > 100) {
        throw new Error(`更新后概率总和将超过 100%（当前其他物品总和：${totalProbability}%，当前物品新概率：${newProbability}%）`);
      }
      item.probability = newProbability;
    }

    Object.assign(item, {
      ...dto,
      probability: dto.weight,
    });
    return this.boxItemRepository.save(item);
  }

  // 删除盲盒物品（未修改）
  async deleteBlindBoxItem(boxId: number, itemId: number) {
    const item = await this.boxItemRepository.findOne({
      where: { id: itemId, blindBox: { id: boxId } },
    });

    if (!item) {
      throw new Error('物品不存在');
    }

    return this.boxItemRepository.remove(item);
  }

  // 获取所有盲盒（未修改）
  async getAllBlindBoxes() {
    return this.blindBoxRepository.find({
      relations: ['creator', 'items'],
    });
  }
}
