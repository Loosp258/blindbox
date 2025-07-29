import {Inject, Logger, Provide} from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../entity';
import { UserEntity } from '../entity';
import { BlindBox } from '../entity';
import { BoxItem } from '../entity/boxitem.entity';
import { PaginationDTO } from "../dto/inventory.dto";
import { InventoryService } from './inventory.service';
import { PurchaseBoxDTO } from '../dto/blindbox.dto';

@Provide()
export class OrderService {
  @InjectEntityModel(Order)
  orderRepo: Repository<Order>;

  @Inject()
  inventoryService: InventoryService;
  @Logger()
  logger;

  // 创建订单（支持收入/支出类型）
  async createOrder(data: Partial<Order>): Promise<Order> {
    const order = new Order();
    Object.assign(order, data);
    return this.orderRepo.save(order);
  }

  async findMyOrders(userId: number) {
    return this.orderRepo.find({
      where: [
        { user: { id: userId } }, // 支出订单（作为买家）
        { seller: { id: userId } } // 收入订单（作为卖家）
      ],
      relations: ['blindBox'],
    });
  }

  // 获取用户订单历史（收入+支出）
  async getUserOrders(userId: number, pagination: PaginationDTO): Promise<[Order[], number]> {
    return this.orderRepo.findAndCount({
      where: [
        { user: { id: userId } }, // 支出订单
        { seller: { id: userId } } // 收入订单
      ],
      relations: ['blindBox', 'item', 'seller', 'user'],
      order: { createdAt: 'DESC' },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    });
  }

  // 获取订单详情
  async getOrderDetail(orderId: number, userId: number): Promise<Order | null> {
    return this.orderRepo.findOne({
      where: [
        { id: orderId, user: { id: userId } }, // 支出详情
        { id: orderId, seller: { id: userId } } // 收入详情
      ],
      relations: ['blindBox', 'item'],
    });
  }

  // 购买盲盒（创建支出+收入订单）
  async purchaseBlindBox(userId: number, dto: PurchaseBoxDTO) {
    try {
      this.logger.info(`收到购买请求：userId=${userId}, blindBoxId=${dto.blindBoxId}`);

      return this.orderRepo.manager.transaction(async manager => {
        // 获取买家
        const user = await manager.findOne(UserEntity, { where: { id: userId } });
        if (!user) {
          throw new Error('用户不存在');
        }

        // 获取盲盒（含卖家）
        const blindBox = await manager.findOne(BlindBox, {
          where: { id: dto.blindBoxId },
          relations: ['items', 'creator']
        });
        if (!blindBox) throw new Error('盲盒不存在');
        if (blindBox.stock <= 0) throw new Error('盲盒库存不足');
        const seller = blindBox.creator;
        if (!seller) throw new Error('盲盒无创建者');

        // 抽取物品
        const items = blindBox.items;
        if (!items?.length) throw new Error('盲盒内无物品');
        const totalProbability = items.reduce((sum, item) => sum + item.probability, 0);
        if (totalProbability <= 0) throw new Error('物品概率配置错误');
        let randomValue = Math.random() * totalProbability;
        let selectedItem: BoxItem | null = null;
        for (const item of items) {
          randomValue -= item.probability;
          if (randomValue <= 0) {
            selectedItem = item;
            break;
          }
        }
        selectedItem = selectedItem || items[0];

        // 扣减买家余额，增加卖家余额
        if (user.balance < blindBox.price) throw new Error('余额不足');
        user.balance -= blindBox.price;
        seller.balance = (seller.balance || 0) + blindBox.price;
        await manager.save(user);
        await manager.save(seller);

        // 减少库存
        blindBox.stock -= 1;
        await manager.save(blindBox);

        // 创建买家的支出订单
        const expenseOrder = await this.createOrder({
          type: 'expense',
          user,
          blindBox,
          item: selectedItem,
          price: blindBox.price,
          amount: blindBox.price,
          createdAt: new Date()
        });

        // 创建卖家的收入订单（新增）
        const incomeOrder = await this.createOrder({
          type: 'income',
          seller,
          blindBox,
          item: selectedItem, // 可选：保留物品信息
          price: blindBox.price,
          amount: blindBox.price,
          createdAt: new Date()
        });

        // 创建库存记录
        const inventory = await this.inventoryService.addItemToInventory(user, selectedItem);

        this.logger.info(`购买成功：买家${userId}支出${blindBox.price}，卖家${seller.id}收入${blindBox.price}`);
        return { order: expenseOrder, incomeOrder, inventory, item: selectedItem };
      });

    } catch (error: any) {
      this.logger.error(`购买失败：${error.message}`);
      throw error;
    }
  }
}
