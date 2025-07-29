//index.ts
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { message } from 'antd';
import { BlindBoxItem } from '../types/blindbox';

// 统一响应类型定义
export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data: T;
}
export interface BlindBox {
    id: number;
    name: string;        // 盲盒名称
    imageUrl?: string;   // 盲盒图片
    price: number;       // 盲盒价格（与订单金额关联）
}

export interface Order {
    id: number;          // 订单ID
    amount: number;      // 交易金额（与盲盒价格一致）
    createdAt: string;   // 交易时间
    blindBox: BlindBox;  // 关联的盲盒信息
    // 可选：如需展示抽到的具体物品
    item?: {
        id: number;
        name: string;
        rarity: string;
        imageUrl?: string;
    };
    type: 'expense' | 'income';
    // 可选：如果需要在前端使用卖家信息
    seller?: {
        id: number;
        username: string;
    };
}

// 订单列表响应类型
export interface OrderListResponse {
    items: Order[];      // 订单数组
    total: number;       // 总条数（用于分页）
}
export interface UploadResult {
    success: boolean;
    message?: string;
    data: {
        fileUrl?: string;
        filename?: string;
        url?: string;
    } | string; // 支持直接返回字符串的情况
    fileUrl: string;    // 存储的文件URL
    url?: string;       // 备用URL字段
    filename?: string;  // 原始文件名
}

export interface User {
    id: number;
    username: string;
    email: string;
    balance?: number;
}

export interface InventoryItem {
    id: number;
    quantity: number;
    acquiredAt: string;
    user: { id: number; username: string };
    item: {
        id: number;
        name: string;
        description: string;
        imageUrl: string;
        rarity: string;
    };
}

// 新增：帖子类型定义
export interface Show {
    id: number;
    title: string;
    content: string;
    imageUrl?: string;
    createdAt: string;
    user: User;
    comments?: Comment[];
    item: Item;
}

export interface CommentListResponse {
    items: Comment[];
    total: number;
}
export interface ShowListResponse {
    items: Show[];
    total: number;
}
// 新增：评论类型定义
export interface Comment {
    id: number;
    content: string;
    createdAt: string;
    user: User;
}
export interface Item {
    id: number;
    name: string;
    description: string;
    imageUrl: string;
    rarity: string;
}
// 创建 axios 实例 - 设置 baseURL
const instance = axios.create({
    baseURL: 'http://localhost:7001', // 添加后端服务器地址
    timeout: 10000,
});

// 请求拦截器
instance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error('请求错误:', error);
        return Promise.reject(error);
    }
);

// 响应拦截器
instance.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>): AxiosResponse<ApiResponse> => {
        return response;
    },
    (error) => {
        console.error('响应错误:', error);
        if (error.response) {
            const { status, data } = error.response;
            if (status === 401) {
                message.error('未授权，请登录');
                window.location.href = '/login';
            } else {
                message.error(data.message || `请求失败: ${status}`);
            }
        } else {
            message.error('网络错误，请检查网络连接');
        }
        return Promise.reject(error);
    }
);

// 认证相关API
export const login = (data: { identifier: string; password: string }): Promise<AxiosResponse<ApiResponse<{ token: string; user: User }>>> => {
    return instance.post('/api/auth/login', data);
};

export const register = (data: { username: string; email: string; password: string }): Promise<AxiosResponse<ApiResponse>> => {
    return instance.post('/api/auth/register', data);
};

export const getUserProfile = (): Promise<AxiosResponse<ApiResponse<User>>> => {
    return instance.get('/api/user/profile');
};

export const updateUserBalance = (amount: number): Promise<AxiosResponse<ApiResponse>> => {
    return instance.post('/api/user/balance', { amount });
};

// 盲盒相关API
export const getActiveBlindBoxes = (): Promise<AxiosResponse<ApiResponse<BlindBoxItem[]>>> => {
    return instance.get('/api/blindbox/list');
};

export const getBlindBoxDetail = (id: number): Promise<AxiosResponse<ApiResponse>> => {
    return instance.get(`/api/blindbox/detail/${id}`);
};

export const createBlindBox = (data: any): Promise<AxiosResponse<ApiResponse>> => {
    return instance.post('/api/blindbox/create', data);
};

export const updateBlindBox = (id: number, data: any): Promise<AxiosResponse<ApiResponse>> => {
    return instance.post(`/api/blindbox/update/${id}`, data);
};

export const deleteBlindBox = (id: number): Promise<AxiosResponse<ApiResponse>> => {
    return instance.delete(`/api/blindbox/${id}`);
};

export const getMyBlindBoxes = (): Promise<AxiosResponse<ApiResponse<BlindBoxItem[]>>> => {
    return instance.get('/api/my/blind-boxes');
};

export const addItemToBox = (boxId: number, data: any): Promise<AxiosResponse<ApiResponse>> => {
    return instance.post(`/api/blindbox/add-item`, { ...data, blindBoxId: boxId });
};

export const purchaseBlindBox = (boxId: number): Promise<AxiosResponse<ApiResponse>> => {
    return instance.post('/api/blindbox/purchase', { blindBoxId: boxId });
};

// 库存相关API
export const getUserInventory = (filter: any = {}): Promise<AxiosResponse<ApiResponse<InventoryItem[]>>> => {
    return instance.get('/api/inventory', { params: filter });
};

export const addItemToInventory = (item: any): Promise<AxiosResponse<ApiResponse>> => {
    return instance.post('/api/inventory/add', item);
};

// 订单相关API
export const getUserOrders = (filter: any = {}): Promise<AxiosResponse<ApiResponse<OrderListResponse>>> => {
    return instance.get('/api/order/history', { params: filter });
};

// 展示相关API（新增和修改）
export const getShows = (filter: any = {}) => {
    return instance.get<ApiResponse<ShowListResponse>>('/api/show/list', { params: filter });
};

export const getShowDetail = (id: number): Promise<AxiosResponse<ApiResponse<Show>>> => {
    return instance.get(`/api/show/detail/${id}`);
};

export const createShow = (data: any): Promise<AxiosResponse<ApiResponse>> => {
    return instance.post('/api/show/create', data);
};

export const createComment = (showId: number, content: string): Promise<AxiosResponse<ApiResponse>> => {
    return instance.post(`/api/show/comment/${showId}`, { content });
};

export const getComments = (showId: number, params: any) => {
    return instance.get<ApiResponse<CommentListResponse>>(`/api/show/comments/${showId}`, { params });
};
export const deleteShow = (showId: number): Promise<ApiResponse> => {
    return instance.delete(`/api/show/${showId}`);
};

// 图片上传API
export const uploadImage = (
    file: File,
    onProgress?: (progress: number) => void
): Promise<AxiosResponse<ApiResponse<UploadResult>>> => {
    const formData = new FormData();
    formData.append('image', file);

    const config: AxiosRequestConfig = {
        onUploadProgress: (progressEvent) => {
            if (progressEvent.total && onProgress) {
                const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
                onProgress(percent);
            }
        },
    };

    return instance.post('/api/upload/image', formData, config);
};
