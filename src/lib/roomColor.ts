export interface RoomColor {
  /** 옅은 배경 (칩/패널 헤더) */
  bg: string;
  /** 진한 글자/강조 */
  fg: string;
  /** 막대(타임라인) 색 */
  bar: string;
}

/** 회의실별 색상 팔레트 (rooms 순서대로 순환 배정) */
const PALETTE: RoomColor[] = [
  { bg: '#e8f0fe', fg: '#1a56db', bar: '#3b82f6' }, // 파랑
  { bg: '#e6f4ea', fg: '#137333', bar: '#34a853' }, // 초록
  { bg: '#fef3e0', fg: '#a8590a', bar: '#f59e0b' }, // 주황
  { bg: '#fce8f3', fg: '#a4144d', bar: '#ec4899' }, // 분홍
  { bg: '#ede9fe', fg: '#6d28d9', bar: '#8b5cf6' }, // 보라
];

export function roomColorByIndex(index: number): RoomColor {
  const len = PALETTE.length;
  return PALETTE[((index % len) + len) % len];
}

/** rooms 배열 순서대로 roomId -> 색상 매핑 */
export function buildRoomColorMap(roomIds: string[]): Map<string, RoomColor> {
  const map = new Map<string, RoomColor>();
  roomIds.forEach((id, i) => map.set(id, roomColorByIndex(i)));
  return map;
}

/** 매핑에 없으면 첫 색으로 폴백 */
export function colorFor(
  map: Map<string, RoomColor>,
  roomId: string,
): RoomColor {
  return map.get(roomId) ?? roomColorByIndex(0);
}
