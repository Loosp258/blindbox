// src/dto/show.dto.ts
import { IsString, IsOptional, IsNumber, MinLength, MaxLength, IsPositive } from 'class-validator';

/**
 * 创建帖子DTO
 */
export class CreateShowDTO {
  @IsString()
  @MinLength(2, { message: '标题长度不能少于2个字符' })
  @MaxLength(100, { message: '标题长度不能超过100个字符' })
  title: string;

  @IsString()
  @MinLength(10, { message: '内容长度不能少于10个字符' })
  @MaxLength(2000, { message: '内容长度不能超过2000个字符' })
  content: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsNumber()
  @IsPositive({ message: '请选择有效的物品' })
  inventoryItemId: number; // 关联用户库存中的物品ID
}

/**
 * 获取帖子列表DTO
 */
export class ShowListDTO {
  @IsNumber()
  @IsOptional()
  page = 1; // 默认第1页

  @IsNumber()
  @IsOptional()
  pageSize = 10; // 默认每页10条
}

/**
 * 创建评论DTO
 */
export class CreateCommentDTO {
  @IsString()
  @MinLength(1, { message: '评论不能为空' })
  @MaxLength(500, { message: '评论长度不能超过500个字符' })
  content: string;
}

/**
 * 获取评论列表DTO
 */
export class CommentListDTO {
  @IsNumber()
  @IsOptional()
  page = 1;

  @IsNumber()
  @IsOptional()
  pageSize = 20;
}
