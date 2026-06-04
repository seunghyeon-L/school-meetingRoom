import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { KST_TZ, WEEKDAY_LABELS_KO } from './constants';

dayjs.extend(utc);
dayjs.extend(timezone);

/** 오늘(KST)의 'YYYY-MM-DD' 키 */
export function todayKey(): string {
  return dayjs().tz(KST_TZ).format('YYYY-MM-DD');
}

/** 임의 입력을 KST 기준 'YYYY-MM-DD' 키로 정규화 */
export function toDateKey(input?: string | number | Date | dayjs.Dayjs): string {
  return dayjs(input).tz(KST_TZ).format('YYYY-MM-DD');
}

/** dateKey 에 일수를 더한 새로운 키 */
export function addDays(dateKey: string, days: number): string {
  return dayjs.tz(dateKey, KST_TZ).add(days, 'day').format('YYYY-MM-DD');
}

/** 해당 dateKey 가 속한 주의 월요일 키 */
export function startOfWeek(dateKey: string): string {
  const d = dayjs.tz(dateKey, KST_TZ);
  // dayjs: 0=일요일 ... 1=월요일. 월요일 시작으로 보정.
  const dow = d.day();
  const diff = dow === 0 ? -6 : 1 - dow;
  return d.add(diff, 'day').format('YYYY-MM-DD');
}

/** 월요일부터 일요일까지 7개 dateKey */
export function weekDays(anyDateKey: string): string[] {
  const monday = startOfWeek(anyDateKey);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/** 요일 라벨 (월~일), index 0=월 */
export function weekdayLabel(dateKey: string): string {
  const dow = dayjs.tz(dateKey, KST_TZ).day(); // 0=일
  const idx = dow === 0 ? 6 : dow - 1;
  return WEEKDAY_LABELS_KO[idx];
}

/** 'M월 D일' 형식 */
export function monthDayLabel(dateKey: string): string {
  const d = dayjs.tz(dateKey, KST_TZ);
  return `${d.month() + 1}월 ${d.date()}일`;
}

/** 'YYYY년 M월 D일 (요일)' 형식 */
export function fullDateLabel(dateKey: string): string {
  const d = dayjs.tz(dateKey, KST_TZ);
  return `${d.year()}년 ${d.month() + 1}월 ${d.date()}일 (${weekdayLabel(dateKey)})`;
}

/** 단순 일(day) 숫자 */
export function dayOfMonth(dateKey: string): number {
  return dayjs.tz(dateKey, KST_TZ).date();
}

/** 오늘(KST)인지 여부 */
export function isToday(dateKey: string): boolean {
  return dateKey === todayKey();
}

/** 'YYYY년 M월' (월 달력 헤더용) */
export function monthLabel(dateKey: string): string {
  const d = dayjs.tz(dateKey, KST_TZ);
  return `${d.year()}년 ${d.month() + 1}월`;
}

/** dateKey 가 속한 달의 1일 키 */
export function startOfMonth(dateKey: string): string {
  return dayjs.tz(dateKey, KST_TZ).startOf('month').format('YYYY-MM-DD');
}

/** dateKey 가 속한 달에 months 를 더한 달의 1일 키 */
export function addMonths(dateKey: string, months: number): string {
  return dayjs
    .tz(dateKey, KST_TZ)
    .add(months, 'month')
    .startOf('month')
    .format('YYYY-MM-DD');
}

/** 두 dateKey 가 같은 달(YYYY-MM)인지 */
export function isSameMonth(a: string, b: string): boolean {
  return a.slice(0, 7) === b.slice(0, 7);
}

/** dateKey 의 요일 인덱스 (0=일 ... 6=토) */
export function sundayIndex(dateKey: string): number {
  return dayjs.tz(dateKey, KST_TZ).day();
}

/**
 * 월 달력 그리드(일요일 시작)를 주(週) 단위로 반환.
 * 해당 달을 모두 포함하도록 앞/뒤를 이전·다음 달 날짜로 채운다.
 */
export function monthGridWeeks(anyDateKey: string): string[][] {
  const first = dayjs.tz(anyDateKey, KST_TZ).startOf('month');
  const firstDow = first.day(); // 0=일
  const daysInMonth = first.daysInMonth();
  const totalCells = Math.ceil((firstDow + daysInMonth) / 7) * 7;
  const gridStart = first.subtract(firstDow, 'day');
  const weeks: string[][] = [];
  for (let w = 0; w * 7 < totalCells; w++) {
    const week: string[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(gridStart.add(w * 7 + d, 'day').format('YYYY-MM-DD'));
    }
    weeks.push(week);
  }
  return weeks;
}

/** 월 그리드의 첫/마지막 날짜 키 (예약 범위 쿼리용) */
export function monthGridRange(anyDateKey: string): { start: string; end: string } {
  const weeks = monthGridWeeks(anyDateKey);
  const flat = weeks.flat();
  return { start: flat[0], end: flat[flat.length - 1] };
}
