import React, { useState, useEffect } from 'react';
import {
    List,
    Card,
    Spin,
    message,
    Typography,
    Empty,
    Pagination,
    Tag
} from 'antd';
import { ClockCircleOutlined, ShoppingCartOutlined, DollarOutlined } from '@ant-design/icons';
import { getUserOrders, ApiResponse, OrderListResponse } from '../api';

const { Title, Text } = Typography;

const Order: React.FC = () => {
    const [orders, setOrders] = useState<OrderListResponse['items']>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0
    });

    const fetchOrders = async (page: number = 1, pageSize: number = 10) => {
        try {
            setLoading(true);
            const response = await getUserOrders({ page, limit: pageSize });
            const { success, data, message: errorMsg } = response.data;
            if (success && data) {
                setOrders(data.items);
                setPagination(prev => ({ ...prev, current: page, total: data.total }));
            } else {
                message.error(errorMsg || '获取订单失败');
            }
        } catch (error: any) {
            message.error(error.message || '网络错误');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handlePageChange = (page: number, pageSize: number) => {
        fetchOrders(page, pageSize);
    };

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
            <Title level={2}>我的订单</Title>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '50px 0' }}>
                    <Spin size="large" tip="加载订单中..." />
                </div>
            ) : orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px 0' }}>
                    <Empty description="暂无订单记录" />
                </div>
            ) : (
                <>
                    <List
                        itemLayout="vertical"
                        dataSource={orders}
                        renderItem={(order) => (
                            <Card
                                key={order.id}
                                hoverable
                                style={{ marginBottom: 16 }}
                                cover={
                                    order.blindBox.imageUrl && (
                                        <img
                                            src={order.blindBox.imageUrl}
                                            alt={order.blindBox.name}
                                            style={{ height: 200, objectFit: 'cover' }}
                                        />
                                    )
                                }
                            >
                                <Card.Meta
                                    title={
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <Text strong style={{ fontSize: 16 }}>{order.blindBox.name}</Text>
                                                <Tag
                                                    color={order.type === 'income' ? 'green' : 'red'}
                                                    style={{ marginLeft: 8 }}
                                                >
                                                    {order.type === 'income' ? '收入' : '支出'}
                                                </Tag>
                                            </div>
                                            <Text
                                                type={order.type === 'income' ? 'success' : 'danger'}
                                                strong
                                            >
                                                {order.type === 'income' ? '+' : '-'}{order.amount.toFixed(2)}
                                            </Text>
                                        </div>
                                    }
                                    description={
                                        <div style={{ marginTop: 10 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                                                <ClockCircleOutlined style={{ marginRight: 4, color: '#888' }} />
                                                <Text type="secondary">
                                                    交易时间：{new Date(order.createdAt).toLocaleString()}
                                                </Text>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                                                <DollarOutlined style={{ marginRight: 4, color: '#888' }} />
                                                <Text type="secondary">
                                                    {order.type === 'income' ? '收入来源' : '购买物品'}：
                                                    {order.item?.name || '未知物品'}
                                                </Text>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <ShoppingCartOutlined style={{ marginRight: 4, color: '#888' }} />
                                                <Text type="secondary">
                                                    订单号：{order.id}
                                                </Text>
                                            </div>
                                        </div>
                                    }
                                />
                            </Card>
                        )}
                    />

                    <div style={{ textAlign: 'center', marginTop: 30 }}>
                        <Pagination
                            current={pagination.current}
                            pageSize={pagination.pageSize}
                            total={pagination.total}
                            onChange={handlePageChange}
                            showSizeChanger={false}
                            showTotal={(total) => `共 ${total} 条订单`}
                        />
                    </div>
                </>
            )}
        </div>
    );
};

export default Order;