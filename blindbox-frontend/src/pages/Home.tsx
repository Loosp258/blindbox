// Home.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
    Button,
    Typography,
    Row,
    Col,
    Card,
    message,
    Modal,
    Form,
    Input,
    Space,
    Skeleton,
    InputNumber,
    Select, Spin, Tag, Badge,
} from 'antd';
import {
    GiftOutlined,
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
} from '@ant-design/icons';
import {
    getMyBlindBoxes,
    deleteBlindBox,
    createBlindBox,
    updateBlindBox,
    getUserProfile
} from '../api';
import EnhancedImageUpload from '../components/EnhancedImageUpload';
import './Home.css';

const { Title, Text } = Typography;
const { Option } = Select;

// 工具函数：确保 imageUrl 是有效的字符串，并强制使用后端服务地址
const ensureImageUrl = (url: any): string => {
    // 处理 undefined、null、空字符串或无效对象
    if (!url || typeof url !== 'string' || url.includes('[object Object]')) {
        return '/default-placeholder.png';
    }

    // 强制使用后端服务地址（http://localhost:7001）
    const backendBase = 'http://localhost:7001';

    // 如果是完整 URL（如 http://... 或 https://...），直接返回
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }

    // 如果是相对路径（如 /upload/xxx.png），拼接后端地址
    if (url.startsWith('/')) {
        return `${backendBase}${url}`;
    }

    // 其他情况，默认拼接 /upload/ 路径
    return `${backendBase}/upload/${url}`;
};

// 定义物品类型
interface BoxItem {
    id?: number;
    name: string;
    description: string;
    quantity: number;
    imageUrl: string;
    probability: number;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

// 定义API返回的物品类型
interface ApiBoxItem {
    id?: number;
    name: string;
    description: string;
    quantity?: number;
    imageUrl?: string;
    probability?: number;
    rarity: string;
}

// 定义盲盒类型
interface BlindBox {
    id: number;
    name: string;
    description: string;
    price: number;
    imageUrl?: string;
    category: string;
    tags?: string[];
    userId: number;
    stock: number;
    items: BoxItem[];
}

// 定义API返回的盲盒项类型
interface ApiBlindBoxItem {
    id: number;
    name: string;
    description: string;
    price: number;
    imageUrl?: string;
    category?: string;
    tags?: string[];
    userId?: number;
    stock: number;
    items: ApiBoxItem[];
}

interface ItemFormProps {
    item: BoxItem;
    index: number;
    onUpdate: (partialItem: Partial<BoxItem>) => void;
    onRemove: () => void;
    onImageUpload: (fileUrl: string) => void;
    isDeleting: boolean;
}

const ItemForm: React.FC<ItemFormProps> = React.memo(
    (props) => {
        const {
            item,
            index,
            onUpdate,
            onRemove,
            onImageUpload,
            isDeleting,
        } = props;

        return (
            <div
                className="item-form"
                style={{
                    marginBottom: 24,
                    padding: 16,
                    border: '1px solid #e8e8e8',
                    borderRadius: 4,
                    opacity: isDeleting ? 0.5 : 1,
                    transition: 'opacity 0.3s ease',
                    pointerEvents: isDeleting ? 'none' : 'auto',
                }}
            >
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            label="物品名称"
                            rules={[{ required: true, message: '请输入物品名称' }]}
                        >
                            <Input
                                placeholder="例如：精美笔记本"
                                value={item.name}
                                onChange={(e) => onUpdate({ name: e.target.value })}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="稀有度"
                            rules={[{ required: true, message: '请选择稀有度' }]}
                        >
                            <Select
                                placeholder="选择稀有度"
                                value={item.rarity}
                                onChange={(value: 'common' | 'rare' | 'epic' | 'legendary') =>
                                    onUpdate({ rarity: value })
                                }
                            >
                                <Option value="common">普通</Option>
                                <Option value="rare">稀有</Option>
                                <Option value="epic">史诗</Option>
                                <Option value="legendary">传说</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item
                            label="物品描述"
                            rules={[{ required: true, message: '请输入物品描述' }]}
                        >
                            <Input.TextArea
                                rows={2}
                                placeholder="描述物品特点"
                                value={item.description}
                                onChange={(e) => onUpdate({ description: e.target.value })}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            label="物品数量"
                            rules={[
                                {
                                    required: true,
                                    message: '请输入物品数量',
                                    type: 'number',
                                    min: 1,
                                },
                            ]}
                        >
                            <InputNumber
                                min={1}
                                placeholder="至少1个"
                                value={item.quantity}
                                onChange={(value) =>
                                    onUpdate({ quantity: value || 1 })
                                }
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            label="抽取概率 (%)"
                            rules={[
                                {
                                    required: true,
                                    message: '请输入抽取概率',
                                    type: 'number',
                                    min: 0.01,
                                    max: 100,
                                },
                            ]}
                        >
                            <InputNumber
                                min={0.01}
                                max={100}
                                step={0.01}
                                placeholder="0.01-100"
                                value={item.probability}
                                onChange={(value) =>
                                    onUpdate({ probability: value || 0 })
                                }
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            label="物品图片"
                            rules={[{ required: true, message: '请上传物品图片' }]}
                        >
                            <EnhancedImageUpload
                                value={item.imageUrl}
                                onChange={onImageUpload}
                                maxSize={2}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Button
                    type="link"
                    danger
                    onClick={onRemove}
                    style={{ marginTop: 8 }}
                    loading={isDeleting}
                >
                    {isDeleting ? '删除中...' : '删除此物品'}
                </Button>
            </div>
        );
    },
    (prevProps, nextProps) => {
        return (
            prevProps.item.name === nextProps.item.name &&
            prevProps.item.description === nextProps.item.description &&
            prevProps.item.quantity === nextProps.item.quantity &&
            prevProps.item.imageUrl === nextProps.item.imageUrl &&
            prevProps.item.probability === nextProps.item.probability &&
            prevProps.item.rarity === nextProps.item.rarity &&
            prevProps.isDeleting === nextProps.isDeleting
        );
    }
);

const HomePage: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const [myBlindBoxes, setMyBlindBoxes] = useState<BlindBox[]>([]);
    const [isCreateBoxModalVisible, setIsCreateBoxModalVisible] = useState(false);
    const [isEditBoxModalVisible, setIsEditBoxModalVisible] = useState(false);
    const [currentBox, setCurrentBox] = useState<BlindBox | null>(null);
    const [loading, setLoading] = useState(true);
    const [form] = Form.useForm();
    const [items, setItems] = useState<BoxItem[]>([]);
    const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
    const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({});
    const navigate = useNavigate();
    const location = useLocation();

    const categories = [
        { label: '生活用品', value: '生活用品' },
        { label: '电子产品', value: '电子产品' },
        { label: '娱乐玩具', value: '娱乐玩具' },
        { label: '文创用品', value: '文创用品' },
    ];

    const fetchMyBlindBoxes = async () => {
        setLoading(true);
        try {
            const response = await getMyBlindBoxes();

            const processedBoxes = (response.data.data || []).map((box: ApiBlindBoxItem) => ({
                ...box,
                category: box.category || '未分类',
                userId: box.userId || 0,
                items: (box.items || []).map((apiItem: ApiBoxItem) => ({
                    id: apiItem.id,
                    name: apiItem.name,
                    description: apiItem.description,
                    quantity: apiItem.quantity || 1,
                    imageUrl: apiItem.imageUrl || '',
                    probability: apiItem.probability || 0,
                    rarity: (['common', 'rare', 'epic', 'legendary'].includes(apiItem.rarity)
                        ? apiItem.rarity
                        : 'common') as 'common' | 'rare' | 'epic' | 'legendary',
                })),
            })) as BlindBox[];

            setMyBlindBoxes(processedBoxes);
        } catch (error: any) {
            const errorMsg = error.response?.data?.message ||
                error.message ||
                '获取我的盲盒失败';
            message.error(errorMsg);
            console.error('获取盲盒错误详情:', error);
            setMyBlindBoxes([]);
        } finally {
            setLoading(false);
        }
    };

    const initData = async () => {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                const userResponse = await getUserProfile();
                if (userResponse.data.success && userResponse.data.data) {
                    setUser(userResponse.data.data);
                    localStorage.setItem('user', JSON.stringify(userResponse.data.data));
                }
            } else {
                setUser(null);
                localStorage.removeItem('user');
            }
        } catch (error: any) {
            const errorMsg = error.response?.data?.message ||
                error.message ||
                '获取用户信息失败';
            console.error('获取用户信息失败:', error);
            message.error(errorMsg);
            setUser(null);
            localStorage.removeItem('user');
        }

        await fetchMyBlindBoxes();
    };

    useEffect(() => {
        initData();

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                initData();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        const handleBlindBoxUpdate = () => {
            fetchMyBlindBoxes();
        };
        window.addEventListener('blindboxUpdated', handleBlindBoxUpdate);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blindboxUpdated', handleBlindBoxUpdate);
        };
    }, []);

    useEffect(() => {
        const initialLoading = myBlindBoxes.reduce((acc, box) => {
            acc[box.id] = true;
            return acc;
        }, {} as Record<string, boolean>);

        setImageLoading(initialLoading);
    }, [myBlindBoxes]);

    useEffect(() => {
        if (isCreateBoxModalVisible || isEditBoxModalVisible) {
            if (!currentBox) {
                setItems([
                    {
                        name: '',
                        description: '',
                        quantity: 1,
                        imageUrl: '',
                        probability: 100,
                        rarity: 'common',
                    },
                ]);
            } else {
                setItems([...(currentBox.items || [])]);
            }
        }
    }, [isCreateBoxModalVisible, isEditBoxModalVisible, currentBox]);

    const handleCreateBox = () => {
        form.resetFields();
        setCurrentBox(null);
        setIsCreateBoxModalVisible(true);
    };

    const handleEditBox = (box: BlindBox) => {
        form.setFieldsValue({
            name: box.name,
            description: box.description,
            price: box.price,
            imageUrl: box.imageUrl,
            category: box.category,
            tags: box.tags?.join(','),
            stock: box.stock,
        });
        setCurrentBox(box);
        setIsEditBoxModalVisible(true);
    };

    const handleDeleteBox = async (boxId: number) => {
        try {
            const response = await deleteBlindBox(boxId);
            if (response.data.success) {
                message.success('盲盒已删除');
                fetchMyBlindBoxes();
                window.dispatchEvent(new Event('blindboxUpdated'));
            } else {
                message.error(response.data.message || '删除失败');
            }
        } catch (error: any) {
            message.error(error.message || '删除失败');
        }
    };

    const handleAddItem = useCallback(() => {
        setItems((prev) => [
            ...prev,
            {
                name: '',
                description: '',
                quantity: 1,
                imageUrl: '',
                probability: 0,
                rarity: 'common',
            },
        ]);
    }, []);

    const handleRemoveItem = useCallback(
        (index: number) => {
            if (items.length <= 1) {
                message.warning('至少保留一个物品');
                return;
            }

            setDeletingIndex(index);
            setTimeout(() => {
                setItems((prev) => prev.filter((_, i) => i !== index));
                setDeletingIndex(null);
            }, 300);
        },
        [items.length]
    );

    // 创建盲盒提交
    const onFinishCreateBox = async (values: any) => {
        try {
            if (!user) {
                message.error('请先登录');
                return;
            }

            if (items.length === 0) {
                message.error('请至少添加一个物品');
                return;
            }

            const totalProbability = items.reduce(
                (sum, item) => sum + (item.probability || 0),
                0
            ).toFixed(2);

            if (Math.abs(Number(totalProbability) - 100) > 0.01) {
                message.error(`物品概率总和必须为100%（当前：${totalProbability}%）`);
                return;
            }

            // 确保所有图片URL有效（使用工具函数处理）
            const validImageUrl = ensureImageUrl(values.imageUrl);
            if (validImageUrl === '/default-placeholder.png') {
                message.error('请上传有效的盲盒主图');
                return;
            }

            const validItems = items.map(item => ({
                ...item,
                imageUrl: ensureImageUrl(item.imageUrl)
            }));

            const blindBoxData: Partial<BlindBox> = {
                ...values,
                imageUrl: validImageUrl,
                userId: user.id,
                tags: values.tags ? values.tags.split(',').map((t: string) => t.trim()) : [],
                items: validItems
            };

            const response = await createBlindBox(blindBoxData);
            if (response.data.success) {
                message.success('盲盒创建成功');
                setIsCreateBoxModalVisible(false);
                fetchMyBlindBoxes();
                window.dispatchEvent(new Event('blindboxUpdated'));
            } else {
                message.error(response.data.message || '创建失败');
            }
        } catch (error: any) {
            message.error(error.message || '创建失败');
        }
    };

    // 编辑盲盒提交
    const onFinishEditBox = async (values: any) => {
        try {
            if (!currentBox || !user) return;

            if (items.length === 0) {
                message.error('请至少保留一个物品');
                return;
            }

            const totalProbability = items.reduce(
                (sum, item) => sum + (item.probability || 0),
                0
            ).toFixed(2);

            if (Math.abs(Number(totalProbability) - 100) > 0.01) {
                message.error(`物品概率总和必须为100%（当前：${totalProbability}%）`);
                return;
            }

            // 确保所有图片URL有效（使用工具函数处理）
            const validImageUrl = ensureImageUrl(values.imageUrl);
            if (validImageUrl === '/default-placeholder.png') {
                message.error('请上传有效的盲盒主图');
                return;
            }

            const validItems = items.map(item => ({
                ...item,
                imageUrl: ensureImageUrl(item.imageUrl)
            }));

            const updateData = {
                ...values,
                imageUrl: validImageUrl,
                tags: values.tags ? values.tags.split(',').map((t: string) => t.trim()) : [],
                items: validItems
            };

            const response = await updateBlindBox(currentBox.id, updateData);
            if (response.data.success) {
                message.success('盲盒更新成功');
                setIsEditBoxModalVisible(false);
                fetchMyBlindBoxes();
                window.dispatchEvent(new Event('blindboxUpdated'));
            } else {
                message.error(response.data.message || '更新失败');
            }
        } catch (error: any) {
            message.error(error.message || '更新失败');
        }
    };

    const renderSkeletons = () => (
        <Row gutter={[24, 24]} justify="center">
            {Array.from({ length: 6 }).map((_, i) => (
                <Col key={`skeleton-${i}`} xs={24} sm={12} md={8} lg={6}>
                    <Card hoverable className="feature-card">
                        <Skeleton active avatar={false} paragraph={{ rows: 3 }} />
                    </Card>
                </Col>
            ))}
        </Row>
    );

    const renderMyBlindBoxes = () => {
        if (loading) return renderSkeletons();

        if (myBlindBoxes.length === 0) {
            return (
                <div className="empty-state">
                    <GiftOutlined style={{ fontSize: '64px', color: '#ccc', marginBottom: 16 }} />
                    <Text>你还没有创建任何盲盒</Text>
                    <Button
                        type="primary"
                        onClick={handleCreateBox}
                        style={{ marginTop: 16 }}
                    >
                        创建第一个盲盒
                    </Button>
                </div>
            );
        }

        return (
            <Row gutter={[24, 24]} justify="center">
                {myBlindBoxes.map(box => (
                    <Col key={box.id} xs={24} sm={12} md={8} lg={6}>
                        {/* 对齐商城页面的卡片结构 */}
                        <Card
                            hoverable
                            className="blindbox-card" // 复用商城卡片的 className
                            cover={
                                <div className="blindbox-image-container"> {/* 商城同款容器 */}
                                    {box.imageUrl ? (
                                        <img
                                            src={ensureImageUrl(box.imageUrl)}
                                            alt={box.name}
                                            className="blindbox-image" // 商城同款图片样式
                                        />
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
                            <div className="blindbox-info"> {/* 商城同款信息区域 */}
                                <div className="category-badge">{box.category}</div>
                                <h3 className="blindbox-name">{box.name}</h3>
                                <div className="blindbox-tags-list">
                                    {box.tags?.map(tag => (
                                        <Tag key={tag}>{tag}</Tag>
                                    ))}
                                </div>
                            </div>

                            <div className="blindbox-actions"> {/* 商城同款操作区域 */}
                                <div className="price">¥{box.price.toFixed(2)}</div>
                                <Space>
                                    <Button
                                        type="link"
                                        onClick={() => handleEditBox(box)}
                                        icon={<EditOutlined />}
                                    >
                                        编辑
                                    </Button>
                                    <Button
                                        type="link"
                                        danger
                                        onClick={() => handleDeleteBox(box.id)}
                                        icon={<DeleteOutlined />}
                                    >
                                        删除
                                    </Button>
                                </Space>
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>
        );
    };

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>, boxId: number) => {
        const target = e.target as HTMLImageElement;
        const originalUrl = target.src;

        console.error('[图片加载失败]', {
            url: originalUrl,
            boxId,
            imageUrlType: typeof myBlindBoxes.find(b => b.id === boxId)?.imageUrl,
            imageUrlValue: myBlindBoxes.find(b => b.id === boxId)?.imageUrl
        });

        // 防止无限循环
        if (!originalUrl.includes('/default-placeholder.png')) {
            target.src = '/default-placeholder.png';
            target.alt = '图片加载失败';
        }

        setImageLoading(prev => ({ ...prev, [boxId]: false }));
    };

    const renderItemsForm = () => {
        const totalProbability = useMemo(() => {
            return items.reduce((sum: number, item) => sum + (item.probability || 0), 0).toFixed(2);
        }, [items]);

        const isOverLimit = Math.abs(Number(totalProbability) - 100) > 0.01;

        return (
            <div>
                <Button
                    type="dashed"
                    onClick={handleAddItem}
                    style={{ marginBottom: 16 }}
                    icon={<PlusOutlined />}
                >
                    添加物品
                </Button>

                {items.map((item, index) => (
                    <ItemForm
                        key={item.id || index}
                        item={item}
                        index={index}
                        onUpdate={(partial) => {
                            setItems(prev => prev.map((i, idx) =>
                                idx === index ? { ...i, ...partial } : i
                            ));
                        }}
                        onRemove={() => handleRemoveItem(index)}
                        onImageUpload={(url) => {
                            setItems(prev => prev.map((i, idx) =>
                                idx === index ? { ...i, imageUrl: url } : i
                            ));
                        }}
                        isDeleting={deletingIndex === index}
                    />
                ))}

                <div
                    style={{
                        textAlign: 'right',
                        color: isOverLimit ? 'red' : '#8c8c8c',
                        marginTop: 8,
                        fontWeight: isOverLimit ? 'bold' : 'normal'
                    }}
                >
                    概率总和: {totalProbability}%
                    {isOverLimit && (
                        <span style={{ marginLeft: 8 }}>
                            （需调整为 100%）
                        </span>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="home-container">
            <div className="user-info">
                {user && (
                    <div className="user-profile">
                        <Text strong>欢迎, {user.username}!</Text>
                    </div>
                )}
            </div>

            <div className="tab-bar">
                {user && (
                    <Button
                        type="primary"
                        onClick={handleCreateBox}
                        icon={<PlusOutlined />}
                    >
                        创建盲盒
                    </Button>
                )}
            </div>

            <Title level={2} className="section-title">
                我的盲盒
            </Title>
            {renderMyBlindBoxes()}

            <Modal
                title="创建盲盒"
                open={isCreateBoxModalVisible}
                onCancel={() => setIsCreateBoxModalVisible(false)}
                onOk={() => form.submit()}
                width={800}
                destroyOnClose
            >
                <Form
                    form={form}
                    name="createBlindBox"
                    onFinish={onFinishCreateBox}
                    layout="vertical"
                    initialValues={{ stock: 10 }}
                >
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="name"
                                rules={[{ required: true, message: '请输入盲盒名称' }]}
                                label="盲盒名称"
                            >
                                <Input placeholder="例如：创意文具盲盒" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="category"
                                rules={[{ required: true, message: '请选择分类' }]}
                                label="盲盒分类"
                            >
                                <Select placeholder="选择分类">
                                    {categories.map(cat => (
                                        <Option key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name="tags"
                        label="标签（可选）"
                        help="用逗号分隔，例如：热门,限量款"
                    >
                        <Input placeholder="输入标签，多个用逗号分隔" />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        rules={[{ required: true, message: '请输入盲盒描述' }]}
                        label="盲盒描述"
                    >
                        <Input.TextArea rows={4} placeholder="描述盲盒内容或特点" />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="price"
                                rules={[{ required: true, message: '请输入价格' }]}
                                label="盲盒价格"
                            >
                                <InputNumber
                                    min={0.01}
                                    placeholder="0.00"
                                    addonAfter="元"
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="stock"
                                rules={[{ required: true, message: '请输入库存', type: 'number', min: 1 }]}
                                label="库存数量"
                            >
                                <InputNumber
                                    min={1}
                                    placeholder="至少1个"
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name="imageUrl"
                        rules={[{ required: true, message: '请上传盲盒图片' }]}
                        label="盲盒主图"
                    >
                        <EnhancedImageUpload
                            value={form.getFieldValue('imageUrl') || ''}
                            onChange={(url) => form.setFieldsValue({ imageUrl: url })}
                            maxSize={2}
                        />
                    </Form.Item>

                    <Form.Item label="盲盒物品">
                        {renderItemsForm()}
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title="编辑盲盒"
                open={isEditBoxModalVisible}
                onCancel={() => setIsEditBoxModalVisible(false)}
                onOk={() => form.submit()}
                width={800}
                destroyOnClose
            >
                <Form
                    form={form}
                    name="editBlindBox"
                    onFinish={onFinishEditBox}
                    layout="vertical"
                >
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="name"
                                rules={[{ required: true, message: '请输入盲盒名称' }]}
                                label="盲盒名称"
                            >
                                <Input placeholder="例如：创意文具盲盒" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="category"
                                rules={[{ required: true, message: '请选择分类' }]}
                                label="盲盒分类"
                            >
                                <Select placeholder="选择分类">
                                    {categories.map(cat => (
                                        <Option key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name="tags"
                        label="标签（可选）"
                        help="用逗号分隔，例如：热门,限量款"
                    >
                        <Input placeholder="输入标签，多个用逗号分隔" />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        rules={[{ required: true, message: '请输入盲盒描述' }]}
                        label="盲盒描述"
                    >
                        <Input.TextArea rows={4} placeholder="描述盲盒内容或特点" />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="price"
                                rules={[{ required: true, message: '请输入价格' }]}
                                label="盲盒价格"
                            >
                                <InputNumber
                                    min={0.01}
                                    placeholder="0.00"
                                    addonAfter="元"
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="stock"
                                rules={[{ required: true, message: '请输入库存', type: 'number', min: 1 }]}
                                label="库存数量"
                            >
                                <InputNumber
                                    min={1}
                                    placeholder="至少1个"
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name="imageUrl"
                        rules={[{ required: true, message: '请上传盲盒图片' }]}
                        label="盲盒主图"
                    >
                        <EnhancedImageUpload
                            value={form.getFieldValue('imageUrl') || ''}
                            onChange={(url) => form.setFieldsValue({ imageUrl: url })}
                            maxSize={2}
                        />
                    </Form.Item>

                    <Form.Item label="盲盒物品">
                        {renderItemsForm()}
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default HomePage;