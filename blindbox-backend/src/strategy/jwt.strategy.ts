import { Inject, Config, Logger, Provide, httpError } from '@midwayjs/core';
import { PassportStrategy } from '@midwayjs/passport';
import { StrategyOptions, Strategy, ExtractJwt } from 'passport-jwt';
import { UserService } from '../service/user.service';

@Provide() // 必须注册到 IOC 容器
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  @Inject()
  userService: UserService;

  @Config('jwt')
  jwtConfig: any;

  @Logger()
  logger;

  // 配置 JWT 解析参数
  getStrategyOptions(): StrategyOptions {
    const secret = this.jwtConfig.secret;
    this.logger.info('JWT 策略初始化，使用密钥:', secret);

    return {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // 从请求头提取 Token
      secretOrKey: secret, // 验证密钥
      ignoreExpiration: false, // 不忽略过期时间（由 Passport 自动验证）
    };
  }

  // Token 验证逻辑
  async validate(payload: any): Promise<any> {
    this.logger.info('========== JWT 验证开始 ==========');
    this.logger.info('解析到的 payload:', payload);

    // 验证 payload 必须包含用户 ID（sub 字段）
    if (!payload.sub) {
      this.logger.error('payload 缺少 sub 字段（用户 ID）:', payload);
      throw new httpError.UnauthorizedError('无效的 Token：缺少用户信息');
    }

    // 查询用户是否存在
    try {
      const user = await this.userService.getUserById(payload.sub);
      if (!user) {
        this.logger.error(`用户不存在（ID: ${payload.sub}）`);
        throw new httpError.UnauthorizedError('用户不存在');
      }

      this.logger.info('用户验证通过:', { id: user.id, username: user.username });
      this.logger.info('========== JWT 验证结束 ==========');

      // 返回简化的用户对象（避免复杂结构导致序列化问题）
      return {
        id: user.id,
        username: user.username,
        email: user.email,
      };
    } catch (error) {
      this.logger.error('用户查询失败:', error.message);
      throw new httpError.UnauthorizedError('认证失败：服务器错误');
    }
  }
}
