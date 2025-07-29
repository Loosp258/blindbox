//InventoryPage.tsx
import React, { useEffect, useState } from 'react';
import { Table, Spin, message, Alert, Button } from 'antd';
import { getUserInventory } from '../api/index';
import { ApiResponse } from '../api/index';

// 明确库存项类型（与后端返回字段严格匹配）
interface InventoryItem {
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

// 稀有度颜色映射
const RARITY_COLORS = {
    'common': 'gray',
    'rare': '#1677ff',
    'epic': '#722ed1',
    'legendary': '#fa8c16',
};

const InventoryPage: React.FC = () => {
    const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await getUserInventory();
            console.log('后端返回完整数据:', response.data); // 关键：打印后端返回的所有数据

            if (response.data.success) {
                // 验证数据是否为数组并打印
                const data = Array.isArray(response.data.data) ? response.data.data : [];
                console.log('处理后的库存数组:', data);

                // 打印第一条数据的结构（重点排查item字段）
                if (data.length > 0) {
                    console.log('第一条库存数据详情:', data[0]);
                    console.log('物品名称是否存在:', data[0].item?.name);
                }

                setInventoryList(data);
            } else {
                throw new Error(response.data.message || '获取库存失败');
            }
        } catch (err: any) {
            setError(err.message || '加载库存时发生错误');
            message.error(err.message || '获取库存失败');
            setInventoryList([]);
        } finally {
            setLoading(false);
        }
    };

    // 表格列配置（添加调试打印，确保字段读取正确）
    const columns = [
        {
            title: '物品名称',
            dataIndex: ['item', 'name'],
            key: 'itemName',
            // 新增渲染函数，明确处理可能的undefined
            render: (name: string, record: InventoryItem) => {
                console.log('渲染物品名称:', name, '记录:', record);
                return name || '未知物品'; // 防止name为undefined时显示空白
            }
        },
        {
            title: '稀有度',
            dataIndex: ['item', 'rarity'],
            key: 'rarity',
            render: (rarity: string) => {
                console.log('渲染稀有度:', rarity);
                const color = RARITY_COLORS[rarity as keyof typeof RARITY_COLORS] || 'inherit';
                return <span style={{ color }}>{rarity || '未知'}</span>;
            }
        },
        {
            title: '数量',
            dataIndex: 'quantity',
            key: 'quantity',
            render: (quantity: number) => {
                console.log('渲染数量:', quantity);
                return quantity || 0; // 确保显示数字
            }
        },
        {
            title: '获取时间',
            dataIndex: 'acquiredAt',
            key: 'acquiredAt',
            render: (time: string) => {
                console.log('渲染时间:', time);
                try {
                    return time ? new Date(time).toLocaleString() : '未知时间';
                } catch (err) {
                    return '时间格式错误';
                }
            }
        }
    ];

    // 错误状态显示
    if (error) {
        return (
            <div style={{ padding: 24 }}>
                <h2>我的库存</h2>
                <Alert
                    message="加载失败"
                    description={error}
                    type="error"
                    showIcon
                    style={{ marginBottom: 16 }}
                />
                <Button onClick={fetchInventory} type="primary">
                    重试
                </Button>
            </div>
        );
    }

    return (
        <div style={{ padding: 24 }}>
            <h2>我的库存</h2>
            {/* 新增：显示库存数量，确认数据是否加载 */}
            <div style={{ marginBottom: 16 }}>
                共 {inventoryList.length} 件物品
            </div>
            <Spin spinning={loading} tip="加载库存中...">
                <Table
                    dataSource={inventoryList}
                    columns={columns}
                    rowKey="id"
                    bordered
                    pagination={{ pageSize: 10 }}
                    locale={{ emptyText: '暂无库存物品' }}
                />
            </Spin>
        </div>
    );
};

export default InventoryPage;