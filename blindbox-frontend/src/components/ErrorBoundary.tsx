import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(_: Error): State {
        // 更新 state 使下一次渲染能够显示降级 UI
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // 将错误日志上报给错误监控服务
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            // 当发生错误时渲染降级 UI
            return (
                <div>
                    <h1>出错啦!</h1>
                    <p>应用程序遇到了一些问题,请稍后再试。</p>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
