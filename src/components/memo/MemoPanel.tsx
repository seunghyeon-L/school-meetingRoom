import { useState, type FormEvent } from 'react';
import { BigButton } from '../ui/BigButton';
import { useMemos } from '../../hooks/useMemos';
import { useSession } from '../../hooks/useSession';
import { createMemo, deleteMemo } from '../../data/memos';

const MAX_LEN = 500;

/** PocketBase 날짜 문자열 -> 'M/D HH:mm' (없으면 빈 문자열). */
function formatTime(iso?: string): string {
  if (!iso) return '';
  // PocketBase 는 'YYYY-MM-DD HH:mm:ss.SSSZ' 형식 → 'T' 로 바꿔 안전하게 파싱
  const d = new Date(iso.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return '';
  const mm = d.getMonth() + 1;
  const dd = d.getDate();
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${mm}/${dd} ${hh}:${mi}`;
}

/**
 * 조교 공유 메모(사이드바).
 * 메모를 추가하면 작성자/시간과 함께 목록에 쌓이고, 두 조교가 실시간으로 함께 본다.
 * (한 칸을 공유해 덮어쓰는 방식 대신, 충돌 없는 목록형으로 구성.)
 */
export function MemoPanel() {
  const { user, userId } = useSession();
  const { memos, loading, error } = useMemos();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const trimmed = text.trim();
  const canSubmit = trimmed.length > 0 && !busy && !!userId;

  const doSubmit = async () => {
    if (!canSubmit || !userId) return;
    setBusy(true);
    try {
      await createMemo({
        text: trimmed.slice(0, MAX_LEN),
        authorId: userId,
        authorName: user?.name ?? '조교',
      });
      setText('');
    } catch (err) {
      console.error('메모 저장 실패', err);
      window.alert('메모 저장에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  };

  const onFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    void doSubmit();
  };

  const onRemove = async (id: string) => {
    try {
      await deleteMemo(id);
    } catch (err) {
      console.error('메모 삭제 실패', err);
      window.alert('메모 삭제에 실패했습니다.');
    }
  };

  return (
    <section className="memo" aria-label="공유 메모">
      <div className="memo__head">
        <h3 className="memo__title">메모</h3>
        <span className="memo__badge">조교 공유</span>
      </div>

      <form className="memo__form" onSubmit={onFormSubmit}>
        <textarea
          className="memo__input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="서로에게 남길 메모… (Ctrl+Enter 로 등록)"
          rows={2}
          maxLength={MAX_LEN}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault();
              void doSubmit();
            }
          }}
        />
        <div className="memo__form-row">
          <span className="memo__count">
            {text.length}/{MAX_LEN}
          </span>
          <BigButton size="sm" type="submit" disabled={!canSubmit}>
            추가
          </BigButton>
        </div>
      </form>

      {error ? (
        <p className="memo__empty">메모를 불러오지 못했습니다.</p>
      ) : loading ? (
        <p className="memo__empty">불러오는 중…</p>
      ) : memos.length === 0 ? (
        <p className="memo__empty">아직 메모가 없습니다. 첫 메모를 남겨보세요.</p>
      ) : (
        <ul className="memo__list">
          {memos.map((m) => (
            <li key={m.id} className="memo__item">
              <div className="memo__meta">
                <span className="memo__author">{m.authorName}</span>
                <span className="memo__time">{formatTime(m.created)}</span>
                <button
                  type="button"
                  className="memo__del"
                  aria-label="메모 삭제"
                  title="삭제"
                  onClick={() => void onRemove(m.id)}
                >
                  ×
                </button>
              </div>
              <p className="memo__text">{m.text}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
