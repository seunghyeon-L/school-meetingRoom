import { useEffect, useRef, useState } from 'react';
import { fullDateLabel, todayKey } from '../../lib/dateKey';
import { CalendarPanel } from './CalendarPanel';

interface DatePickerProps {
  /** 선택된 날짜 'YYYY-MM-DD' */
  value: string;
  onChange: (date: string) => void;
  /** 이 날짜 이전은 선택 불가 (YYYY-MM-DD) */
  min?: string;
  id?: string;
  ariaLabel?: string;
}

/**
 * 박스형 트리거 + 인라인으로 펼쳐지는 큰 달력(CalendarPanel).
 * 스크롤되는 모달 안에서도 잘리지 않도록 absolute 팝오버가 아니라
 * 문서 흐름 안에서 펼쳐진다. (반복 종료 날짜 선택 등에서 사용)
 */
export function DatePicker({
  value,
  onChange,
  min,
  id,
  ariaLabel,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // 바깥 클릭 시 닫기
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // Escape는 달력만 닫고 상위 Modal까지 전파되지 않게 캡처 단계에서 가로챈다
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open]);

  return (
    <div className="datepicker" ref={rootRef}>
      <button
        type="button"
        id={id}
        className="datepicker__trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="datepicker__value">
          {fullDateLabel(value || todayKey())}
        </span>
        <span className="datepicker__icon" aria-hidden="true">
          📅
        </span>
      </button>

      {open && (
        <div
          className="datepicker__panel"
          role="dialog"
          aria-label="날짜 선택 달력"
        >
          <CalendarPanel
            key={String(open)}
            value={value}
            min={min}
            onPick={(d) => {
              onChange(d);
              setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
