import { useEffect, useState } from 'react';
import { subscribeReservationsByRange } from '../data/reservations';
import type { Reservation } from '../types/models';

interface RangeReservationsState {
  /** 날짜('YYYY-MM-DD') -> 그 날의 예약(시간순). 방 순서 정렬은 달력 컴포넌트가 처리. */
  byDate: Record<string, Reservation[]>;
  loading: boolean;
  error: Error | null;
}

/** [start, end] 범위의 예약을 날짜별로 묶어 실시간 구독 (월/2주 보기 공용) */
export function useReservationsRange(
  start: string,
  end: string,
): RangeReservationsState {
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
          (grouped[r.date] ??= []).push(r);
        }
        // 기본은 시간순. 같은 칸 안에서 방 순서 정렬은 rooms 를 가진 달력 컴포넌트가 한다.
        for (const key of Object.keys(grouped)) {
          grouped[key].sort((a, b) => a.startSlot - b.startSlot);
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
