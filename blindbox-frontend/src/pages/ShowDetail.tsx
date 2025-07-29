import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Card, Button, Avatar, List, Input,
    Skeleton, Typography, Divider, Image, message
} from 'antd';
import { ArrowLeftOutlined, UserOutlined } from '@ant-design/icons';
import {
    getShowDetail,
    createComment,
    getComments,
    Show,
    Comment,
    ApiResponse,
    CommentListResponse
} from '../api/index';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const ShowDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [show, setShow] = useState<Show | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [commentContent, setCommentContent] = useState('');
    const [commentLoading, setCommentLoading] = useState(false);

    useEffect(() => {
        if (id) {
            fetchShowDetail();
            fetchComments();
        }
    }, [id]);

    const fetchShowDetail = async () => {
        try {
            setLoading(true);
            const response = await getShowDetail(Number(id));
            const res: ApiResponse<Show> = response.data;

            if (res.success && res.data) {
                setShow(res.data);
            } else {
                message.error(res.message || '获取帖子详情失败');
                setShow(null);
            }
        } catch (error: any) {
            console.error('获取帖子详情失败', error);
            message.error(error.message || '网络错误');
            setShow(null);
        } finally {
            setLoading(false);
        }
    };

    const fetchComments = async () => {
        if (!id) return;
        try {
            const response = await getComments(Number(id), { page: 1, pageSize: 100 });
            const res: ApiResponse<CommentListResponse> = response.data;

            if (res.success) {
                setComments(res.data.items);
            } else {
                message.error(res.message || '获取评论失败');
            }
        } catch (error: any) {
            console.error('获取评论失败', error);
            message.error(error.message || '网络错误');
        }
    };

    const handleCommentSubmit = async () => {
        if (!commentContent.trim() || !id) return;
        try {
            setCommentLoading(true);
            const response = await createComment(Number(id), commentContent);
            const res: ApiResponse<Comment> = response.data;

            if (res.success) {
                message.success('评论发布成功');
                setCommentContent('');
                fetchComments();
            } else {
                message.error(res.message || '发布评论失败');
            }
        } catch (error: any) {
            console.error('发布评论失败', error);
            message.error(error.message || '网络错误');
        } finally {
            setCommentLoading(false);
        }
    };

    const getRarityColor = (rarity: string) => {
        const colors: Record<string, string> = {
            '普通': '#8c8c8c',
            '稀有': '#1677ff',
            '史诗': '#722ed1',
            '传说': '#fa8c16',
            '神话': '#f5222d'
        };
        return colors[rarity] || '#333';
    };

    if (loading) {
        return <Skeleton active paragraph={{ rows: 10 }} />;
    }

    if (!show) {
        return (
            <div className="show-not-found">
                <Title level={3}>帖子不存在或已被删除</Title>
                <Button onClick={() => navigate('/shows')}>返回列表</Button>
            </div>
        );
    }

    return (
        <div className="show-detail-container">
            <Button
                onClick={() => navigate('/shows')}
                className="back-button"
            >
                <ArrowLeftOutlined /> 返回列表
            </Button>

            <Card className="show-detail-card">
                <div className="show-meta">
                    <Avatar icon={<UserOutlined />} />
                    <div className="show-meta-info">
                        <Text strong>{show.user.username}</Text>
                        <Text type="secondary">
                            {new Date(show.createdAt).toLocaleString()}
                        </Text>
                    </div>
                </div>

                <Title level={2} className="show-detail-title">
                    {show.title}
                </Title>

                {show.imageUrl && (
                    <div className="show-detail-image">
                        <Image src={show.imageUrl} alt={show.title} />
                    </div>
                )}

                <Paragraph className="show-detail-content">
                    {show.content}
                </Paragraph>

                <Divider>展示的物品</Divider>
                <Card className="show-item-card">
                    <div className="item-info">
                        {show.item.imageUrl && (
                            <div className="item-image">
                                <img src={show.item.imageUrl} alt={show.item.name} />
                            </div>
                        )}
                        <div className="item-details">
                            <Title level={4} style={{ margin: 0 }}>
                                {show.item.name}
                            </Title>
                            <Text>
                                稀有度：<span style={{ color: getRarityColor(show.item.rarity) }}>
                                    {show.item.rarity}
                                </span>
                            </Text>
                            <Paragraph>{show.item.description}</Paragraph>
                        </div>
                    </div>
                </Card>
            </Card>

            <Divider>评论 ({comments.length})</Divider>
            <div className="comment-section">
                <div className="comment-input-container">
                    <TextArea
                        placeholder="写下你的评论..."
                        value={commentContent}
                        onChange={(e) => setCommentContent(e.target.value)}
                        rows={3}
                    />
                    <Button
                        type="primary"
                        onClick={handleCommentSubmit}
                        loading={commentLoading}
                        disabled={!commentContent.trim()}
                    >
                        发布评论
                    </Button>
                </div>

                <List
                    dataSource={comments}
                    itemLayout="horizontal"
                    renderItem={(comment) => (
                        <List.Item key={comment.id}>
                            <List.Item.Meta
                                avatar={<Avatar icon={<UserOutlined />} />}
                                title={
                                    <div className="comment-meta">
                                        <Text strong>{comment.user.username}</Text>
                                        <Text type="secondary" className="comment-time">
                                            {new Date(comment.createdAt).toLocaleString()}
                                        </Text>
                                    </div>
                                }
                                description={comment.content}
                            />
                        </List.Item>
                    )}
                />
            </div>
        </div>
    );
};

export default ShowDetail;