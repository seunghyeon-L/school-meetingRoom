import { useEffect, useState } from 'react';
import { subscribeMemos } from '../data/memos';
import type { Memo } from '../types/models';

interface MemosState {
  /** 최신순(전송 중인 메모가 맨 위) */
  memos: Memo[];
  loading: boolean;
  error: Error | null;
}

/** 공유 메모를 실시간 구독하고 최신순으로 정렬해 돌려준다. */
export function useMemos(): MemosState {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsub = subscribeMemos(
      (rows) => {
        // created(생성 시각) 내림차순 = 최신순. ISO 문자열이라 사전순 = 시간순.
        rows.sort((a, b) => (b.created ?? '').localeCompare(a.created ?? ''));
        setMemos(rows);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  return { memos, loading, error };
}
