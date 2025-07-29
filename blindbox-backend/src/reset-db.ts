// import { UserEntity } from './entity/user.entity';
// import { getDatabaseConnection } from './util/dbConnection';
// import { Connection } from 'typeorm';
//
// async function resetDatabase() {
//   let connection: Connection | null = null;
//
//   try {
//     console.log('🟡 正在连接数据库...');
//     connection = await getDatabaseConnection();
//     console.log('✅ 数据库连接成功');
//
//     // 删除所有测试用户（用户名以 testuser_ 开头）
//     const deleteResult = await connection.manager.delete(UserEntity, "username LIKE 'testuser_%'");
//     console.log(`🧹 已删除 ${deleteResult.affected} 个测试用户`);
//
//     // 创建新的测试用户
//     const timestamp = Date.now();
//     const user = new UserEntity();
//     user.username = `testuser_${timestamp}`;
//     user.password = 'TestPassword123!';
//     user.email = `test_${timestamp}@example.com`;
//     const savedUser = await connection.manager.save(user);
//
//     console.log(`🆗 测试用户创建成功 - ID: ${savedUser.id}`);
//   } catch (error) {
//     console.error('❌ 数据库重置失败:', error);
//   } finally {
//     if (connection && connection.isConnected) {
//       await connection.close();
//       console.log('🔌 数据库连接已关闭');
//     }
//   }
// }
//
// resetDatabase();
