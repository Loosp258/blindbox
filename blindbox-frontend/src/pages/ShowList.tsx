// ShowList.tsx
import React, { useState, useEffect } from 'react';
import { List, Card, Button, message } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
// 导入 getUserProfile 和类型
import { getShows, deleteShow, getUserProfile, ApiResponse, Show, User } from '../api';
import CreateShowModal from '../components/CreateShowModal';
import {Link} from "react-router-dom";

// 用户类型（与后端返回匹配）
interface CurrentUser {
    id: number;
    username: string;
}

const ShowList: React.FC = () => {
    const [shows, setShows] = useState<Show[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    // 当前用户状态
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

    // 初始化：获取用户 + 帖子列表
    useEffect(() => {
        // 1. 获取当前用户（直接调用接口，和 Layout 一致）
        const fetchCurrentUser = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setCurrentUser(null);
                    return;
                }
                // 调用获取用户信息的接口
                const response = await getUserProfile();
                const apiResponse: ApiResponse<User> = response.data;

                if (apiResponse.success && apiResponse.data) {
                    // 转换为 CurrentUser 类型
                    const safeUser: CurrentUser = {
                        id: apiResponse.data.id,
                        username: apiResponse.data.username
                    };
                    setCurrentUser(safeUser);
                } else {
                    setCurrentUser(null);
                }
            } catch (error: any) {
                console.error('获取当前用户失败:', error);
                setCurrentUser(null);
            }
        };

        // 2. 获取帖子列表
        const fetchShows = async () => {
            try {
                setLoading(true);
                const response = await getShows();
                const res: ApiResponse<{ items: Show[]; total: number }> = response.data;

                if (res.success && res.data?.items) {
                    setShows(res.data.items);
                } else {
                    message.error(res.message || '加载帖子失败');
                }
            } catch (error: any) {
                console.error('获取帖子列表失败', error);
                message.error(error.message || '加载帖子列表失败');
            } finally {
                setLoading(false);
            }
        };

        // 先获取用户，再加载帖子（确保用户信息可用）
        fetchCurrentUser().then(fetchShows);
    }, []);

    // 刷新帖子列表
    const refreshShows = async () => {
        try {
            setLoading(true);
            const response = await getShows();
            const res: ApiResponse<{ items: Show[]; total: number }> = response.data;

            if (res.success && res.data?.items) {
                setShows(res.data.items);
            }
        } catch (error: any) {
            message.error(error.message || '刷新帖子失败');
        } finally {
            setLoading(false);
        }
    };

    // 删除帖子
    const handleDelete = async (showId: number) => {
        if (!currentUser) {
            message.error('请先登录');
            return;
        }

        if (!window.confirm('确定要删除这条帖子吗？删除后不可恢复')) {
            return;
        }

        try {
            const response = await deleteShow(showId);
            const res: ApiResponse = response.data;

            if (res.success) {
                message.success('帖子删除成功');
                refreshShows();
            } else {
                message.error(res.message || '删除失败');
            }
        } catch (error: any) {
            console.error('删除帖子失败', error);
            message.error(error.message || '删除失败，请重试');
        }
    };

    return (
        <div className="show-list-container" style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
            {/* 顶部按钮 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2>玩家秀</h2>
                <Button type="primary" onClick={() => setModalVisible(true)}>
                    发布新帖子
                </Button>
            </div>

            <hr />

            {/* 帖子列表 */}
            <List
                loading={loading}
                dataSource={shows}
                renderItem={(item) => {
                    // 打印日志（调试用）
                    console.log('当前用户ID:', currentUser?.id, '帖子作者ID:', item.user.id);

                    return (
                        <Card
                            key={item.id}
                            style={{ marginBottom: 16, transition: 'box-shadow 0.3s' }}
                            hoverable
                            actions={[
                                <Link to={`/shows/${item.id}`}>
                                    <Button type="text" size="small">查看详情</Button>
                                </Link>
                            ]}
                            extra={
                                // 严格匹配用户 ID（类型安全）
                                currentUser && item.user.id === currentUser.id ? (
                                    <Button
                                        danger
                                        icon={<DeleteOutlined />}
                                        size="small"
                                        onClick={() => handleDelete(item.id)}
                                    >
                                        删除
                                    </Button>
                                ) : null
                            }
                        >
                            <Card.Meta
                                title={item.title}
                                description={
                                    <>
                                        <div style={{ marginBottom: 8 }}>
                                            <span style={{ fontWeight: 500 }}>{item.user.username}</span>
                                            <span style={{ marginLeft: 8, color: '#666', fontSize: 12 }}>
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                                        </div>
                                        <p style={{ marginBottom: 12, color: '#333' }}>
                                            {item.content.length > 100
                                                ? `${item.content.slice(0, 100)}...`
                                                : item.content}
                                        </p>
                                        {item.imageUrl && (
                                            <img
                                                src={item.imageUrl}
                                                alt="帖子图片"
                                                style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 4 }}
                                            />
                                        )}
                                    </>
                                }
                            />
                        </Card>
                    );
                }}
                locale={{ emptyText: '暂无帖子，快来发布第一条吧！' }}
            />

            {/* 发布帖子弹窗 */}
            <CreateShowModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSuccess={refreshShows}
            />
        </div>
    );
};

export default ShowList;