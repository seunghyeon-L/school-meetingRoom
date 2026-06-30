import { pb } from '../pb/client';
import type { Reservation, ReservationInput } from '../types/models';
import { findConflicts } from '../lib/overlap';

/** 날짜 범위 [startDate, endDate] 의 예약을 실시간 구독 (월 달력용) */
export function subscribeReservationsByRange(
  startDate: string,
  endDate: string,
  onData: (rows: Reservation[]) => void,
  onError: (err: Error) => void,
): () => void {
  const load = () => {
    pb.collection('reservations')
      .getFullList<Reservation>({
        filter: pb.filter('date >= {:start} && date <= {:end}', {
          start: startDate,
          end: endDate,
        }),
        requestKey: null,
      })
      .then(onData)
      .catch((err) => {
        if (err?.isAbort) return; // 중복 요청 자동취소는 무시
        onError(err);
      });
  };

  load();

  const unsub = pb.collection('reservations').subscribe('*', () => load());

  return () => {
    unsub.then((fn) => fn()).catch(() => {});
  };
}

/** 단일 예약 조회 */
export async function getReservation(id: string): Promise<Reservation | null> {
  try {
    return await pb.collection('reservations').getOne<Reservation>(id);
  } catch {
    return null; // 없으면(404) null
  }
}

/** 겹치는 예약 조회 (room/date 로 조회 후 JS 에서 반열림 겹침 판정) */
export async function checkConflict(
  roomId: string,
  date: string,
  startSlot: number,
  endSlot: number,
  excludeId?: string,
): Promise<Reservation[]> {
  const rows = await pb.collection('reservations').getFullList<Reservation>({
    filter: pb.filter('roomId = {:roomId} && date = {:date}', { roomId, date }),
    requestKey: null,
  });
  return findConflicts(rows, startSlot, endSlot, excludeId);
}

/** 날짜별 충돌 결과 */
export interface DateConflict {
  date: string;
  conflicts: Reservation[];
}

/**
 * 여러 날짜에 대해 같은 회의실/시간대의 충돌을 검사한다(다일·반복 예약용).
 * 충돌이 있는 날짜만 모아서 반환한다. excludeGroupId 가 주어지면 그 그룹은 제외.
 */
export async function findConflictsAcrossDates(
  roomId: string,
  dates: string[],
  startSlot: number,
  endSlot: number,
  excludeGroupId?: string,
): Promise<DateConflict[]> {
  const results: DateConflict[] = [];
  for (const date of dates) {
    let rows = await pb.collection('reservations').getFullList<Reservation>({
      filter: pb.filter('roomId = {:roomId} && date = {:date}', { roomId, date }),
      requestKey: null,
    });
    if (excludeGroupId) {
      rows = rows.filter((r) => r.groupId !== excludeGroupId);
    }
    const conflicts = findConflicts(rows, startSlot, endSlot);
    if (conflicts.length > 0) results.push({ date, conflicts });
  }
  return results;
}

/** 예약 생성 */
export async function createReservation(input: ReservationInput): Promise<string> {
  const rec = await pb.collection('reservations').create<Reservation>(input);
  return rec.id;
}

/**
 * 여러 예약을 생성한다(다일·반복 예약). groupId 는 호출 측에서 각 input 에 부여한다.
 * (PocketBase 는 클라이언트 일괄 트랜잭션이 없어 하나씩 생성 — 건수가 적어 충분.)
 */
export async function createReservations(
  inputs: ReservationInput[],
): Promise<void> {
  for (const input of inputs) {
    await pb.collection('reservations').create(input);
  }
}

/** 예약 수정 (소유자 createdByUid 는 변경하지 않음) */
export async function updateReservation(
  id: string,
  patch: Partial<ReservationInput>,
): Promise<void> {
  await pb.collection('reservations').update(id, patch);
}

/** 예약 삭제(취소) */
export async function deleteReservation(id: string): Promise<void> {
  await pb.collection('reservations').delete(id);
}

/** 그룹(다일·반복) 전체 삭제 */
export async function deleteReservationGroup(groupId: string): Promise<void> {
  const rows = await pb.collection('reservations').getFullList<Reservation>({
    filter: pb.filter('groupId = {:groupId}', { groupId }),
    requestKey: null,
  });
  for (const r of rows) {
    await pb.collection('reservations').delete(r.id);
  }
}
