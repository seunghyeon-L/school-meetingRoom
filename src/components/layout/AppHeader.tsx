import { useState } from 'react';
import { useSession } from '../../hooks/useSession';
import { NamePickerModal } from '../booking/NamePickerModal';
import { ManageDialog } from '../manage/ManageDialog';
import type { User } from '../../types/models';

/**
 * 상단 헤더 — 단일 바(흰 톱내비)로 통합.
 * 좌측: 워드마크 + 내비, 우측: 신분(조교 이름) + 이름 바꾸기.
 * (이전의 검정 유틸리티 스트립은 제거)
 */
export function AppHeader() {
  const { user } = useSession();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);

  const handleSelect = (_u: User) => {
    setPickerOpen(false);
  };

  return (
    <>
      <header className="sitehead">
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

            <span className="topnav__spacer" />

            {user && (
              <span className="topnav__user">
                {user.name} {user.title}
              </span>
            )}
            <button
              className="topnav__namebtn"
              onClick={() => setManageOpen(true)}
            >
              ⚙ 관리
            </button>
            <button
              className="topnav__namebtn"
              onClick={() => setPickerOpen(true)}
            >
              {user ? '이름 바꾸기' : '이름 선택'}
            </button>
          </div>
        </div>
      </header>

      <NamePickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelect}
      />

      <ManageDialog open={manageOpen} onClose={() => setManageOpen(false)} />
    </>
  );
}
