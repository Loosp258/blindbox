import { Rule, RuleType } from '@midwayjs/validate';

export class RegisterDTO {
  @Rule(RuleType.string().required().min(3).max(20))
  username: string;

  @Rule(RuleType.string().required().min(6).max(30))
  password: string;

  @Rule(RuleType.string().email().required())
  email: string;
}

export class LoginDTO {
  @Rule(RuleType.string().required())
  identifier: string;

  @Rule(RuleType.string().required())
  password: string;
}
