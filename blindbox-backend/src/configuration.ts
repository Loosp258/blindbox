import { Configuration, ILifeCycle, Inject } from '@midwayjs/core';
import * as koa from '@midwayjs/koa';
import * as passport from '@midwayjs/passport';
import * as jwt from '@midwayjs/jwt';
import * as staticFile from '@midwayjs/static-file';
import { join, normalize, sep } from 'path';
import { Application as KoaApplication, Framework } from '@midwayjs/koa';
import multer from '@koa/multer';
import cors from '@koa/cors';
import { existsSync, mkdirSync, readFileSync, statSync } from 'fs';
import { tmpdir } from 'os';

@Configuration({
  imports: [
    koa,
    passport,
    jwt,
    staticFile,
    '@midwayjs/typeorm',
  ],
  importConfigs: [join(__dirname, './config')],
})
export class MainConfiguration implements ILifeCycle {
  @Inject()
  framework: Framework;


  async onReady() {


    const app: KoaApplication = this.framework.getApplication();
    const port = process.env.PORT || 7001;

    // 1. 全局请求日志
    app.use(async (ctx, next) => {
      console.log(`🔍 请求进入: ${ctx.method} ${ctx.path}`);
      const start = Date.now();
      await next();
      console.log(`🔍 请求完成: ${ctx.method} ${ctx.path} → ${ctx.status} (${Date.now() - start}ms)`);
    });

    // 2. 确保上传目录存在
    const uploadDir = join(process.cwd(), 'public/upload');
    const tmpUploadDir = join(tmpdir(), 'midway-upload');
    [uploadDir, tmpUploadDir].forEach(dir => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
        console.log(`✅ 创建目录: ${dir}`);
      } else {
        console.log(`✅ 目录已存在: ${dir}`);
      }
    });

    // 3. 核心修复：增强型静态文件处理
    app.use(async (ctx, next) => {
      const isUploadPath = ctx.path.toLowerCase().startsWith('/upload/');
      const isSupportedMethod = ['GET', 'HEAD'].includes(ctx.method);

      if (isSupportedMethod && isUploadPath) {
        console.log(`🎯 拦截 ${ctx.method} 请求: ${ctx.path}`);

        try {
          // 安全提取文件名（防止路径遍历攻击）
          const fileName = ctx.path.slice('/upload/'.length);
          if (!fileName || fileName.includes('..')) {
            console.warn(`   → 无效文件名: ${ctx.path}`);
            ctx.status = 400;
            return;
          }
          console.log(`   → 提取文件名: ${fileName}`);

          // 构建安全路径
          const filePath = normalize(join(uploadDir, fileName)).replace(/\//g, sep);
          console.log(`   → 构建文件路径: ${filePath}`);

          // 检查文件存在性
          if (!existsSync(filePath) || !statSync(filePath).isFile()) {
            console.warn(`   → 文件不存在: ${filePath}`);
            ctx.status = 404;
            return;
          }

          // 设置CORS头（确保所有/upload路径都有）
          ctx.set('Access-Control-Allow-Origin', 'http://localhost:5173');
          ctx.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
          ctx.set('Access-Control-Allow-Credentials', 'true');

          // 设置文件响应头
          const stats = statSync(filePath);
          ctx.set('Content-Length', stats.size.toString());
          ctx.set('Cache-Control', 'public, max-age=86400');
          ctx.set('Last-Modified', stats.mtime.toUTCString());

          // 设置MIME类型
          const ext = fileName.split('.').pop()?.toLowerCase();
          const mimeMap: Record<string, string> = {
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'svg': 'image/svg+xml',
            'webp': 'image/webp',
          };
          ctx.type = mimeMap[ext] || 'application/octet-stream';
          console.log(`   → 设置MIME类型: ${ctx.type}`);

          // 返回文件内容
          if (ctx.method === 'GET') {
            ctx.body = readFileSync(filePath);
            console.log(`✅ 返回文件内容 (${stats.size} 字节)`);
          } else {
            ctx.body = null;
            console.log(`✅ 返回文件头信息`);
          }
          return;
        } catch (err: any) {
          console.error(`❌ 处理失败: ${err.message}`);
          console.error(err.stack);
          ctx.status = 500;
          return;
        }
      }

      await next();
    });

    // 4. 测试端点（保持不变）
    app.use(async (ctx, next) => {
      if (ctx.path === '/test-image' && ['GET', 'HEAD'].includes(ctx.method)) {
        console.log(`🎯 测试端点 ${ctx.method} 请求`);
        const testFilePath = join(uploadDir, 'fxUJyDoDNl.png');

        if (existsSync(testFilePath) && statSync(testFilePath).isFile()) {
          ctx.set('Content-Type', 'image/png');
          ctx.set('Access-Control-Allow-Origin', 'http://localhost:5173');
          ctx.set('Content-Length', statSync(testFilePath).size.toString());
          ctx.body = ctx.method === 'GET' ? readFileSync(testFilePath) : null;
          console.log(`✅ 测试文件 ${ctx.method} 请求成功`);
          return;
        } else {
          ctx.status = 404;
          console.log(`❌ 测试文件不存在`);
          return;
        }
      }

      await next();
    });

    // 5. 全局CORS配置（调整顺序，优先加载）
    app.use(cors({
      origin: 'http://localhost:5173',
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
      allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      credentials: true,
      maxAge: 86400,
    }));

    // 6. 其他中间件（保持不变）
    // 文件上传中间件
    const upload = multer({
      dest: tmpUploadDir,
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'];
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('不支持的文件类型'), false);
        }
      },
    });

    // 应用上传中间件到特定路由
    app.use(async (ctx, next) => {
      if (ctx.path === '/api/upload/image' && ctx.method === 'POST') {
        await upload.single('image')(ctx, async (err) => {
          if (err) {
            ctx.status = 400;
            ctx.body = { success: false, message: err.message };
          } else {
            await next();
          }
        });
      } else {
        await next();
      }
    });

    // 错误处理中间件
    app.use(async (ctx, next) => {
      try {
        await next();
        if (ctx.status === 404 && !ctx.body) {
          ctx.status = 404;
          ctx.body = { success: false, message: '资源不存在' };
        }
      } catch (err: any) {
        console.error(`❌ 全局错误: ${err.message}`);
        console.error(err.stack);
        ctx.status = err.status || 500;
        ctx.body = { success: false, message: err.message || '服务器内部错误' };
      }
    });

    console.log(`✅ 服务运行在 http://localhost:${port}`);
    console.log(`📂 静态文件目录: ${uploadDir}`);
    console.log(`⚠️ 测试端点: http://localhost:${port}/test-image`);
    console.log(`💡 修复: 增强型图片处理，确保CORS头`);
  }
}
