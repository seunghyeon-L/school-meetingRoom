import { createContext, useContext, type ReactNode } from 'react';

interface AuthState {
  ready: boolean;
}

const AuthContext = createContext<AuthState>({ ready: true });

/**
 * PocketBase 로 옮기면서 별도의 익명 로그인이 필요 없어졌다.
 * 신원(누가 쓰는지)은 SessionProvider(이름 선택)가 담당하므로,
 * 여기서는 앱 게이트 호환을 위해 형태만 유지하고 항상 ready=true 로 둔다.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider value={{ ready: true }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  return useContext(AuthContext);
}
