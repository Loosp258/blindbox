//data-source.ts
import { DataSource, DataSourceOptions } from 'typeorm';
import config from './config/config.default';

// 从配置中获取数据源设置
const dataSourceConfig = config.typeorm?.dataSource?.default as DataSourceOptions;

if (!dataSourceConfig || !dataSourceConfig.type) {
  throw new Error('未找到数据源配置');
}

// 创建安全的数据源配置
let safeDataSourceConfig: DataSourceOptions;

switch (dataSourceConfig.type) {
  case 'mysql':
    // MySQL 特定配置
    safeDataSourceConfig = {
      type: 'mysql',
      host: dataSourceConfig.host || 'localhost',
      port: dataSourceConfig.port || 3306,
      username: dataSourceConfig.username || 'root',
      password: dataSourceConfig.password || '',
      database: dataSourceConfig.database || 'blindbox_db',
      entities: dataSourceConfig.entities || [],
      synchronize: dataSourceConfig.synchronize || false,
      logging: dataSourceConfig.logging || false,
      extra: dataSourceConfig.extra || {}
    } as DataSourceOptions;
    break;

  case 'sqlite':
    // SQLite 特定配置
    safeDataSourceConfig = {
      type: 'sqlite',
      database: dataSourceConfig.database || 'db/blindbox.db',
      entities: dataSourceConfig.entities || [],
      synchronize: dataSourceConfig.synchronize || false,
      logging: dataSourceConfig.logging || false

    } as DataSourceOptions;
    break;

  default:
    throw new Error(`不支持的数据库类型: ${dataSourceConfig.type}`);
}

// 创建数据源实例
export default new DataSource(safeDataSourceConfig);
