// EnhancedImageUpload.tsx
import React, { useState, useEffect } from 'react';
import { Upload, message, Progress, Spin } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import axios from 'axios';

interface UploadResult {
    success: boolean;
    data: {
        fileUrl?: string;
        url?: string;
        filename?: string;
    };
    message: string;
}

interface Props {
    value?: string;
    onChange: (fileUrl: string) => void;
    maxSize?: number; // MB
}

const EnhancedImageUpload: React.FC<Props> = ({
                                                  value = '',
                                                  onChange,
                                                  maxSize = 2,
                                              }) => {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [uploadError, setUploadError] = useState('');
    const [isImageLoading, setIsImageLoading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');

    useEffect(() => {
        // 修复预览路径处理逻辑，避免重复拼接/upload/
        if (value) {
            if (value.startsWith('/upload/') || value.startsWith('http')) {
                setPreviewUrl(value);
            } else {
                setPreviewUrl(`http://localhost:7001/upload/${value}`);
            }
        } else {
            setPreviewUrl('');
        }
    }, [value]);

    // 验证文件类型和大小
    const beforeUpload = (file: File) => {
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
            message.error('请上传图片文件！');
            return false;
        }

        const isLt2M = file.size / 1024 / 1024 < maxSize;
        if (!isLt2M) {
            message.error(`图片大小不能超过${maxSize}MB！`);
            return false;
        }

        return true;
    };

    const handleChange = ({ file }: any) => {
        if (file.status === 'uploading') {
            setUploading(true);
            setIsImageLoading(true);
            setUploadError('');

            // 处理上传进度
            if (file.percent !== undefined) {
                setProgress(Math.round(file.percent));
            }
            return;
        }

        if (file.status === 'done') {
            setUploading(false);
            setProgress(0);
            setIsImageLoading(false);

            const response = file.response as UploadResult;
            if (response && response.success) {
                let fileUrl = '';

                // 严格提取字符串URL（优先级：完整URL > 路径）
                if (typeof response.data === 'string') {
                    fileUrl = response.data;
                } else if (response.data?.fileUrl) {
                    fileUrl = response.data.fileUrl;
                } else if (response.data?.url) {
                    fileUrl = response.data.url;
                } else if (response.data?.filename) {
                    // 若后端返回的是文件名（如"xxx.png"），拼接为完整URL
                    fileUrl = `http://localhost:7001/upload/${response.data.filename}`;
                }

                // 最终校验：确保是字符串且非空
                if (typeof fileUrl === 'string' && fileUrl.trim()) {
                    onChange(fileUrl); // 只传递有效字符串
                    setPreviewUrl(fileUrl);
                    message.success('图片上传成功');
                } else {
                    const errorMsg = '上传失败：未返回有效的图片地址';
                    setUploadError(errorMsg);
                    message.error(errorMsg);
                }
            } else {
                const errorMsg = response?.message || '上传失败，请重试';
                setUploadError(errorMsg);
                message.error(errorMsg);
            }
        } else if (file.status === 'error') {
            setUploading(false);
            setProgress(0);
            setIsImageLoading(false);
            const errorMsg = file.error?.message || '上传失败，请重试';
            setUploadError(errorMsg);
            message.error(errorMsg);
        }
    };

    // 手动上传方法 - 修复上传路径为 /api/upload/image
    const customRequest = ({
                               file,
                               onProgress,
                               onSuccess,
                               onError,
                           }: any) => {
        const formData = new FormData();
        formData.append('image', file); // 字段名与后端保持一致

        // 修改上传路径为后端实际接口 /api/upload/image
        axios
            .post('http://localhost:7001/api/upload/image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    // 处理上传进度
                    if (progressEvent.total) {
                        const percent = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                        );
                        onProgress({ percent });
                        setProgress(percent);
                    } else {
                        console.warn('无法计算上传进度：total 为 undefined');
                    }
                },
            })
            .then((response) => {
                onSuccess(response.data);
            })
            .catch((error) => {
                onError(error);
            });
    };

    // 删除图片
    const handleRemove = () => {
        onChange('');
        setPreviewUrl('');
        message.success('图片已移除');
    };

    return (
        <div className="enhanced-image-upload">
            {previewUrl ? (
                <div className="preview-container">
                    {isImageLoading ? (
                        <div className="image-loading">
                            <Spin size="large" />
                        </div>
                    ) : (
                        <img
                            src={previewUrl}
                            alt="预览图"
                            className="preview-image"
                            onLoad={() => setIsImageLoading(false)}
                            onError={() => {
                                setIsImageLoading(false);
                                message.error('图片加载失败');
                            }}
                        />
                    )}
                    <div className="preview-overlay">
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="ant-btn ant-btn-primary ant-btn-dangerous ant-btn-sm"
                        >
                            删除
                        </button>
                    </div>
                </div>
            ) : (
                <div className="upload-hint">
                    <span>点击上传图片</span>
                </div>
            )}

            <Upload
                name="image" // 字段名与后端保持一致
                listType="picture-card"
                className="image-uploader"
                showUploadList={false}
                beforeUpload={beforeUpload}
                customRequest={customRequest}
                onChange={handleChange}
                accept="image/*"
            >
                {uploading ? (
                    <div className="upload-progress">
                        <Progress percent={progress} size="small" />
                        <span className="progress-text">上传中 {progress}%</span>
                    </div>
                ) : (
                    <div>
                        <UploadOutlined />
                        <div className="ant-upload-text">上传图片</div>
                    </div>
                )}
            </Upload>

            {uploadError && (
                <div className="upload-error">{uploadError}</div>
            )}
        </div>
    );
};

export default EnhancedImageUpload;