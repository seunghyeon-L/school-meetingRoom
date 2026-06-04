import { useEffect, useRef } from 'react';
import { slotToLabel12 } from '../../lib/time';

interface TimeListPanelProps {
  /** 선택된 슬롯 인덱스 */
  value: number;
  /** 선택 가능한 슬롯 인덱스 목록 */
  options: number[];
  onPick: (slot: number) => void;
}

/**
 * 큰 시간 선택 리스트 (오전/오후 12시간 표기).
 * 열림/닫힘은 부모가 제어하며, 열릴 때 선택된 시간이 보이도록 스크롤한다.
 */
export function TimeListPanel({ value, options, onPick }: TimeListPanelProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // 열릴 때 선택된 항목을 가운데로 스크롤
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLButtonElement>(
      '.timelist__item.is-selected',
    );
    if (el) el.scrollIntoView({ block: 'center' });
  }, []);

  return (
    <div className="timelist" ref={listRef}>
      {options.map((s) => (
        <button
          key={s}
          type="button"
          className={`timelist__item ${s === value ? 'is-selected' : ''}`}
          aria-pressed={s === value}
          onClick={() => onPick(s)}
        >
          {slotToLabel12(s)}
        </button>
      ))}
    </div>
  );
}
