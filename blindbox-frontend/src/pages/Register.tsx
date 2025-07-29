import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Card, Divider, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
// 关键修复：从默认导入改为命名导入
import { register } from '../api';
import './Auth.css';

const RegisterPage = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [form] = Form.useForm();

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            // 直接调用命名导入的 register 函数
            await register({
                username: values.username,
                email: values.email,
                password: values.password
            });

            message.success('注册成功！请登录您的账号');
            navigate('/login');
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || '注册失败，请重试';
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <Card className="auth-card">
                <div className="auth-header">
                    <h1>欧耶，盲盲的盒</h1>
                    <h2>创建新账户</h2>
                </div>

                <Form form={form} name="auth-form" onFinish={onFinish} size="large">
                    <Form.Item
                        name="username"
                        rules={[
                            { required: true, message: '请输入用户名!' },
                            { min: 3, message: '用户名至少3个字符' },
                            { max: 20, message: '用户名不能超过20个字符' }
                        ]}
                    >
                        <Input prefix={<UserOutlined />} placeholder="用户名" />
                    </Form.Item>

                    <Form.Item
                        name="email"
                        rules={[
                            { required: true, message: '请输入邮箱!' },
                            { type: 'email', message: '请输入有效的邮箱地址' }
                        ]}
                    >
                        <Input prefix={<MailOutlined />} placeholder="邮箱" />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[
                            { required: true, message: '请输入密码!' },
                            { min: 6, message: '密码长度至少6位' }
                        ]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="密码" />
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            block
                        >
                            注册
                        </Button>
                    </Form.Item>
                </Form>

                <Divider />

                <div className="auth-footer">
                    <Link to="/login">已有账号？立即登录</Link>
                </div>
            </Card>
        </div>
    );
};

export default RegisterPage;