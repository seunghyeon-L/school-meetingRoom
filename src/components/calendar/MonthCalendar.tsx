import { useMemo } from 'react';
import type { Reservation, Room } from '../../types/models';
import { colorFor, type RoomColor } from '../../lib/roomColor';
import { isSameMonth, isToday, sundayIndex } from '../../lib/dateKey';
import { WEEKDAY_LABELS_SUN } from '../../lib/constants';

export type CalendarView = 'month' | 'biweek';

interface MonthCalendarProps {
  /** 렌더할 날짜들(7의 배수, 평탄화된 배열) */
  days: string[];
  /** 헤더 제목 */
  title: string;
  view: CalendarView;
  /** 이 달이 아닌 날짜를 흐리게 (월 보기에서만 전달) */
  dimMonth?: string;
  byDate: Record<string, Reservation[]>;
  rooms: Room[];
  roomColors: Map<string, RoomColor>;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  /** 날짜 더블클릭 시 해당 날짜로 예약 추가 */
  onAddOnDate: (date: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewChange: (v: CalendarView) => void;
  /** 방 필터 (null = 전체). 선택 시 그 방 예약만 표시 */
  roomFilter: string | null;
  onRoomFilterChange: (roomId: string | null) => void;
}

/** '419호' -> '419' (칩 공간 절약용 짧은 방 이름) */
function shortRoom(name: string): string {
  return name.replace(/호\s*$/, '').trim() || name;
}

export function MonthCalendar({
  days,
  title,
  view,
  dimMonth,
  byDate,
  rooms,
  roomColors,
  selectedDate,
  onSelectDate,
  onAddOnDate,
  onPrev,
  onNext,
  onToday,
  onViewChange,
  roomFilter,
  onRoomFilterChange,
}: MonthCalendarProps) {
  const roomName = useMemo(() => {
    const m = new Map<string, string>();
    rooms.forEach((r) => m.set(r.id, r.name));
    return m;
  }, [rooms]);
  // 방 순서(order) 맵 — 칩을 방 호수 순으로 정렬하기 위함
  const roomOrder = useMemo(() => {
    const m = new Map<string, number>();
    rooms.forEach((r, i) => m.set(r.id, r.order ?? i));
    return m;
  }, [rooms]);

  // 2주 보기는 칸이 커서 칩을 더 많이 보여준다
  const maxChips = view === 'biweek' ? 6 : 3;

  /** 1순위 방 순서, 2순위 시작시간 */
  const sortByRoom = (list: Reservation[]): Reservation[] =>
    list
      .slice()
      .sort(
        (a, b) =>
          (roomOrder.get(a.roomId) ?? 9999) - (roomOrder.get(b.roomId) ?? 9999) ||
          a.startSlot - b.startSlot,
      );

  return (
    <div className={['cal', view === 'biweek' ? 'cal--biweek' : ''].filter(Boolean).join(' ')}>
      <div className="cal__header">
        <button className="cal__nav" aria-label="이전" onClick={onPrev}>
          ‹
        </button>
        <span className="cal__title">{title}</span>
        <button className="cal__nav" aria-label="다음" onClick={onNext}>
          ›
        </button>

        <div className="cal__viewtoggle" role="group" aria-label="보기 범위">
          <button
            type="button"
            className={view === 'month' ? 'is-active' : ''}
            onClick={() => onViewChange('month')}
          >
            한 달
          </button>
          <button
            type="button"
            className={view === 'biweek' ? 'is-active' : ''}
            onClick={() => onViewChange('biweek')}
          >
            2주
          </button>
        </div>

        <span className="cal__spacer" />
        <button className="cal__today-btn" onClick={onToday}>
          오늘
        </button>
      </div>

      <div className="cal__roomfilter" role="group" aria-label="방 필터">
        <span className="cal__roomfilter-label">방:</span>
        <button
          type="button"
          className={roomFilter === null ? 'is-active' : ''}
          onClick={() => onRoomFilterChange(null)}
        >
          전체
        </button>
        {rooms.map((r) => (
          <button
            key={r.id}
            type="button"
            className={roomFilter === r.id ? 'is-active' : ''}
            onClick={() => onRoomFilterChange(r.id)}
          >
            {shortRoom(r.name)}
          </button>
        ))}
      </div>

      <div className="cal__weekdays">
        {WEEKDAY_LABELS_SUN.map((w, i) => (
          <div
            key={w}
            className={[
              'cal__weekday',
              i === 0 ? 'cal__weekday--sun' : '',
              i === 6 ? 'cal__weekday--sat' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {w}
          </div>
        ))}
      </div>

      <div className="cal__grid">
        {days.map((day) => {
          const dow = sundayIndex(day);
          const inMonth = dimMonth ? isSameMonth(day, dimMonth) : true;
          const dayResv = sortByRoom(
            (byDate[day] ?? []).filter(
              (r) => roomFilter === null || r.roomId === roomFilter,
            ),
          );
          const cellCls = [
            'cal__cell',
            !inMonth ? 'cal__cell--other' : '',
            day === selectedDate ? 'cal__cell--selected' : '',
          ]
            .filter(Boolean)
            .join(' ');
          const dateCls = [
            'cal__date',
            isToday(day)
              ? 'cal__date--today'
              : dow === 0
                ? 'cal__date--sun'
                : dow === 6
                  ? 'cal__date--sat'
                  : '',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <button
              key={day}
              type="button"
              className={cellCls}
              onClick={() => onSelectDate(day)}
              onDoubleClick={() => onAddOnDate(day)}
              title="더블클릭하면 예약을 추가할 수 있어요"
              aria-label={day}
              aria-pressed={day === selectedDate}
            >
              <span className={dateCls}>{Number(day.slice(8, 10))}</span>
              <span className="cal__chips">
                {dayResv.slice(0, maxChips).map((r) => {
                  const c = colorFor(roomColors, r.roomId);
                  return (
                    <span
                      key={r.id}
                      className="cal__chip"
                      style={{ background: c.bg, color: c.fg }}
                      title={`${roomName.get(r.roomId) ?? ''} ${r.startLabel}~${r.endLabel} · ${r.bookedFor}${r.purpose ? ` (${r.purpose})` : ''}`}
                    >
                      <span className="cal__chip-line cal__chip-line--head">
                        {`[${shortRoom(roomName.get(r.roomId) ?? '')}] ${r.startLabel}~${r.endLabel}`}
                      </span>
                      <span className="cal__chip-line cal__chip-line--sub">
                        {r.purpose ? `${r.bookedFor} · ${r.purpose}` : r.bookedFor}
                      </span>
                    </span>
                  );
                })}
                {dayResv.length > maxChips && (
                  <span className="cal__more">+{dayResv.length - maxChips}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <p className="cal__hint">
        날짜를 <strong>더블클릭</strong>하면 바로 예약을 추가할 수 있어요.
      </p>
    </div>
  );
}
