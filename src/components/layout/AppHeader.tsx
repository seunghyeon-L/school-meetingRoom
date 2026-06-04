import { useState } from 'react';
import { useSession } from '../../hooks/useSession';
import { NamePickerModal } from '../booking/NamePickerModal';
import type { User } from '../../types/models';

/**
 * 상단 헤더 (HP 스타일):
 *  - 유틸리티 스트립(잉크): 기관명 + 신분(조교 이름) + 이름 변경
 *  - 톱 내비(흰): 셰브론 워드마크 + 내비 링크
 */
export function AppHeader() {
  const { user } = useSession();
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleSelect = (_u: User) => {
    setPickerOpen(false);
  };

  return (
    <>
      <header className="sitehead">
        <div className="utilbar">
          <div className="utilbar__inner">
            <span className="utilbar__org">
              제주대학교 · 학과 회의실 예약 시스템
            </span>
            <span className="utilbar__spacer" />
            {user && (
              <span className="utilbar__user">
                {user.name} {user.title}
              </span>
            )}
            <button
              className="utilbar__link"
              onClick={() => setPickerOpen(true)}
            >
              {user ? '이름 바꾸기' : '이름 선택'}
            </button>
          </div>
        </div>

        <div className="topnav">
          <div className="topnav__inner">
            <a className="brand" href="/" aria-label="회의실 예약 홈">
              <span className="chevrons" aria-hidden="true">
                <i />
                <i />
              </span>
              <span className="brand__word">회의실 예약</span>
            </a>
            <nav className="topnav__links">
              <a className="navlink navlink--active" href="/">
                예약 달력
              </a>
            </nav>
          </div>
        </div>
      </header>

      <NamePickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelect}
      />
    </>
  );
}
