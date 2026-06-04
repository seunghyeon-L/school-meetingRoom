import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('앱 오류:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="screen center-col" style={{ textAlign: 'center' }}>
          <h1 className="screen-title">잠시 문제가 발생했어요</h1>
          <p className="muted">
            앱을 불러오는 중 오류가 생겼습니다.
            <br />
            아래 버튼을 눌러 다시 시도해 주세요.
          </p>
          <button className="big-btn" onClick={this.handleReload}>
            다시 시도
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
