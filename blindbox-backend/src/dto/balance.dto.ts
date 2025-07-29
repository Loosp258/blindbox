import { Rule, RuleType } from '@midwayjs/validate';

export class UpdateBalanceDTO {
  @Rule(RuleType.number().required().min(0.01).max(10000))
  amount: number;

  @Rule(RuleType.string().required().valid('add', 'deduct'))
  action: 'add' | 'deduct';
}
