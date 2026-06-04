import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { ensureAnonAuth, subscribeAuth } from '../firebase/anonAuth';

interface AuthState {
  uid: string | null;
  ready: boolean;
}

const AuthContext = createContext<AuthState>({ uid: null, ready: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ uid: null, ready: false });

  useEffect(() => {
    // 먼저 구독하여, 로그인 완료(uid 확보) 시점에만 ready=true 로 전환한다.
    const unsub = subscribeAuth((uid) => {
      setState({ uid, ready: true });
    });
    // 로그인이 실패해도 앱이 영원히 "준비 중"에 멈추지 않도록 ready 처리(uid 없음).
    ensureAnonAuth().catch(() => {
      setState((s) => (s.ready ? s : { uid: null, ready: true }));
    });
    return unsub;
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  return useContext(AuthContext);
}
