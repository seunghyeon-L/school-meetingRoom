import { useEffect, useMemo, useState } from 'react';
import { subscribeReservationsByRange } from '../data/reservations';
import { monthGridRange } from '../lib/dateKey';
import type { Reservation } from '../types/models';

interface MonthReservationsState {
  /** 날짜('YYYY-MM-DD') -> 그 날의 예약(방 호수 오름차순, 같은 방은 시작시간 순) */
  byDate: Record<string, Reservation[]>;
  loading: boolean;
  error: Error | null;
}

/** 'room-419' -> 419 (방 호수 숫자 오름차순 정렬용) */
function roomNum(roomId: string): number {
  const m = roomId.match(/\d+/);
  return m ? Number(m[0]) : Number.MAX_SAFE_INTEGER;
}

/** monthAnchor 가 속한 달의 그리드 범위 예약을 날짜별로 그룹화해 실시간 구독 */
export function useReservationsByMonth(
  monthAnchor: string,
): MonthReservationsState {
  const { start, end } = useMemo(
    () => monthGridRange(monthAnchor),
    [monthAnchor],
  );
  const [byDate, setByDate] = useState<Record<string, Reservation[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const unsub = subscribeReservationsByRange(
      start,
      end,
      (rows) => {
        const grouped: Record<string, Reservation[]> = {};
        for (const r of rows) {
          if (!grouped[r.date]) grouped[r.date] = [];
          grouped[r.date].push(r);
        }
        for (const key of Object.keys(grouped)) {
          // 1순위: 방 호수 오름차순, 2순위: 같은 방 안에서 시작시간 오름차순
          grouped[key].sort(
            (a, b) =>
              roomNum(a.roomId) - roomNum(b.roomId) ||
              a.roomId.localeCompare(b.roomId) ||
              a.startSlot - b.startSlot,
          );
        }
        setByDate(grouped);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );
    return unsub;
  }, [start, end]);

  return { byDate, loading, error };
}
