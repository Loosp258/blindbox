//BlindBox.tsx
import React, { useState, useEffect } from 'react';
import { Link, Outlet } from 'react-router-dom';
import {
    Row, Col, Card, Button, Tabs, Badge,
    Skeleton, message, Empty, Space, Tag, Input
} from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import { getActiveBlindBoxes } from '../api/index';
import './BlindBox.css';

// 定义盲盒类型接口（强制包含category）
interface BlindBoxItem {
    id: number;
    name: string;
    description: string;
    price: number;
    imageUrl?: string;
    stock: number;
    isActive: boolean;
    creator: { id: number; username: string };
    items: { name: string; description: string; rarity: string }[];
    tags?: string[];
    userId?: number;
    createdAt: Date;
    category: string; // 改为必填，确保有值
}

// 分类数据（与后端一致）
const categories = [
    { key: 'all', label: '全部盲盒' },
    { key: '生活用品', label: '生活用品' },
    { key: '电子产品', label: '电子产品' },
    { key: '娱乐玩具', label: '娱乐玩具' },
    { key: '文创用品', label: '文创用品' }
];

// 价格区间筛选
const priceRanges = [
    { key: 'all', label: '全部价格' },
    { key: '0-50', label: '¥0-50' },
    { key: '50-100', label: '¥50-100' },
    { key: '100-200', label: '¥100-200' },
    { key: '200+', label: '¥200以上' }
];

const BlindBoxPage: React.FC = () => {
    const [blindBoxes, setBlindBoxes] = useState<BlindBoxItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('all');
    const [priceRange, setPriceRange] = useState('all');
    const [searchText, setSearchText] = useState('');

    // 获取所有激活的盲盒
    const fetchAllBlindBoxes = async () => {
        setLoading(true);
        try {
            const response = await getActiveBlindBoxes();
            if (response.data.success && Array.isArray(response.data.data)) {
                // 打印每个盲盒的category，确认是否存在
                response.data.data.forEach((box: any) => {
                    console.log(`盲盒 ${box.name} 的分类:`, box.category);
                });
                setBlindBoxes(response.data.data as BlindBoxItem[]);
            } else {
                message.error('获取盲盒数据失败');
                setBlindBoxes([]);
            }
        } catch (error) {
            message.error('获取盲盒列表失败');
            setBlindBoxes([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllBlindBoxes();
        const handleUpdate = () => fetchAllBlindBoxes();
        window.addEventListener('blindboxUpdated', handleUpdate);
        return () => window.removeEventListener('blindboxUpdated', handleUpdate);
    }, []);

    // 筛选盲盒
    const filteredBoxes = blindBoxes
        .filter(box => box.isActive)
        .filter(box => {
            // 分类筛选（直接匹配）
            if (activeCategory !== 'all') {
                return box.category === activeCategory;
            }

            // 价格筛选
            if (priceRange !== 'all') {
                const [min, max] = priceRange.split('-').map(Number);
                if (max) return box.price >= min && box.price <= max;
                else return box.price >= min;
            }

            // 搜索筛选
            if (searchText && !box.name.toLowerCase().includes(searchText.toLowerCase())) {
                return false;
            }

            return true;
        });

    const handleSearch = (value: string) => {
        setSearchText(value);
    };

    const renderSkeletons = () => (
        <Row gutter={[24, 24]} justify="center">
            {Array.from({ length: 8 }).map((_, i) => (
                <Col key={`skeleton-${i}`} xs={24} sm={12} md={8} lg={6}>
                    <Card hoverable className="blindbox-card">
                        <Skeleton active avatar={false} paragraph={{ rows: 3 }} />
                    </Card>
                </Col>
            ))}
        </Row>
    );

    return (
        <div className="blindbox-container">
            <div className="blindbox-header">
                <h1 className="blindbox-title">盲盒商城</h1>
                <div className="blindbox-search">
                    <Input.Search
                        placeholder="搜索盲盒..."
                        value={searchText}
                        onChange={e => handleSearch(e.target.value)}
                        onSearch={handleSearch}
                        style={{ width: 240 }}
                    />
                </div>
            </div>

            <div className="blindbox-filters">
                <Tabs
                    defaultActiveKey="all"
                    onChange={setActiveCategory}
                    tabBarStyle={{ marginBottom: 16 }}
                >
                    {categories.map(cat => (
                        <Tabs.TabPane tab={cat.label} key={cat.key} />
                    ))}
                </Tabs>

                <div className="price-filter">
                    <span className="filter-label">价格范围:</span>
                    <Space>
                        {priceRanges.map(range => (
                            <Button
                                key={range.key}
                                type={priceRange === range.key ? 'primary' : 'default'}
                                onClick={() => setPriceRange(range.key)}
                            >
                                {range.label}
                            </Button>
                        ))}
                    </Space>
                </div>
            </div>

            <div className="blindbox-list">
                {loading ? (
                    renderSkeletons()
                ) : filteredBoxes.length === 0 ? (
                    <Empty description="没有找到符合条件的盲盒" />
                ) : (
                    <Row gutter={[24, 24]} justify="center">
                        {filteredBoxes.map(box => (
                            <Col key={box.id} xs={24} sm={12} md={8} lg={6}>
                                <Card
                                    hoverable
                                    className="blindbox-card"
                                    cover={
                                        <div className="blindbox-image-container">
                                            {box.imageUrl ? (
                                                <img src={box.imageUrl} alt={box.name} className="blindbox-image" />
                                            ) : (
                                                <div className="blindbox-image-placeholder">
                                                    <div className="box-text">{box.category}</div>
                                                </div>
                                            )}
                                            <div className="blindbox-tags">
                                                {box.tags?.includes('新品') && <Badge status="processing" text="新品" />}
                                                {box.tags?.includes('热门') && <Badge status="error" text="热门" />}
                                            </div>
                                        </div>
                                    }
                                >
                                    <div className="blindbox-info">
                                        {/* 显示分类（确保有值） */}
                                        <div className="category-badge">
                                            {box.category}
                                        </div>
                                        <h3 className="blindbox-name">{box.name}</h3>
                                        <div className="blindbox-tags-list">
                                            {box.tags?.map(tag => (
                                                <Tag key={tag}>{tag}</Tag>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="blindbox-actions">
                                        <div className="price">¥{box.price.toFixed(2)}</div>
                                        <Button
                                            type="primary"
                                            icon={<ShoppingCartOutlined />}
                                            onClick={() => window.location.href = `/blindbox/draw/${box.id}`}
                                            disabled={box.stock <= 0}
                                            className="buy-button"
                                        >
                                            立即购买
                                        </Button>
                                    </div>

                                    <Link to={`/blindbox/draw/${box.id}`} className="detail-link">
                                        查看详情
                                    </Link>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}
            </div>

            <Outlet />
        </div>
    );
};

export default BlindBoxPage;