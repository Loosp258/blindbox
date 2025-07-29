// src/utils/imageCompress.ts
/**
 * 前端图片压缩工具
 * 使用Canvas API实现图片压缩，支持指定最大宽度和质量
 */
export const compressImage = (
    file: File,
    maxWidth: number = 1000,
    quality: number = 0.7
): Promise<File> => {
    return new Promise((resolve, reject) => {
        // 检查文件是否存在
        if (!file) {
            console.error('compressImage: 文件对象为空');
            resolve(file as File); // 返回原始值（即使为空）
            return;
        }

        // 只处理图片文件
        if (!file.type || !file.type.startsWith('image/')) {
            console.log('compressImage: 文件不是图片类型，跳过压缩', file);
            resolve(file);
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = (e) => {
            const img = new Image();
            if (!e.target?.result) {
                console.error('compressImage: FileReader返回结果为空');
                resolve(file);
                return;
            }
            img.src = e.target.result as string;

            img.onload = () => {
                // 如果图片本身宽度小于最大宽度，不进行压缩
                if (img.width <= maxWidth) {
                    console.log(`compressImage: 图片宽度(${img.width})小于最大宽度(${maxWidth})，跳过压缩`);
                    resolve(file);
                    return;
                }

                // 计算压缩后的尺寸（保持宽高比）
                const ratio = maxWidth / img.width;
                const canvas = document.createElement('canvas');
                canvas.width = maxWidth;
                canvas.height = img.height * ratio;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    console.error('compressImage: 无法获取Canvas上下文');
                    resolve(file);
                    return;
                }

                // 绘制图片到Canvas
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                // 将Canvas内容转换为Blob
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            // 创建新的File对象
                            const compressedFile = new File(
                                [blob],
                                file.name,
                                { type: file.type, lastModified: Date.now() }
                            );
                            console.log(`图片已压缩: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
                            resolve(compressedFile);
                        } else {
                            console.error('compressImage: Canvas转换为Blob失败');
                            resolve(file);
                        }
                    },
                    file.type,
                    quality
                );
            };

            img.onerror = (error) => {
                console.error('compressImage: 图片加载失败', error);
                reject(new Error('图片加载失败'));
            };
        };

        reader.onerror = (error) => {
            console.error('compressImage: 读取文件失败', error);
            reject(new Error('读取文件失败'));
        };
    });
};