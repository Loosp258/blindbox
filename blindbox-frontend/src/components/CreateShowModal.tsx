import React, { useState, useEffect } from 'react';
import {
    Modal,
    Form,
    Input,
    Button,
    Select,
    message,
    Skeleton
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import {
    createShow,
    getUserInventory,
    InventoryItem,
    ApiResponse
} from '../api/index';

const { Option } = Select;
const { TextArea } = Input;

interface CreateShowModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const CreateShowModal: React.FC<CreateShowModalProps> = ({
                                                             visible,
                                                             onClose,
                                                             onSuccess
                                                         }) => {
    const [form] = Form.useForm();
    // 库存物品状态
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible) {
            fetchInventory();
        } else {
            form.resetFields();
        }
    }, [visible, form]);

    // 获取用户可展示的库存物品
    const fetchInventory = async () => {
        try {
            const response = await getUserInventory();
            const res: ApiResponse<InventoryItem[]> = response.data;

            if (res.success) {
                setItems(res.data);
            } else {
                message.error(res.message || '获取库存物品失败');
            }
        } catch (error: any) {
            console.error('获取库存物品失败:', error);
            message.error(error.message || '获取可展示物品失败');
        }
    };

    // 发布帖子逻辑
    const handleSubmit = async () => {
        try {
            setLoading(true);
            const values = await form.validateFields();
            const response = await createShow(values);
            const res: ApiResponse<any> = response.data;

            if (res.success) {
                message.success('帖子发布成功');
                onClose();
                onSuccess();
            } else {
                message.error(res.message || '发布失败，请重试');
            }
        } catch (error: any) {
            console.error('发布帖子失败:', error);
            message.error(error.message || '发布失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="发布玩家秀"
            visible={visible}
            onCancel={onClose}
            onOk={handleSubmit}
            confirmLoading={loading}
            width={700}
            destroyOnClose
        >
            <Form
                form={form}
                layout="vertical"
            >
                {/* 标题 */}
                <Form.Item
                    name="title"
                    label="帖子标题"
                    rules={[
                        { required: true, message: '请输入标题' },
                        { max: 100, message: '标题不能超过 100 字' }
                    ]}
                >
                    <Input
                        placeholder="分享你的抽盒心情..."
                        autoComplete="off"
                    />
                </Form.Item>

                {/* 选择库存物品 */}
                <Form.Item
                    name="inventoryItemId"
                    label="选择展示的物品"
                    rules={[{ required: true, message: '请选择要展示的物品' }]}
                >
                    {items.length > 0 ? (
                        <Select placeholder="从你的库存中选择物品">
                            {items.map((item) => (
                                <Option key={item.id} value={item.id}>
                                    {item.item.name}（{item.item.rarity}）
                                </Option>
                            ))}
                        </Select>
                    ) : (
                        <Skeleton.Input active size="large" style={{ width: '100%' }} />
                    )}
                </Form.Item>

                {/* 帖子内容 */}
                <Form.Item
                    name="content"
                    label="帖子内容"
                    rules={[
                        { required: true, message: '请输入内容' },
                        { max: 2000, message: '内容不能超过 2000 字' }
                    ]}
                >
                    <TextArea
                        rows={6}
                        placeholder="分享你抽到这个物品的感受吧..."
                        autoComplete="off"
                    />
                </Form.Item>

            </Form>
        </Modal>
    );
};

export default CreateShowModal;