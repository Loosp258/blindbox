import { DataSource, DataSourceOptions } from 'typeorm';
import config from '../config/config.default';

// 定义完整的配置类型
interface TypeormConfig {
  dataSource?: {
    default?: DataSourceOptions;
  };
}

interface AppConfig {
  typeorm?: TypeormConfig;
  keys?: string;
  koa?: any;
  jwt?: any;
  // 添加其他需要的配置属性
}

// 将导入的配置断言为 AppConfig 类型
const appConfig = config as AppConfig;

// 全局数据源实例
let dataSource: DataSource;
let isInitializing = false;

/**
 * 获取数据库连接
 */
export async function getDatabaseConnection(): Promise<DataSource> {
  if (dataSource && dataSource.isInitialized) {
    return dataSource;
  }

  // 如果正在初始化，等待完成
  if (isInitializing) {
    return new Promise((resolve) => {
      const checkInitialized = () => {
        if (dataSource && dataSource.isInitialized) {
          resolve(dataSource);
        } else {
          setTimeout(checkInitialized, 100);
        }
      };
      checkInitialized();
    });
  }

  isInitializing = true;

  try {
    // 确保配置存在
    if (!appConfig.typeorm ||
      !appConfig.typeorm.dataSource ||
      !appConfig.typeorm.dataSource.default) {
      throw new Error('数据库配置未正确设置，请检查 config.typeorm.dataSource.default');
    }

    // 获取配置对象
    const dataSourceConfig = appConfig.typeorm.dataSource.default;

    console.log('数据库连接配置:', {
      type: dataSourceConfig.type,
      database: dataSourceConfig.database
    });

    // 创建并初始化数据源
    dataSource = new DataSource(dataSourceConfig);
    await dataSource.initialize();

    console.log('✅ 数据源已初始化');
    return dataSource;
  } catch (error) {
    console.error('❌ 创建数据库连接失败:', error);
    throw error;
  } finally {
    isInitializing = false;
  }
}
