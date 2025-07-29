import { Middleware, Inject } from '@midwayjs/core';
import { PassportMiddleware, AuthenticateOptions } from '@midwayjs/passport';
import { JwtStrategy } from '../strategy/jwt.strategy';
import { Context } from '@midwayjs/koa';

@Middleware()
export class JwtPassportMiddleware extends PassportMiddleware(JwtStrategy) {
  @Inject()
  ctx: Context;

  // 配置认证选项（禁用会话）
  getAuthenticateOptions(): AuthenticateOptions {
    return {
      session: false, // 关键：禁用会话（JWT 无需会话）
    };
  }

  // 忽略不需要认证的路径（登录/注册接口）
  ignore(ctx: Context): boolean {
    const ignorePaths = ['/api/auth/login', '/api/auth/register'];
    const isIgnore = ignorePaths.includes(ctx.path);
    this.ctx.logger.info(`请求路径: ${ctx.path}，是否忽略认证: ${isIgnore}`);
    return isIgnore;
  }
}
