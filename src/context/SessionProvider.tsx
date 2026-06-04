import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { User } from '../types/models';
import { SESSION_USER_KEY } from '../lib/constants';
import { useUsers } from '../hooks/useUsers';

export interface SessionContextValue {
  /** 선택된 사용자 id (없으면 null) */
  userId: string | null;
  /** 선택된 사용자 객체 (명단에서 검증된 경우만) */
  user: User | null;
  /** 명단 로딩 여부 */
  usersLoading: boolean;
  /** 명단 로딩 에러 */
  usersError: Error | null;
  /** 전체 활성 사용자 명단 */
  users: User[];
  /** 신분 선택 */
  selectIdentity: (userId: string) => void;
  /** 신분 해제(이름 바꾸기) */
  clearIdentity: () => void;
}

export const SessionContext = createContext<SessionContextValue | null>(null);

function readStored(): string | null {
  try {
    return localStorage.getItem(SESSION_USER_KEY);
  } catch {
    return null;
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const { users, loading: usersLoading, error: usersError } = useUsers();
  const [userId, setUserId] = useState<string | null>(() => readStored());

  // 저장된 id 를 명단과 대조해 유효성 검증, 없으면 비움.
  useEffect(() => {
    if (usersLoading || !userId) return;
    const exists = users.some((u) => u.id === userId);
    if (!exists && users.length > 0) {
      setUserId(null);
      try {
        localStorage.removeItem(SESSION_USER_KEY);
      } catch {
        /* ignore */
      }
    }
  }, [users, usersLoading, userId]);

  const selectIdentity = useCallback((id: string) => {
    setUserId(id);
    try {
      localStorage.setItem(SESSION_USER_KEY, id);
    } catch {
      /* ignore */
    }
  }, []);

  const clearIdentity = useCallback(() => {
    setUserId(null);
    try {
      localStorage.removeItem(SESSION_USER_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const user = useMemo<User | null>(
    () => users.find((u) => u.id === userId) ?? null,
    [users, userId],
  );

  const value = useMemo<SessionContextValue>(
    () => ({
      userId,
      user,
      usersLoading,
      usersError,
      users,
      selectIdentity,
      clearIdentity,
    }),
    [userId, user, usersLoading, usersError, users, selectIdentity, clearIdentity],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}
