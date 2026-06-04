import { useEffect, useState } from 'react';
import { subscribeRooms } from '../data/rooms';
import type { Room } from '../types/models';

interface RoomsState {
  rooms: Room[];
  loading: boolean;
  error: Error | null;
}

/** 활성 회의실 목록 실시간 구독 */
export function useRooms(): RoomsState {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeRooms(
      (rows) => {
        setRooms(rows);
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

  return { rooms, loading, error };
}
