//api.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  Inject,
  Middleware,
  Query,
  Param,
  Options,
  Logger,
  RequestMapping,
  RequestMethod
} from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { PassportMiddleware, AuthenticateOptions } from '@midwayjs/passport';
import { RegisterDTO, LoginDTO } from '../dto/auth.dto';
import { UpdateBalanceDTO } from '../dto/balance.dto';
import {
  CreateBlindBoxDTO,
  AddItemToBoxDTO,
  PurchaseBoxDTO,
  BlindBoxSearchDTO
} from '../dto/blindbox.dto';
import {
  InventoryFilterDTO,
  PaginationDTO,
} from '../dto/inventory.dto';
import {
  OrderHistoryQueryDTO
} from '../dto/order.dto';
// 导入最新的玩家秀DTO
import {
  CreateShowDTO,
  ShowListDTO,
  CreateCommentDTO,
  CommentListDTO
} from '../dto/show.dto';
import { UserService } from '../service/user.service';
import { BlindBoxService } from '../service/blindbox.service';
import { InventoryService } from '../service/inventory.service';
import { OrderService } from '../service/order.service';
import { ShowService } from '../service/show.service';
import { JwtStrategy } from '../strategy/jwt.strategy';
import { BoxItem } from '../entity/boxitem.entity';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { Config } from '@midwayjs/core';
import { nanoid } from 'nanoid';
import * as path from "node:path";
import * as fs from "node:fs";

@Middleware()
export class JwtPassportMiddleware extends PassportMiddleware(JwtStrategy) {
  getAuthenticateOptions(): AuthenticateOptions {
    return { session: false };
  }

  ignore(ctx: Context): boolean {
    const ignorePaths = [
      '/api/auth/register',
      '/api/auth/login',
      '/favicon.ico',
      '/',
      '/api/blindbox/list',
      '/api/blindbox/detail',
      '/api/blindbox/search',
      '/api/show/list',          // 公开访问帖子列表
      '/api/show/detail/:id',    // 公开访问帖子详情
      '/api/upload/image',
    ];
    return ignorePaths.some(path => ctx.path === path);
  }
}

@Controller('/api', { middleware: [JwtPassportMiddleware] })
export class APIController {
  @Inject()
  ctx: Context;

  @Inject()
  userService: UserService;

  @Inject()
  blindBoxService: BlindBoxService;

  @Inject()
  inventoryService: InventoryService;

  @Inject()
  orderService: OrderService;

  @Inject()
  showService: ShowService;

  @Config('jwt.secret')
  jwtSecret: string;

  @Logger()
  logger;

  @Options('/*')
  async handleOptions() {
    this.ctx.status = 204;
    this.ctx.set('Access-Control-Allow-Origin', 'http://localhost:5173');
    this.ctx.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    this.ctx.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    this.ctx.set('Access-Control-Allow-Credentials', 'true');
  }

  // 认证相关路由（保持不变）
  @Post('/auth/register')
  async register(@Body() registerDTO: RegisterDTO) {
    try {
      if (await this.userService.isUsernameExist(registerDTO.username)) {
        this.ctx.status = 400;
        return { success: false, message: '用户名已存在' };
      }

      if (await this.userService.isEmailExist(registerDTO.email)) {
        this.ctx.status = 400;
        return { success: false, message: '邮箱已被注册' };
      }

      const user = await this.userService.createUser(registerDTO);
      return {
        success: true,
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          balance: user.balance,
          createdAt: user.createdAt
        }
      };
    } catch (error) {
      this.logger.error('注册失败:', error);
      this.ctx.status = 400;
      return { success: false, message: '注册失败: ' + error.message };
    }
  }

  @Post('/auth/login')
  async login(@Body() loginDTO: LoginDTO) {
    try {
      const isEmail = loginDTO.identifier.includes('@');
      let user;

      if (isEmail) {
        user = await this.userService.getUserByEmail(loginDTO.identifier);
      } else {
        user = await this.userService.getUserByUsername(loginDTO.identifier);
      }

      if (!user) {
        this.ctx.status = 401;
        return { success: false, message: '用户名或密码错误' };
      }

      const isPasswordValid = await bcrypt.compare(loginDTO.password, user.password);
      if (!isPasswordValid) {
        this.ctx.status = 401;
        return { success: false, message: '用户名或密码错误' };
      }

      const token = jwt.sign(
        { sub: user.id, username: user.username },
        this.jwtSecret,
        { expiresIn: '2d' }
      );

      return {
        success: true,
        data: {
          token: token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            balance: user.balance
          }
        }
      };
    } catch (error) {
      this.logger.error('登录错误:', error);
      this.ctx.status = 500;
      return { success: false, message: '登录失败: ' + error.message };
    }
  }

  @Get('/user/profile')
  async getUserProfile() {
    const userId = this.ctx.state.user?.id;
    if (!userId) {
      this.ctx.status = 401;
      return { success: false, message: '未授权' };
    }

    const user = await this.userService.getUserById(userId);
    if (!user) {
      this.ctx.status = 404;
      return { success: false, message: '用户不存在' };
    }

    return {
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        balance: user.balance,
        createdAt: user.createdAt
      }
    };
  }

  @Post('/user/balance')
  async updateUserBalance(@Body() dto: UpdateBalanceDTO) {
    const userId = this.ctx.state.user?.id;
    if (!userId) {
      this.ctx.status = 401;
      return { success: false, message: '未授权' };
    }

    try {
      const user = await this.userService.updateUserBalance(userId, dto.amount, 'add');
      return {
        success: true,
        data: { balance: user.balance }
      };
    } catch (error) {
      this.logger.error('更新余额失败:', error);
      this.ctx.status = 400;
      return { success: false, message: error.message };
    }
  }

  // 盲盒相关路由（保持不变）
  @Post('/blindbox/create')
  async createBlindBox(@Body() dto: CreateBlindBoxDTO) {
    try {
      const userId = this.ctx.state.user?.id;
      if (!userId) {
        return { success: false, message: '未授权' };
      }
      const blindBox = await this.blindBoxService.createBlindBox(userId, dto);
      this.ctx.app.emit('blindboxUpdated');
      return { success: true, data: blindBox };
    } catch (error: any) {
      this.logger.error('创建盲盒失败:', error);
      this.ctx.status = 400;
      return { success: false, message: error.message || '参数验证失败' };
    }
  }

  @Post('/blindbox/update/:id')
  async updateBlindBox(
    @Param('id') id: number,
    @Body() dto: Partial<CreateBlindBoxDTO>
  ) {
    const userId = this.ctx.state.user?.id;
    if (!userId) {
      this.ctx.status = 401;
      return { success: false, message: '未授权' };
    }

    try {
      const isOwner = await this.blindBoxService.checkCreatorOwnership(userId, id);
      if (!isOwner) {
        this.ctx.status = 403;
        return { success: false, message: '无权修改此盲盒' };
      }

      const updatedBox = await this.blindBoxService.updateBlindBox(userId, id, dto);
      this.ctx.app.emit('blindboxUpdated');
      return {
        success: true,
        data: updatedBox
      };
    } catch (error: any) {
      this.logger.error(`更新盲盒失败: ${error.message}`);
      this.ctx.status = 400;
      return { success: false, message: error.message || '更新盲盒失败' };
    }
  }

  @Post('/blindbox/add-item')
  async addItemToBox(@Body() dto: AddItemToBoxDTO) {
    const userId = this.ctx.state.user?.id;
    if (!userId) {
      this.ctx.status = 401;
      return { success: false, message: '未授权' };
    }

    const isOwner = await this.blindBoxService.checkCreatorOwnership(userId, dto.blindBoxId);
    if (!isOwner) {
      this.ctx.status = 403;
      return { success: false, message: '无权操作此盲盒' };
    }

    const item = await this.blindBoxService.addBlindBoxItem(dto.blindBoxId, dto);
    return {
      success: true,
      data: item
    };
  }

  @Get('/blindbox/list')
  async getActiveBlindBoxes() {
    try {
      const blindBoxes = await this.blindBoxService.getActiveBlindBoxes();
      this.logger.info(`获取商城盲盒列表，共 ${blindBoxes.length} 个盲盒`);
      return {
        success: true,
        data: blindBoxes
      };
    } catch (error) {
      console.error('获取商城盲盒错误:', error);
      this.ctx.status = 500;
      return {
        success: false,
        message: '获取盲盒列表失败'
      };
    }
  }

  @Get('/blindbox/detail/:id')
  async getBlindBoxDetail(@Param('id') id: number) {
    const blindBox = await this.blindBoxService.getBlindBoxDetail(id);
    if (!blindBox) {
      this.ctx.status = 404;
      return { success: false, message: '盲盒不存在' };
    }
    return {
      success: true,
      data: blindBox
    };
  }

  @Post('/blindbox/purchase')
  async purchaseBlindBox(@Body() dto: PurchaseBoxDTO) {
    const userId = this.ctx.state.user?.id;
    if (!userId) {
      this.ctx.status = 401;
      return { success: false, message: '未授权' };
    }

    try {
      const result = await this.orderService.purchaseBlindBox(userId, dto);
      return {
        success: true,
        data: {
          order: result.order,
          item: result.item
        }
      };
    } catch (error: any) {
      this.logger.error(`购买接口错误：${error.message}`);
      this.ctx.status = 400;
      return {
        success: false,
        message: error.message || '购买失败'
      };
    }
  }

  @RequestMapping({
    path: '/blindbox/:id',
    requestMethod: RequestMethod.DELETE
  })
  async deleteBlindBox(@Param('id') id: number) {
    const userId: any = this.ctx.state.user?.id;
    if (!userId) {
      this.ctx.status = 401;
      return { success: false, message: '未授权' };
    }

    try {
      await this.blindBoxService.deleteBlindBox(userId, id);
      this.ctx.app.emit('blindboxUpdated');
      return {
        success: true,
        message: '盲盒已成功删除'
      };
    } catch (error: any) {
      this.logger.error('删除盲盒失败:', error);
      this.ctx.status = 400;
      return { success: false, message: error.message || '删除盲盒失败' };
    }
  }

  @Get('/blindbox/search')
  async searchBlindBoxes(@Query() dto: BlindBoxSearchDTO) {
    const [blindBoxes, total] = await this.blindBoxService.searchBlindBoxes(dto);
    return {
      success: true,
      data: {
        items: blindBoxes,
        total
      }
    };
  }

  @Get('/my/blind-boxes')
  async getMyBlindBoxes() {
    const userId = this.ctx.state.user?.id;
    if (!userId) {
      this.ctx.status = 401;
      return { success: false, message: '未授权' };
    }

    const myBoxes = await this.blindBoxService.getBlindBoxesByUserId(userId);
    return {
      success: true,
      data: myBoxes
    };
  }

  // 库存接口（保持不变）
  @Get('/inventory')
  async getInventory(@Query() dto: InventoryFilterDTO & PaginationDTO) {
    const userId = this.ctx.state.user?.id;
    if (!userId) {
      this.ctx.status = 401;
      return { success: false, message: '未授权' };
    }

    const [items] = await this.inventoryService.getUserInventory(userId, dto, dto);
    return {
      success: true,
      data: items
    };
  }

  @Post('/inventory/add')
  async addItemToInventory(@Body() item: BoxItem) {
    const userId = this.ctx.state.user?.id;
    if (!userId) {
      this.ctx.status = 401;
      return { success: false, message: '未授权' };
    }

    const inventory = await this.inventoryService.addItemToInventory(
      await this.userService.getUserById(userId),
      item
    );
    return {
      success: true,
      data: inventory
    };
  }

  @Get('/order/history')
  async getOrderHistory(@Query() dto: OrderHistoryQueryDTO) {
    const userId = this.ctx.state.user?.id;
    if (!userId) {
      this.ctx.status = 401;
      return { success: false, message: '未授权' };
    }

    const [orders, total] = await this.orderService.getUserOrders(userId, dto);
    return {
      success: true,
      data: {
        items: orders,
        total
      }
    };
  }

  // 玩家秀相关接口（核心修改部分）
  @Post('/show/create')
  async createShow(@Body() dto: CreateShowDTO) {
    const userId = this.ctx.state.user?.id;
    if (!userId) {
      this.ctx.status = 401;
      return { success: false, message: '未授权' };
    }

    try {
      const show = await this.showService.createShow(userId, dto);
      return {
        success: true,
        data: show
      };
    } catch (error: any) {
      this.logger.error('创建帖子失败:', error);
      this.ctx.status = 400;
      return { success: false, message: error.message };
    }
  }

  @Get('/show/list')
  async getShows(@Query() dto: ShowListDTO) {
    try {
      const { shows, total } = await this.showService.getShowList(dto);
      return {
        success: true,
        data: {
          items: shows,
          total
        }
      };
    } catch (error: any) {
      this.logger.error('获取帖子列表失败:', error);
      this.ctx.status = 500;
      return { success: false, message: error.message };
    }
  }

  @Get('/show/detail/:id')
  async getShowDetail(@Param('id') id: number) {
    try {
      const show = await this.showService.getShowDetail(id);
      return {
        success: true,
        data: show
      };
    } catch (error: any) {
      this.logger.error('获取帖子详情失败:', error);
      this.ctx.status = 404;
      return { success: false, message: error.message };
    }
  }

  @RequestMapping({
    path: '/show/:id',
    requestMethod: RequestMethod.DELETE
  })
  async deleteShow(@Param('id') id: number) {
    const userId = this.ctx.state.user?.id;
    if (!userId) {
      this.ctx.status = 401;
      return { success: false, message: '未登录' };
    }

    try {
      await this.showService.deleteShow(id, userId);
      return {
        success: true,
        message: '帖子已成功删除'
      };
    } catch (error: any) {
      this.ctx.status = 403;
      return {
        success: false,
        message: error.message || '删除失败'
      };
    }
  }

  @Post('/show/comment/:showId')
  async createComment(
    @Param('showId') showId: number,
    @Body() dto: CreateCommentDTO
  ) {
    const userId = this.ctx.state.user?.id;
    if (!userId) {
      this.ctx.status = 401;
      return { success: false, message: '未授权' };
    }

    try {
      const comment = await this.showService.createComment(userId, showId, dto);
      return {
        success: true,
        data: comment
      };
    } catch (error: any) {
      this.logger.error('创建评论失败:', error);
      this.ctx.status = 400;
      return { success: false, message: error.message };
    }
  }

  @Get('/show/comments/:showId')
  async getComments(
    @Param('showId') showId: number,
    @Query() dto: CommentListDTO
  ) {
    try {
      const comments = await this.showService.getComments(showId, dto);
      return {
        success: true,
        data: comments
      };
    } catch (error: any) {
      this.logger.error('获取评论失败:', error);
      this.ctx.status = 500;
      return { success: false, message: error.message };
    }
  }

  // 图片上传API（保持不变）
  @Post('/upload/image')
  async uploadImage() {
    try {
      this.logger.info('===== 上传请求开始 =====');
      const file = this.ctx.file;
      if (!file) {
        this.logger.error('文件解析失败：ctx.file为undefined');
        this.ctx.status = 400;
        return { success: false, message: '未解析到文件，请检查请求格式' };
      }

      const fileExt = path.extname(file.originalname).toLowerCase();
      const allowedExts = ['.jpg', '.jpeg', '.png', '.gif'];
      if (!allowedExts.includes(fileExt)) {
        this.ctx.status = 400;
        return { success: false, message: '仅支持jpg、png、gif格式' };
      }

      if (file.size > 2 * 1024 * 1024) {
        this.ctx.status = 400;
        return { success: false, message: '文件大小不能超过2MB' };
      }

      const uploadDir = path.join(process.cwd(), 'public/upload');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const fileName = `${nanoid(10)}${fileExt}`;
      const savePath = path.join(uploadDir, fileName);
      await fs.promises.copyFile(file.path, savePath);
      fs.unlinkSync(file.path);

      const imageUrl = `/upload/${fileName}`;
      return {
        success: true,
        data: { fileUrl: imageUrl }
      };
    } catch (error) {
      this.logger.error('上传失败详情:', error);
      this.ctx.status = 500;
      return { success: false, message: '上传失败: ' + (error as Error).message };
    }
  }
}
