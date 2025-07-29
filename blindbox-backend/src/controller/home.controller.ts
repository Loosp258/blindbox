import { Controller, Get, Inject } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';

@Controller('/')
export class HomeController {
  @Inject()
  ctx: Context;

  @Get('/')
  async home() {
    return {
      status: 'ok',
      message: 'Blindbox API Service',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    };
  }

  @Get('/favicon.ico')
  async favicon() {
    this.ctx.status = 204;
  }

  @Get('/health')
  async healthCheck() {
    return {
      status: 'healthy',
      db: 'connected', // 实际应检查数据库连接
      timestamp: new Date().toISOString()
    };
  }
}
