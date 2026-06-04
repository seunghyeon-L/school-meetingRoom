import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Reservation, ReservationInput } from '../types/models';
import { findConflicts } from '../lib/overlap';

const reservationsCol = collection(db, 'reservations');

function mapDoc(id: string, data: Record<string, unknown>): Reservation {
  return { id, ...(data as Omit<Reservation, 'id'>) };
}

/** 날짜 범위 [startDate, endDate] 의 예약을 실시간 구독 (월 달력용) */
export function subscribeReservationsByRange(
  startDate: string,
  endDate: string,
  onData: (rows: Reservation[]) => void,
  onError: (err: Error) => void,
): Unsubscribe {
  const q = query(
    reservationsCol,
    where('date', '>=', startDate),
    where('date', '<=', endDate),
  );
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => mapDoc(d.id, d.data()))),
    (err) => onError(err),
  );
}

/** 단일 예약 조회 */
export async function getReservation(id: string): Promise<Reservation | null> {
  const snap = await getDoc(doc(reservationsCol, id));
  if (!snap.exists()) return null;
  return mapDoc(snap.id, snap.data());
}

/** 겹치는 예약 조회 (room/date 로 쿼리 후 JS 에서 반열림 겹침 판정) */
export async function checkConflict(
  roomId: string,
  date: string,
  startSlot: number,
  endSlot: number,
  excludeId?: string,
): Promise<Reservation[]> {
  const q = query(
    reservationsCol,
    where('roomId', '==', roomId),
    where('date', '==', date),
  );
  const snap = await getDocs(q);
  const rows = snap.docs.map((d) => mapDoc(d.id, d.data()));
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
    const q = query(
      reservationsCol,
      where('roomId', '==', roomId),
      where('date', '==', date),
    );
    const snap = await getDocs(q);
    let rows = snap.docs.map((d) => mapDoc(d.id, d.data()));
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
  const ref = await addDoc(reservationsCol, {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/**
 * 여러 예약을 한 번의 배치로 원자적으로 생성한다(다일·반복 예약).
 * groupId 는 호출 측에서 각 input 에 부여한다. (배치 상한 500 < MAX_INSTANCES 200)
 */
export async function createReservations(
  inputs: ReservationInput[],
): Promise<void> {
  const batch = writeBatch(db);
  for (const input of inputs) {
    const ref = doc(reservationsCol); // 자동 id
    batch.set(ref, {
      ...input,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  await batch.commit();
}

/** 예약 수정 (소유자 createdByUid 는 변경하지 않음) */
export async function updateReservation(
  id: string,
  patch: Partial<ReservationInput>,
): Promise<void> {
  await updateDoc(doc(reservationsCol, id), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

/** 예약 삭제(취소) */
export async function deleteReservation(id: string): Promise<void> {
  await deleteDoc(doc(reservationsCol, id));
}

/** 그룹(다일·반복) 전체 삭제 */
export async function deleteReservationGroup(groupId: string): Promise<void> {
  const q = query(reservationsCol, where('groupId', '==', groupId));
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}
