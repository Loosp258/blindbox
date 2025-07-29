//service/user.service.ts
import { Provide } from '@midwayjs/decorator';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../entity/user.entity';
import { RegisterDTO } from '../dto/auth.dto';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

@Provide()
export class UserService {
  @InjectEntityModel(UserEntity)
  userRepository: Repository<UserEntity>;

  // 检查用户名是否存在
  async isUsernameExist(username: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { username } });
    return !!user;
  }

  // 检查邮箱是否存在
  async isEmailExist(email: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { email } });
    return !!user;
  }

  // 创建用户
  async createUser(dto: RegisterDTO): Promise<UserEntity> {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.userRepository.create({
      ...dto,
      password: hashedPassword,
      balance: 10000 // 默认初始余额
    });
    return this.userRepository.save(user);
  }

  // 根据邮箱查询用户（补充缺失方法）
  async getUserByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async getUserByUsername(username: string): Promise<UserEntity | null> {
    console.log('userRepository:', this.userRepository); // 打印仓库是否为 undefined
    if (!this.userRepository) {
      throw new Error('userRepository 注入失败');
    }
    return this.userRepository.findOne({ where: { username } });
  }

  // 根据ID查询用户（补充缺失方法）
  async getUserById(id: number): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  // 更新用户余额（补充缺失方法）
  async updateUserBalance(
    userId: number,
    amount: number,
    type: 'add' | 'subtract'
  ): Promise<UserEntity> {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    // 计算新余额（处理 decimal 类型）
    const currentBalance = parseFloat(user.balance.toString());
    let newBalance: number;

    if (type === 'add') {
      newBalance = currentBalance + amount;
    } else {
      if (currentBalance < amount) {
        throw new Error('余额不足');
      }
      newBalance = currentBalance - amount;
    }

    user.balance = newBalance;
    return this.userRepository.save(user);
  }

  // 生成JWT令牌
  generateToken(user: UserEntity): string {
    return jwt.sign(
      { sub: user.id, username: user.username },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' }
    );
  }
}
