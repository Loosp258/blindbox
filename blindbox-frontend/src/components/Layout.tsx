//Layout.tsx
import React, { ReactNode, useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Button, Avatar, Dropdown, message } from 'antd';
import type { MenuProps } from 'antd/es/menu';
import {
    HomeOutlined,
    ShoppingOutlined,
    AppstoreOutlined,
    UserOutlined,
    LoginOutlined,
    LogoutOutlined,
    GiftOutlined
} from '@ant-design/icons';
// 导入 API 封装中的 getUserProfile 和 ApiResponse 类型
import { getUserProfile, ApiResponse } from '../api';
import './Layout.css';

const { Header, Content, Footer } = Layout;

// 用户类型定义（与 API 封装中的 User 类型保持一致）
interface User {
    id: number;
    username: string;
    email: string;
    balance?: number;
}

const AppLayout = ({ children }: { children?: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    // 获取用户信息（使用 API 封装中的 getUserProfile）
    const fetchUserProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }

            console.log('准备获取用户信息，token:', token);

            // 直接使用 API 封装中的 getUserProfile 方法
            const response = await getUserProfile();
            const apiResponse: ApiResponse<User> = response.data;

            if (apiResponse.success && apiResponse.data) {
                // 处理用户数据，确保类型安全
                const safeUser: User = {
                    id: apiResponse.data.id,
                    username: apiResponse.data.username,
                    email: apiResponse.data.email,
                    balance: typeof apiResponse.data.balance === 'number'
                        ? apiResponse.data.balance
                        : 0
                };
                console.log('用户信息获取成功:', safeUser);
                setUser(safeUser);
            } else {
                throw new Error(apiResponse.message || '获取用户信息失败');
            }
        } catch (error: any) {
            console.error('获取用户信息失败详情:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });

            setUser(null);
            // 避免重复跳转登录页
            if (error.response?.status === 401 && location.pathname !== '/login') {
                localStorage.removeItem('token');
                message.error('登录状态已过期，请重新登录');
                navigate('/login');
            } else {
                const errorMessage = error.response?.data?.message ||
                    error.message ||
                    '获取用户信息失败';
                message.error(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    // 页面路径变化时重新获取用户信息
    useEffect(() => {
        fetchUserProfile();
    }, [location.pathname]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        setUser(null);
        message.success('已成功退出登录');
        navigate('/login');
    };

    // 菜单配置
    const menuItems: MenuProps['items'] = [
        {
            key: 'inventory',
            label: (
                <Link to="/inventory">
                    <AppstoreOutlined /> 我的库存
                </Link>
            ),
        },
        {
            key: 'orders',
            label: (
                <Link to="/orders">
                    <ShoppingOutlined /> 我的订单
                </Link>
            ),
        },
        { type: 'divider' },
        {
            key: 'logout',
            label: <span onClick={handleLogout}><LogoutOutlined /> 退出登录</span>,
        },
    ];

    // 获取当前选中的菜单项
    const getSelectedKeys = () => {
        const path = location.pathname;
        if (path === '/') return ['home'];
        if (path.startsWith('/blindbox')) return ['blindbox'];
        if (path.startsWith('/orders')) return ['orders'];
        if (path.startsWith('/inventory')) return ['inventory'];
        if (path.startsWith('/show')) return ['show'];
        return [];
    };

    return (
        <Layout className="app-container">
            <Header className="app-header">
                <div className="logo">
                    <Link to="/">
                        <GiftOutlined style={{ fontSize: 24, color: '#fff', marginRight: 8 }} />
                        <span className="logo-text">盲盒抽盒机</span>
                    </Link>
                </div>

                <Menu
                    theme="dark"
                    mode="horizontal"
                    selectedKeys={getSelectedKeys()}
                    className="nav-menu"
                >
                    <Menu.Item key="home" icon={<HomeOutlined />}>
                        <Link to="/">首页</Link>
                    </Menu.Item>
                    <Menu.Item key="blindbox" icon={<AppstoreOutlined />}>
                        <Link to="/blindbox">盲盒商城</Link>
                    </Menu.Item>
                    <Menu.Item key="show" icon={<ShoppingOutlined />}>
                        <Link to="/shows">玩家秀</Link>
                    </Menu.Item>
                    {user && (
                        <Menu.Item key="inventory" icon={<AppstoreOutlined />}>
                            <Link to="/inventory">我的库存</Link>
                        </Menu.Item>
                    )}
                </Menu>

                <div className="header-actions">
                    {loading ? (
                        <div className="user-info">
                            <Avatar style={{ backgroundColor: '#1890ff' }} icon={<UserOutlined />} />
                            <span className="username">加载中...</span>
                        </div>
                    ) : user ? (
                        <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
                            <div className="user-info">
                                <Avatar style={{ backgroundColor: '#1890ff' }} icon={<UserOutlined />} />
                                <span className="username">{user.username}</span>
                                <span className="balance">
                                    ¥{(user.balance ?? 0).toFixed(2)}
                                </span>
                            </div>
                        </Dropdown>
                    ) : (
                        <Link to="/login">
                            <Button type="primary" icon={<LoginOutlined />} className="login-btn">
                                登录/注册
                            </Button>
                        </Link>
                    )}
                </div>
            </Header>

            <Content className="app-content">
                {children || <Outlet />}
            </Content>

            <Footer className="app-footer">
                <div className="footer-content">
                    <div className="footer-links">
                    </div>
                    <div className="copyright">
                        欧耶，盲盲的盒
                    </div>
                </div>
            </Footer>
        </Layout>
    );
};

export default AppLayout;