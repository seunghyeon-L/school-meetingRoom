import type { Reservation } from '../types/models';

/**
 * 반열림 구간 겹침 판정: [aStart, aEnd) 와 [bStart, bEnd) 가 겹치는가
 */
export function slotsOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * 주어진 예약 목록(같은 room/date 로 가정) 중에서 [startSlot, endSlot) 와
 * 겹치는 예약을 반환. excludeId 는 제외(수정 시 자기 자신).
 */
export function findConflicts(
  reservations: Reservation[],
  startSlot: number,
  endSlot: number,
  excludeId?: string,
): Reservation[] {
  return reservations.filter((r) => {
    if (excludeId && r.id === excludeId) return false;
    return slotsOverlap(r.startSlot, r.endSlot, startSlot, endSlot);
  });
}
