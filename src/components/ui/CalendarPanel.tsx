import { useEffect, useState } from 'react';
import {
  addMonths,
  fullDateLabel,
  isSameMonth,
  isToday,
  monthGridWeeks,
  monthLabel,
  startOfMonth,
  sundayIndex,
  todayKey,
} from '../../lib/dateKey';
import { WEEKDAY_LABELS_SUN } from '../../lib/constants';

interface CalendarPanelProps {
  /** 선택된 날짜 'YYYY-MM-DD' */
  value: string;
  /** 이 날짜 이전은 선택 불가 (YYYY-MM-DD) */
  min?: string;
  onPick: (date: string) => void;
  /** '오늘로' 버튼 노출 (기본 true) */
  showToday?: boolean;
}

/**
 * 큰 월 달력 패널 (열림/닫힘은 부모가 제어).
 * DatePicker(반복 종료일)와 예약 다이얼로그(시작/종료 날짜)에서 공용으로 사용한다.
 */
export function CalendarPanel({
  value,
  min,
  onPick,
  showToday = true,
}: CalendarPanelProps) {
  const [view, setView] = useState(() => startOfMonth(value || todayKey()));

  // value가 바뀌면 보이는 달도 맞춰준다
  useEffect(() => {
    if (value) setView(startOfMonth(value));
  }, [value]);

  const days = monthGridWeeks(view).flat();

  const goToday = () => {
    const t = todayKey();
    setView(startOfMonth(t));
    if (!(min && t < min)) onPick(t);
  };

  return (
    <div className="calpanel">
      <div className="calpanel__head">
        <button
          type="button"
          className="calpanel__nav"
          aria-label="이전 달"
          onClick={() => setView((v) => addMonths(v, -1))}
        >
          ‹
        </button>
        <span className="calpanel__month">{monthLabel(view)}</span>
        <button
          type="button"
          className="calpanel__nav"
          aria-label="다음 달"
          onClick={() => setView((v) => addMonths(v, 1))}
        >
          ›
        </button>
      </div>

      <div className="calpanel__weekdays">
        {WEEKDAY_LABELS_SUN.map((w, i) => (
          <div
            key={w}
            className={[
              'calpanel__weekday',
              i === 0 ? 'calpanel__weekday--sun' : '',
              i === 6 ? 'calpanel__weekday--sat' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {w}
          </div>
        ))}
      </div>

      <div className="calpanel__grid">
        {days.map((d) => {
          const dow = sundayIndex(d);
          const inMonth = isSameMonth(d, view);
          const disabled = !!min && d < min;
          const selected = d === value;
          const cls = [
            'calpanel__day',
            !inMonth ? 'calpanel__day--other' : '',
            selected ? 'is-selected' : '',
            isToday(d) ? 'is-today' : '',
            dow === 0 ? 'calpanel__day--sun' : '',
            dow === 6 ? 'calpanel__day--sat' : '',
            disabled ? 'is-disabled' : '',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <button
              key={d}
              type="button"
              className={cls}
              disabled={disabled}
              aria-label={fullDateLabel(d)}
              aria-pressed={selected}
              onClick={() => !disabled && onPick(d)}
            >
              {Number(d.slice(8, 10))}
            </button>
          );
        })}
      </div>

      {showToday && (
        <div className="calpanel__foot">
          <button
            type="button"
            className="calpanel__today"
            onClick={goToday}
          >
            오늘로
          </button>
        </div>
      )}
    </div>
  );
}
