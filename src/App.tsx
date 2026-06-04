import { type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthProvider';
import { SessionProvider } from './context/SessionProvider';
import { useSession } from './hooks/useSession';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { Spinner } from './components/ui/Spinner';
import { NamePickerModal } from './components/booking/NamePickerModal';
import HomeScreen from './screens/HomeScreen';

/** 인증(익명 로그인) 준비가 끝날 때까지 대기 */
function AuthGate({ children }: { children: ReactNode }) {
  const { ready } = useAuth();
  if (!ready) {
    return (
      <main className="screen">
        <Spinner label="로그인 준비 중..." />
      </main>
    );
  }
  return <>{children}</>;
}

/**
 * 신분(조교) 선택 게이트.
 * v1 은 조교 전용 관리 도구이므로, 이름을 선택해야 앱을 사용할 수 있다.
 */
function RequireIdentity({ children }: { children: ReactNode }) {
  const { userId, usersLoading } = useSession();

  if (usersLoading) {
    return (
      <main className="screen">
        <Spinner label="확인 중..." />
      </main>
    );
  }

  if (!userId) {
    // 루트 게이트: 모달을 닫아도 다시 열려 있도록 유지 (이름 선택 필수)
    return (
      <main className="screen">
        <NamePickerModal
          open
          onClose={() => {}}
          onSelect={() => {}}
          title="조교 이름을 선택해 주세요"
        />
      </main>
    );
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <SessionProvider>
            <div className="app-shell">
              <AuthGate>
                <RequireIdentity>
                  <Routes>
                    <Route path="/" element={<HomeScreen />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </RequireIdentity>
              </AuthGate>
            </div>
          </SessionProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
