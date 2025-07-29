//inventory.dto.ts
import { Rule, RuleType } from '@midwayjs/validate';

// 交易物品DTO
export class TradeItemDTO {
  @Rule(RuleType.number().required())
  itemId: number;

  @Rule(RuleType.number().required())
  toUserId: number;

  @Rule(RuleType.number().required().min(1))
  quantity: number;
}

// 分页查询DTO
export class PaginationDTO {
  @Rule(RuleType.number().min(1).default(1))
  page: number = 1;

  @Rule(RuleType.number().min(1).max(100).default(10))
  limit: number = 10;
}

// 物品筛选DTO
export class InventoryFilterDTO {
  @Rule(RuleType.string().valid('all', 'common', 'rare', 'epic', 'legendary').default('all'))
  rarity: 'all' | 'common' | 'rare' | 'epic' | 'legendary' = 'all';

  @Rule(RuleType.string().valid('newest', 'oldest', 'rarity').default('newest'))
  sort: 'newest' | 'oldest' | 'rarity' = 'newest';
}
