// import { UserEntity } from './entity/user.entity';
// import { getDatabaseConnection } from './util/dbConnection';
//
// async function testDB() {
//   const dataSource = await getDatabaseConnection();
//
//   try {
//     console.log('🟡 开始数据库测试...');
//
//     // 生成唯一用户名和邮箱
//     const timestamp = Date.now();
//     const testUsername = `testuser_${timestamp}`;
//     const testEmail = `test_${timestamp}@example.com`;
//
//     // 创建测试用户
//     const user = new UserEntity();
//     user.username = testUsername;
//     user.password = 'TestPassword123!';
//     user.email = testEmail;
//
//     const savedUser = await dataSource.manager.save(user);
//     console.log(`🆗 测试用户创建成功 - ID: ${savedUser.id}`);
//
//     // 查询测试用户
//     const foundUser = await dataSource.manager.findOne(UserEntity, {
//       where: { id: savedUser.id }
//     });
//
//     if (foundUser) {
//       console.log('🔍 查询用户结果:', {
//         id: foundUser.id,
//         username: foundUser.username,
//         email: foundUser.email
//       });
//
//       // 更新用户
//       foundUser.password = 'UpdatedPassword456!';
//       await dataSource.manager.save(foundUser);
//       console.log('🔄 用户密码更新成功');
//
//       // 删除用户
//       await dataSource.manager.delete(UserEntity, foundUser.id);
//       console.log('🗑️ 用户删除成功');
//     } else {
//       console.warn('⚠️ 未找到创建的用户');
//     }
//   } catch (error) {
//     console.error('❌ 数据库操作失败:', error);
//   } finally {
//     console.log('🔚 测试完成');
//     // 注意：不要关闭数据源，因为它可能是全局共享的
//   }
// }
//
// testDB();
