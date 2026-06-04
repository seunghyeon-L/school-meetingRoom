import type { Timestamp } from 'firebase/firestore';

export interface Room {
  id: string;
  name: string;
  order: number;
  active: boolean;
  capacity?: number;
}

/** 사용자(조교) — v1 에서는 전원 조교. 교수 직접 예약은 추후 확장. */
export interface User {
  id: string;
  name: string;
  title: string;
  order: number;
  active: boolean;
}

export interface Reservation {
  id: string;
  roomId: string;
  /** 'YYYY-MM-DD' (KST 기준) */
  date: string;
  /** 0-27 (포함) */
  startSlot: number;
  /** 1-28 (배타적, startSlot 보다 큼) */
  endSlot: number;
  startLabel: string;
  endLabel: string;
  /** 누가 — 예약 대상자(자유 입력) */
  bookedFor: string;
  /** 용도 — 무슨 용도로 빌리는지(자유 입력, 선택) */
  purpose?: string;
  /** 다일/반복 예약을 묶는 그룹 id (단건이면 없음) */
  groupId?: string | null;
  /** 예약을 등록한 조교 */
  createdByUid: string;
  createdByName: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

/** Firestore 에 쓰기 위한 예약 입력값 (id/timestamps 제외) */
export type ReservationInput = Omit<
  Reservation,
  'id' | 'createdAt' | 'updatedAt'
>;
