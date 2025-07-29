// blindbox.dto.ts
import { Rule, RuleType } from '@midwayjs/validate';
import {BoxItem} from "../entity";

// 定义物品数据结构接口
export interface BoxItemDTO {
  name: string;
  description: string;
  quantity: number;
  imageUrl: string;
  probability: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

// 物品校验规则
const CreateBoxItemRules = {
  name: RuleType.string().required().min(1).max(100),
  description: RuleType.string().required().min(1),
  quantity: RuleType.number().required().min(1),
  imageUrl: RuleType.string().required().min(1),
  probability: RuleType.number().required().min(0.01).max(100),
  rarity: RuleType.string().required().valid('common', 'rare', 'epic', 'legendary'),
};

export class CreateBlindBoxDTO {
  @Rule(RuleType.string().required().min(3).max(100))
  name: string;

  @Rule(RuleType.string().required().min(1))
  description: string;

  @Rule(RuleType.number().required().min(0.01))
  price: number;

  @Rule(RuleType.string().optional())
  imageUrl?: string;

  @Rule(RuleType.number().required().min(0))
  stock: number;

  @Rule(RuleType.boolean().default(true))
  isActive?: boolean;

  @Rule(RuleType.array().required().min(1).items(
    RuleType.object().keys(CreateBoxItemRules)
  ))
  items: BoxItem[];

  @Rule(RuleType.string().required().valid(
    '生活用品', '电子产品', '娱乐玩具', '文创用品'
  ))
  category: string ;
}

export class AddItemToBoxDTO {
  @Rule(RuleType.number().required())
  blindBoxId: number;

  @Rule(RuleType.string().required().min(1).max(100))
  name: string;

  @Rule(RuleType.string().required().min(1))
  description: string;

  @Rule(RuleType.string().required().min(1))
  imageUrl: string;

  @Rule(RuleType.number().required().min(0.01))
  weight: number;

  @Rule(RuleType.string().required().valid('common', 'rare', 'epic', 'legendary'))
  rarity: 'common' | 'rare' | 'epic' | 'legendary';

  @Rule(RuleType.number().required().min(1))
  quantity: number;
}

export class PurchaseBoxDTO {
  @Rule(RuleType.number().required())
  blindBoxId: number;
}

export class BlindBoxSearchDTO {
  @Rule(RuleType.string().min(1).max(50).optional())
  keyword?: string;

  @Rule(RuleType.number().min(0).optional())
  minPrice?: number;

  @Rule(RuleType.number().min(0).optional())
  maxPrice?: number;

  @Rule(RuleType.string().valid('普通', '稀有', '史诗', '传说').optional())
  rarity?: string;

  @Rule(RuleType.string().valid('newest', 'price-asc', 'price-desc').default('newest'))
  sort: 'newest' | 'price-asc' | 'price-desc' = 'newest';

  @Rule(RuleType.number().min(1).default(1))
  page: number = 1;

  @Rule(RuleType.number().min(1).max(100).default(10))
  limit: number = 10;
}
