import { Rule, RuleType } from '@midwayjs/validate';
import { PaginationDTO } from './inventory.dto';

export class OrderHistoryQueryDTO extends PaginationDTO {
  @Rule(RuleType.number().optional())
  blindBoxId?: number;
}
