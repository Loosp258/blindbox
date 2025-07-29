import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Card, Button, Skeleton, message, Divider,
    Statistic, Result, Space, Modal, List, Avatar
} from 'antd';
import { ShoppingCartOutlined, ArrowLeftOutlined, ShoppingOutlined } from '@ant-design/icons';
import { getBlindBoxDetail, purchaseBlindBox } from '../api/index';
import './BlindBoxDrawPage.css';

interface BlindBoxItem {
    id: number;
    name: string;
    description: string;
    price: number;
    imageUrl?: string;
    stock: number;
    isActive: boolean;
    creator: { id: number; username: string };
    items: BoxItem[];
    category?: string;
}

interface BoxItem {
    id: number;
    name: string;
    description: string;
    rarity: string;
    imageUrl?: string;
    quantity: number;
}

// 稀有度颜色映射
const RARITY_COLORS: Record<string, string> = {
    '普通': '#8c8c8c',
    '稀有': '#1677ff',
    '史诗': '#722ed1',
    '传说': '#fa8c16',
    '神话': '#f5222d'
};

// 稀有度英文到中文映射
const RARITY_MAPPING: Record<string, string> = {
    'common': '普通',
    'rare': '稀有',
    'epic': '史诗',
    'legendary': '传说',
    'mythic': '神话'
};

const BlindBoxDrawPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [blindBox, setBlindBox] = useState<BlindBoxItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);
    const [drawResult, setDrawResult] = useState<BoxItem | null>(null);
    const [drawSuccess, setDrawSuccess] = useState(false);
    const [buyModalVisible, setBuyModalVisible] = useState(false);

    // 获取盲盒详情
    useEffect(() => {
        if (!id) {
            message.error('盲盒ID不存在');
            navigate('/blindbox');
            return;
        }

        const fetchBlindBox = async () => {
            try {
                const response = await getBlindBoxDetail(Number(id));
                if (response.data.success && response.data.data) {
                    // 转换稀有度为中文
                    const data = response.data.data as BlindBoxItem;
                    data.items = data.items.map(item => ({
                        ...item,
                        rarity: RARITY_MAPPING[item.rarity] || item.rarity
                    }));
                    setBlindBox(data);
                } else {
                    message.error('盲盒不存在');
                    navigate('/blindbox');
                }
            } catch (error) {
                message.error('获取盲盒详情失败');
                navigate('/blindbox');
            } finally {
                setLoading(false);
            }
        };

        fetchBlindBox();
    }, [id, navigate]);

    // 购买并抽取盲盒
    const handleDrawBlindBox = async () => {
        if (!blindBox || purchasing) return;

        if (blindBox.stock <= 0) {
            message.warning('盲盒库存不足');
            setBuyModalVisible(false);
            return;
        }

        setPurchasing(true);
        try {
            const response = await purchaseBlindBox(Number(id));
            if (response.data.success) {
                message.success('购买成功，正在抽取物品...');
                setTimeout(() => {
                    const item = response.data.data.item as BoxItem;
                    item.rarity = RARITY_MAPPING[item.rarity] || item.rarity;
                    setDrawResult(item);
                    setDrawSuccess(true);
                    setBuyModalVisible(false);
                }, 1500);
            } else {
                message.error(`购买失败：${response.data.message || '未知错误'}`);
            }
        } catch (error: any) {
            console.error('购买接口错误：', error);
            if (error.response?.status === 401) {
                message.error('未授权，请登录');
                navigate('/login');
            } else {
                message.error('购买失败，请重试');
            }
        } finally {
            setPurchasing(false);
        }
    };

    // 渲染盲盒内所有物品列表
    const renderAllItems = () => {
        if (!blindBox?.items || blindBox.items.length === 0) {
            return <div className="no-items">该盲盒暂无物品</div>;
        }

        return (
            <div className="all-items-container">
                <h3 className="items-title">盲盒包含物品</h3>
                <List
                    grid={{
                        gutter: 16,
                        xs: 1,
                        sm: 2,
                        md: 3,
                        lg: 4,
                        xl: 4,
                        xxl: 6,
                    }}
                    dataSource={blindBox.items}
                    renderItem={(item) => (
                        <List.Item>
                            <Card hoverable className="item-card">
                                <div className="item-image-container">
                                    {item.imageUrl ? (
                                        <img
                                            src={item.imageUrl}
                                            alt={item.name}
                                            className="item-image"
                                        />
                                    ) : (
                                        <div className="item-image-placeholder">
                                            <Avatar
                                                icon={<ShoppingOutlined />}
                                                style={{ backgroundColor: RARITY_COLORS[item.rarity] }}
                                            />
                                        </div>
                                    )}
                                </div>
                                <div className="item-info">
                                    <h4 className="item-name">{item.name}</h4>
                                    <div className="item-rarity" style={{ backgroundColor: RARITY_COLORS[item.rarity] }}>
                                        {item.rarity}
                                    </div>
                                </div>
                            </Card>
                        </List.Item>
                    )}
                />
            </div>
        );
    };

    // 渲染抽取结果
    const renderDrawResult = () => {
        if (!drawResult) return null;

        return (
            <div className="result-container">
                <Result
                    status={drawSuccess ? 'success' : 'error'}
                    title={drawSuccess ? '恭喜获得！' : '抽取失败'}
                    subTitle={drawSuccess ? `${drawResult.name} (${drawResult.rarity})` : '请重试'}
                    extra={drawSuccess ? (
                        <Space>
                            <Button
                                type="primary"
                                onClick={() => navigate('/inventory')}
                            >
                                查看我的物品
                            </Button>
                            <Button onClick={() => {
                                setDrawResult(null);
                                setDrawSuccess(false);
                            }}>
                                继续抽取
                            </Button>
                        </Space>
                    ) : (
                        <Button onClick={() => setDrawResult(null)}>返回</Button>
                    )}
                >
                    {drawSuccess && (
                        <div className="result-item">
                            <div className="result-item-image"
                                 style={{ borderColor: RARITY_COLORS[drawResult.rarity] }}>
                                {drawResult.imageUrl ? (
                                    <img src={drawResult.imageUrl} alt={drawResult.name} />
                                ) : (
                                    <div className="result-image-placeholder">
                                        <Avatar
                                            icon={<ShoppingOutlined />}
                                            style={{ backgroundColor: RARITY_COLORS[drawResult.rarity] }}
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="result-item-details">
                                <h4 style={{ color: RARITY_COLORS[drawResult.rarity] }}>
                                    {drawResult.name}
                                </h4>
                                <p className="item-description">{drawResult.description}</p>
                                <div className="item-rarity-tag"
                                     style={{ backgroundColor: RARITY_COLORS[drawResult.rarity] }}>
                                    {drawResult.rarity}
                                </div>
                            </div>
                        </div>
                    )}
                </Result>
            </div>
        );
    };

    // 渲染购买弹窗
    const renderBuyModal = () => {
        if (!blindBox) return null;

        return (
            <div className="buy-modal-content">
                <div className="modal-header">
                    <h2>确认购买</h2>
                    <p>盲盒：{blindBox.name}</p>
                </div>
                <div className="modal-body">
                    <Space size="middle">
                        <Statistic title="价格" value={blindBox.price} prefix="¥" />
                        <Statistic title="剩余库存" value={blindBox.stock} />
                    </Space>
                    {blindBox.stock <= 0 && (
                        <div className="stock-warning-modal">⚠️ 库存不足，无法购买</div>
                    )}
                </div>
                <div className="modal-footer">
                    <Button onClick={() => setBuyModalVisible(false)}>取消</Button>
                    <Button
                        type="primary"
                        icon={<ShoppingOutlined />}
                        loading={purchasing}
                        onClick={handleDrawBlindBox}
                        disabled={blindBox.stock <= 0}
                    >
                        {purchasing ? '购买中...' : `确认购买 (¥${blindBox.price.toFixed(2)})`}
                    </Button>
                </div>
            </div>
        );
    };

    if (loading) {
        return <Skeleton active paragraph={{ rows: 10 }} />;
    }

    if (!blindBox) {
        return (
            <Result status="404" title="未找到盲盒" subTitle="该盲盒可能已被删除或不存在" />
        );
    }

    return (
        <div className="blindbox-draw-container">
            <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/blindbox')}
                className="back-button"
            >
                返回盲盒列表
            </Button>

            <div className="blindbox-draw-content">
                {drawResult ? (
                    renderDrawResult()
                ) : (
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        {/* 盲盒详情卡片 */}
                        <Card className="blindbox-info-card">
                            <div className="blindbox-header">
                                <div className="blindbox-main-image">
                                    {blindBox.imageUrl ? (
                                        <img src={blindBox.imageUrl} alt={blindBox.name} />
                                    ) : (
                                        <div className="main-image-placeholder">
                                            <Avatar icon={<ShoppingCartOutlined />} size="large" />
                                        </div>
                                    )}
                                </div>
                                <div className="blindbox-details">
                                    <h2 className="blindbox-name">{blindBox.name}</h2>
                                    <p className="blindbox-description">{blindBox.description}</p>
                                    <Space className="blindbox-stats">
                                        <Statistic title="价格" value={blindBox.price} prefix="¥" />
                                        <Statistic title="库存" value={blindBox.stock} />
                                    </Space>
                                    <div className="creator-info">
                                        <span>创作者: {blindBox.creator.username}</span>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Divider />

                        {/* 盲盒内所有物品列表 */}
                        {renderAllItems()}

                        <Divider />

                        {/* 购买按钮 */}
                        <div className="draw-action">
                            <Button
                                type="primary"
                                size="large"
                                icon={<ShoppingCartOutlined />}
                                onClick={() => setBuyModalVisible(true)}
                                disabled={blindBox.stock <= 0}
                                className="draw-button"
                            >
                                立即购买
                            </Button>
                            {blindBox.stock <= 0 && <span className="stock-warning">库存不足</span>}
                        </div>
                    </Space>
                )}
            </div>

            {/* 购买弹窗 */}
            <Modal
                title="购买盲盒"
                open={buyModalVisible}
                onCancel={() => setBuyModalVisible(false)}
                maskClosable={false}
                footer={null}
                width={500}
                centered
                className="custom-buy-modal"
            >
                {renderBuyModal()}
            </Modal>
        </div>
    );
};

export default BlindBoxDrawPage;