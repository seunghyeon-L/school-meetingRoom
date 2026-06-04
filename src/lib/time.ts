import { OPEN_HOUR, SLOT_MIN, SLOT_COUNT } from './constants';

/**
 * 슬롯 인덱스(0..28) -> 'HH:mm' 라벨.
 * index 0 = '08:00' ... index 28 = '22:00'
 */
export function slotToLabel(index: number): string {
  const totalMin = OPEN_HOUR * 60 + index * SLOT_MIN;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * 슬롯 인덱스 -> '오전/오후 h:mm' 라벨 (고령 사용자 친화 12시간 표기).
 * index 0 = '오전 8:00', 13:00 = '오후 1:00', 22:00 = '오후 10:00'
 */
export function slotToLabel12(index: number): string {
  const totalMin = OPEN_HOUR * 60 + index * SLOT_MIN;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  const ampm = h < 12 ? '오전' : '오후';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${ampm} ${h12}:${String(m).padStart(2, '0')}`;
}

/** 시작 슬롯으로 선택 가능한 인덱스 0..27 */
export const START_SLOTS: number[] = Array.from(
  { length: SLOT_COUNT },
  (_, i) => i,
);

/** 종료 슬롯으로 선택 가능한 인덱스 1..28 */
export const END_SLOTS: number[] = Array.from(
  { length: SLOT_COUNT },
  (_, i) => i + 1,
);

/** 시작 라벨 표 (index 0..27) */
export const START_LABELS: string[] = START_SLOTS.map(slotToLabel);

/** 종료 라벨 표 (index 1..28) */
export const END_LABELS: string[] = END_SLOTS.map(slotToLabel);

/** 시(hour), 분(min) -> 슬롯 인덱스 */
export function timeToSlot(hour: number, min: number): number {
  return (hour - OPEN_HOUR) * 2 + (min === 30 ? 1 : 0);
}

/** 두 슬롯 사이의 시간 범위 라벨, 예: '09:00 ~ 10:30' */
export function rangeLabel(startSlot: number, endSlot: number): string {
  return `${slotToLabel(startSlot)} ~ ${slotToLabel(endSlot)}`;
}
