import { MidwayConfig } from '@midwayjs/core';
import * as dotenv from 'dotenv';
import {Comment, UserEntity} from '../entity';
import { InventoryEntity } from '../entity';
import { ItemEntity } from '../entity';
import { BlindBox, Order, Show } from '../entity';
import { BoxItem } from '../entity/boxitem.entity';

dotenv.config();

const dbType = process.env.DB_TYPE === 'mysql' ? 'mysql' : 'sqlite';

const config: MidwayConfig = {
  keys: process.env.APP_KEYS || 'your-secret-key',
  koa: {
    port: parseInt(process.env.PORT || '7001', 10),
  },
  multipart: {
    mode: 'file',
    fileSize: '2mb',
    whitelist: ['.jpg', '.jpeg', '.png', '.gif'],
  },
  staticFile:{
    dirs:{
      default: {
        prefix:'/',
        dir:'public',
      },
      another:{
        prefix:'/assets',
        dir:'public/assets',
      },
    }
  },


  jwt: {
    secret: process.env.JWT_SECRET || 'your-jwt-secret-key',
    expiresIn: '2d'
  },
  passport: {
    session: false,
  },

  cors: {
    origin: 'http://localhost:5173',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    maxAge: 3600,
  },

  typeorm: {
    dataSource: {
      default: {
        type: dbType,
        database: dbType === 'sqlite'
          ? process.env.SQLITE_DATABASE || 'db/blindbox.db'
          : process.env.MYSQL_DATABASE || 'blindbox_db',
        synchronize: true,
        logging: ['query', 'error'],
        entities: [
          UserEntity, InventoryEntity, ItemEntity, BlindBox, BoxItem, Order, Show,Comment
        ],
        extra: dbType === 'sqlite' ? {
          busyTimeout: 5000,
          mode: 'WAL'
        } : {}
      }
    }
  }
};

export default config;
