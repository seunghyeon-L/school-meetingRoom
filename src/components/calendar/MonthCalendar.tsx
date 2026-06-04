import { useMemo } from 'react';
import type { Reservation, Room } from '../../types/models';
import { colorFor, type RoomColor } from '../../lib/roomColor';
import {
  isSameMonth,
  isToday,
  monthGridWeeks,
  monthLabel,
  sundayIndex,
} from '../../lib/dateKey';
import { WEEKDAY_LABELS_SUN } from '../../lib/constants';

interface MonthCalendarProps {
  /** 표시할 달의 1일 키 */
  monthAnchor: string;
  byDate: Record<string, Reservation[]>;
  rooms: Room[];
  roomColors: Map<string, RoomColor>;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  /** 날짜 더블클릭 시 해당 날짜로 예약 추가 */
  onAddOnDate: (date: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

const MAX_CHIPS = 3;

/** '419호' -> '419' (칩 공간 절약용 짧은 방 이름) */
function shortRoom(name: string): string {
  return name.replace(/호\s*$/, '').trim() || name;
}

export function MonthCalendar({
  monthAnchor,
  byDate,
  rooms,
  roomColors,
  selectedDate,
  onSelectDate,
  onAddOnDate,
  onPrevMonth,
  onNextMonth,
  onToday,
}: MonthCalendarProps) {
  const days = useMemo(() => monthGridWeeks(monthAnchor).flat(), [monthAnchor]);
  const roomName = useMemo(() => {
    const m = new Map<string, string>();
    rooms.forEach((r) => m.set(r.id, r.name));
    return m;
  }, [rooms]);

  return (
    <div className="cal">
      <div className="cal__header">
        <button className="cal__nav" aria-label="이전 달" onClick={onPrevMonth}>
          ‹
        </button>
        <span className="cal__title">{monthLabel(monthAnchor)}</span>
        <button className="cal__nav" aria-label="다음 달" onClick={onNextMonth}>
          ›
        </button>
        <span className="cal__spacer" />
        <button className="cal__today-btn" onClick={onToday}>
          오늘
        </button>
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
          const inMonth = isSameMonth(day, monthAnchor);
          const dayResv = byDate[day] ?? [];
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
                {dayResv.slice(0, MAX_CHIPS).map((r) => {
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
                {dayResv.length > MAX_CHIPS && (
                  <span className="cal__more">+{dayResv.length - MAX_CHIPS}</span>
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
