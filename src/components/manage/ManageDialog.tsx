import { useEffect, useState, type FormEvent } from 'react';
import { Modal } from '../ui/Modal';
import { BigButton } from '../ui/BigButton';
import type { Room, User } from '../../types/models';
import {
  getAllRooms,
  createRoom,
  updateRoom,
  deleteRoom,
} from '../../data/rooms';
import {
  getAllAssistants,
  createAssistant,
  updateAssistant,
  deleteAssistant,
} from '../../data/users';

interface ManageDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * 관리 모달 — 방(rooms) · 조교(assistants) 를 앱 안에서 추가/수정/삭제.
 * 접근은 열려 있고(PIN 없음), 삭제 시에만 확인을 받는다.
 */
export function ManageDialog({ open, onClose }: ManageDialogProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [assistants, setAssistants] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    setErr(null);
    try {
      const [r, a] = await Promise.all([getAllRooms(), getAllAssistants()]);
      setRooms(r);
      setAssistants(a);
    } catch (e) {
      console.error(e);
      setErr('불러오기에 실패했습니다. 서버 연결을 확인해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) void reload();
  }, [open]);

  if (!open) return null;

  const nextRoomOrder = rooms.reduce((m, r) => Math.max(m, r.order), 0) + 1;
  const nextAsstOrder = assistants.reduce((m, a) => Math.max(m, a.order), 0) + 1;

  return (
    <Modal open={open} title="관리 (방 · 조교)" onClose={onClose} wide>
      <div className="manage">
        {err && <p className="manage__err">{err}</p>}
        {loading && <p className="manage__empty">불러오는 중…</p>}

        {/* 방 */}
        <section className="manage__section">
          <h3 className="manage__h">🚪 회의실(방)</h3>
          <div className="manage__list">
            {rooms.map((r) => (
              <RoomRow key={r.id} room={r} onChanged={reload} />
            ))}
            {!loading && rooms.length === 0 && (
              <p className="manage__empty">방이 없습니다. 아래에서 추가하세요.</p>
            )}
          </div>
          <AddRoom nextOrder={nextRoomOrder} onAdded={reload} />
        </section>

        {/* 조교 */}
        <section className="manage__section">
          <h3 className="manage__h">🧑‍💼 조교 · 사용자</h3>
          <div className="manage__list">
            {assistants.map((a) => (
              <AssistantRow key={a.id} user={a} onChanged={reload} />
            ))}
            {!loading && assistants.length === 0 && (
              <p className="manage__empty">조교가 없습니다. 아래에서 추가하세요.</p>
            )}
          </div>
          <AddAssistant nextOrder={nextAsstOrder} onAdded={reload} />
        </section>

        <div className="manage__footer">
          <BigButton variant="secondary" onClick={onClose}>
            닫기
          </BigButton>
        </div>
      </div>
    </Modal>
  );
}

/* ── 방 한 줄 (수정/삭제) ── */
function RoomRow({ room, onChanged }: { room: Room; onChanged: () => void }) {
  const [name, setName] = useState(room.name);
  const [order, setOrder] = useState(String(room.order));
  const [active, setActive] = useState(room.active);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await updateRoom(room.id, {
        name: name.trim(),
        order: Number(order) || 0,
        active,
      });
      onChanged();
    } catch (e) {
      console.error(e);
      window.alert('저장에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`'${room.name}' 방을 정말로 삭제하시겠습니까?`)) return;
    setBusy(true);
    try {
      await deleteRoom(room.id);
      onChanged();
    } catch (e) {
      console.error(e);
      window.alert('삭제에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="manage__row">
      <input
        className="manage__in manage__in--name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="방 이름"
      />
      <input
        className="manage__in manage__in--order"
        type="number"
        value={order}
        onChange={(e) => setOrder(e.target.value)}
        title="정렬 순서"
      />
      <label className="manage__chk">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
        />
        활성
      </label>
      <button className="manage__save" onClick={save} disabled={busy}>
        저장
      </button>
      <button
        className="manage__del"
        onClick={remove}
        disabled={busy}
        aria-label="삭제"
        title="삭제"
      >
        🗑
      </button>
    </div>
  );
}

/* ── 조교 한 줄 (수정/삭제) ── */
function AssistantRow({ user, onChanged }: { user: User; onChanged: () => void }) {
  const [name, setName] = useState(user.name);
  const [title, setTitle] = useState(user.title);
  const [order, setOrder] = useState(String(user.order));
  const [active, setActive] = useState(user.active);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await updateAssistant(user.id, {
        name: name.trim(),
        title: title.trim(),
        order: Number(order) || 0,
        active,
      });
      onChanged();
    } catch (e) {
      console.error(e);
      window.alert('저장에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`'${user.name}' 을(를) 정말로 삭제하시겠습니까?`)) return;
    setBusy(true);
    try {
      await deleteAssistant(user.id);
      onChanged();
    } catch (e) {
      console.error(e);
      window.alert('삭제에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="manage__row">
      <input
        className="manage__in manage__in--name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="이름"
      />
      <input
        className="manage__in manage__in--title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="직함"
      />
      <input
        className="manage__in manage__in--order"
        type="number"
        value={order}
        onChange={(e) => setOrder(e.target.value)}
        title="정렬 순서"
      />
      <label className="manage__chk">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
        />
        활성
      </label>
      <button className="manage__save" onClick={save} disabled={busy}>
        저장
      </button>
      <button
        className="manage__del"
        onClick={remove}
        disabled={busy}
        aria-label="삭제"
        title="삭제"
      >
        🗑
      </button>
    </div>
  );
}

/* ── 방 추가 ── */
function AddRoom({
  nextOrder,
  onAdded,
}: {
  nextOrder: number;
  onAdded: () => void;
}) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await createRoom({ name: name.trim(), order: nextOrder, active: true });
      setName('');
      onAdded();
    } catch (er) {
      console.error(er);
      window.alert('추가에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="manage__add" onSubmit={add}>
      <input
        className="manage__in"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="새 방 이름 (예: 411)"
      />
      <BigButton size="sm" type="submit" disabled={!name.trim() || busy}>
        + 추가
      </BigButton>
    </form>
  );
}

/* ── 조교 추가 ── */
function AddAssistant({
  nextOrder,
  onAdded,
}: {
  nextOrder: number;
  onAdded: () => void;
}) {
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await createAssistant({
        name: name.trim(),
        title: title.trim(),
        order: nextOrder,
        active: true,
      });
      setName('');
      setTitle('');
      onAdded();
    } catch (er) {
      console.error(er);
      window.alert('추가에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="manage__add" onSubmit={add}>
      <input
        className="manage__in"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="이름"
      />
      <input
        className="manage__in"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="직함 (예: 조교)"
      />
      <BigButton size="sm" type="submit" disabled={!name.trim() || busy}>
        + 추가
      </BigButton>
    </form>
  );
}
