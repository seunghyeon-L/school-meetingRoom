import dayjs from 'dayjs';

/** 반복 종류 */
export type RepeatKind = 'none' | 'daily' | 'weekly' | 'monthly';

/** 반복 종료 방식 — 총 N번 / 특정 날짜까지 */
export type EndMode = 'count' | 'until';

export const REPEAT_OPTIONS: { value: RepeatKind; label: string }[] = [
  { value: 'none', label: '반복 안 함' },
  { value: 'daily', label: '일마다' },
  { value: 'weekly', label: '주마다' },
  { value: 'monthly', label: '개월마다' },
];

/** 한 번에 만들 수 있는 인스턴스(날짜) 상한 — 문서 폭주 방지 */
export const MAX_INSTANCES = 200;

/** '총 N번' 으로 지정 가능한 최댓값 (상한과 동일) */
export const MAX_COUNT = MAX_INSTANCES;

/** 간격(N) 으로 지정 가능한 최댓값 */
export const MAX_INTERVAL = 30;

/**
 * 반복 규칙.
 * - date: 첫(기준) 예약 날짜
 * - kind/interval: 일/주/개월마다 + 간격(N)
 * - weekdays: 주간 반복 시 선택 요일(0=일 ... 6=토). 비어 있으면 기준일 요일 사용
 * - endMode/count/until: 종료 조건 (총 count 번 / until 날짜까지)
 */
export interface RecurrenceRule {
  date: string;
  kind: RepeatKind;
  interval: number;
  weekdays: number[];
  endMode: EndMode;
  count: number;
  until: string;
}

export interface ExpandResult {
  /** 실제 예약될 날짜 목록('YYYY-MM-DD', 오름차순) */
  dates: string[];
  /** 상한(MAX_INSTANCES) 초과로 잘렸는지 */
  truncated: boolean;
}

/**
 * 반복 규칙을 실제 예약 날짜 목록으로 펼친다.
 * - none: 기준일 하루
 * - daily/monthly: 기준일부터 interval 간격
 * - weekly: 선택 요일마다, interval 주 간격 (기준일 이전 날짜는 제외)
 * 종료 조건(총 N번/종료 날짜)과 MAX_INSTANCES 상한을 모두 적용한다.
 */
export function expandRecurrence(rule: RecurrenceRule): ExpandResult {
  const anchor = dayjs(rule.date);
  if (!anchor.isValid()) return { dates: [], truncated: false };

  const anchorKey = anchor.format('YYYY-MM-DD');

  // 반복 안 함 → 하루
  if (rule.kind === 'none') {
    return { dates: [anchorKey], truncated: false };
  }

  const interval = clampInt(rule.interval, 1, MAX_INTERVAL, 1);
  const byCount = rule.endMode === 'count';
  const rawCount = Math.floor(Number(rule.count));
  const limit = byCount ? clampInt(rule.count, 1, MAX_COUNT, 1) : MAX_INSTANCES;
  const until = byCount ? null : dayjs(rule.until);

  // until 모드인데 종료일이 유효하지 않거나 기준일 이전이면 → 하루만
  if (!byCount && (!until!.isValid() || until!.isBefore(anchor, 'day'))) {
    return { dates: [anchorKey], truncated: false };
  }

  const dates: string[] = [];
  let truncated = false;

  /** 후보 날짜 1개를 결과에 담는다. 'stop' 이면 순회 종료 */
  const collect = (d: dayjs.Dayjs): 'stop' | 'ok' => {
    if (byCount && dates.length >= limit) {
      // 요청 횟수가 상한(MAX_COUNT)을 넘어 잘린 경우 표시
      if (Number.isFinite(rawCount) && rawCount > limit) truncated = true;
      return 'stop';
    }
    if (dates.length >= MAX_INSTANCES) {
      truncated = true;
      return 'stop';
    }
    // until 모드: 종료일 초과 시 중단 (후보는 시간순이므로 이후도 모두 초과)
    if (!byCount && d.isAfter(until!, 'day')) return 'stop';
    dates.push(d.format('YYYY-MM-DD'));
    return 'ok';
  };

  if (rule.kind === 'daily' || rule.kind === 'monthly') {
    const unit = rule.kind === 'monthly' ? 'month' : 'day';
    let cur = anchor;
    while (collect(cur) === 'ok') {
      cur = cur.add(interval, unit);
    }
  } else {
    // weekly — 선택 요일마다, interval 주 간격
    let wds = (rule.weekdays.length ? rule.weekdays : [anchor.day()]).filter(
      (w) => Number.isInteger(w) && w >= 0 && w <= 6,
    );
    wds = Array.from(new Set(wds)).sort((a, b) => a - b);
    if (wds.length === 0) wds = [anchor.day()];

    // 기준일이 속한 주의 일요일(달력이 일요일 시작)
    const weekStart = anchor.subtract(anchor.day(), 'day');
    let cycle = 0;
    let stop = false;
    while (!stop) {
      const base = weekStart.add(cycle * interval, 'week');
      for (const wd of wds) {
        const occ = base.add(wd, 'day');
        // 첫 주에서 기준일 이전 요일은 제외
        if (occ.isBefore(anchor, 'day')) continue;
        if (collect(occ) === 'stop') {
          stop = true;
          break;
        }
      }
      cycle++;
    }
  }

  return { dates, truncated };
}

/** 정수 범위 보정 (NaN/소수/범위 밖 → 기본값/경계로) */
function clampInt(v: number, min: number, max: number, fallback: number): number {
  const n = Math.floor(Number(v));
  if (!Number.isFinite(n)) return fallback;
  if (n < min) return min;
  if (n > max) return max;
  return n;
}
