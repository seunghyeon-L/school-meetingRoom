import { useContext } from 'react';
import {
  SessionContext,
  type SessionContextValue,
} from '../context/SessionProvider';

/** 현재 선택된 신분(세션) 정보 */
export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession 은 SessionProvider 안에서만 사용할 수 있습니다.');
  }
  return ctx;
}
