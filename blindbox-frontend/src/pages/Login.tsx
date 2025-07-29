import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Card, Divider, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { login } from '../api';
import './Auth.css';

const LoginPage = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [form] = Form.useForm();

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            // 修正：表单字段名改为 username，与 Form.Item 一致
            const response = await login({
                identifier: values.username, // 使用 username 字段
                password: values.password
            });

            // 修正：通过 response.data 获取 ApiResponse 数据
            const loginResponse = response.data;
            if (!loginResponse.success) {
                throw new Error(loginResponse.message || '登录失败');
            }

            const loginData = loginResponse.data;
            if (!loginData || !loginData.token || !loginData.user) {
                throw new Error('登录响应缺少 token 或 user 信息');
            }

            localStorage.setItem('token', loginData.token);
            localStorage.setItem('user', JSON.stringify(loginData.user));

            message.success('登录成功！正在跳转到主页...');
            navigate('/');

        } catch (error: any) {
            // 增强错误处理
            const errorMessage = error.response?.data?.message ||
                error.message ||
                '登录失败，请检查网络连接';
            message.error(errorMessage);
            console.error('登录错误详情:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <Card className="auth-card">
                <div className="auth-header">
                    <h1>欧耶，我见过盲盒</h1>
                    <h2>欢迎回来</h2>
                </div>

                <Form form={form} name="auth-form" onFinish={onFinish} size="large">
                    <Form.Item
                        name="username" // 修正：字段名改为 username
                        rules={[
                            { required: true, message: '请输入用户名或邮箱!' },
                            { min: 3, message: '至少需要3个字符!' }
                        ]}
                    >
                        <Input prefix={<UserOutlined />} placeholder="用户名或邮箱" />
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
                            登录
                        </Button>
                    </Form.Item>
                </Form>

                <Divider />

                <div className="auth-footer">
                    <Link to="/register">没有账号？立即注册</Link>
                </div>
            </Card>
        </div>
    );
};

export default LoginPage;