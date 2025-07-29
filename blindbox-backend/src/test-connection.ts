// import { getDatabaseConnection } from './util/dbConnection';
//
// async function testConnection() {
//   try {
//     console.log('🟡 正在测试数据库连接...');
//     const connection = await getDatabaseConnection();
//     console.log('✅ 数据库连接成功');
//
//     // 执行简单查询验证连接
//     const result = await connection.query('SELECT 1 + 1 AS solution');
//     console.log('🔍 测试查询结果:', result[0].solution === 2 ? '成功' : '失败');
//
//     await connection.close();
//     console.log('🔌 数据库连接已关闭');
//   } catch (error) {
//     console.error('❌ 数据库连接测试失败:', error);
//   }
// }
//
// // 确保调用函数
// testConnection();
