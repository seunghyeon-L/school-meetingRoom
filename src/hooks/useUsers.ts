import { useEffect, useState } from 'react';
import { subscribeUsers } from '../data/users';
import type { User } from '../types/models';

interface UsersState {
  users: User[];
  loading: boolean;
  error: Error | null;
}

/** 활성 사용자 명단 실시간 구독 */
export function useUsers(): UsersState {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeUsers(
      (rows) => {
        setUsers(rows);
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

  return { users, loading, error };
}
