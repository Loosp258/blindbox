// src/typings/koa.d.ts
import * as Koa from 'koa';
import * as multer from 'koa-multer';

declare module 'koa' {
  interface Context {
    file: multer.File; // 扩展 ctx.file 类型
    files: multer.File[]; // 扩展 ctx.files 类型
  }
}
