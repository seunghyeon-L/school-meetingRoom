import { Modal } from '../ui/Modal';
import { Spinner } from '../ui/Spinner';
import { EmptyState, ErrorState } from '../ui/EmptyState';
import { useSession } from '../../hooks/useSession';
import type { User } from '../../types/models';

interface NamePickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (user: User) => void;
  title?: string;
}

/** 조교 이름 선택 모달 (v1 사용자는 전원 조교) */
export function NamePickerModal({
  open,
  onClose,
  onSelect,
  title = '이름을 선택해 주세요',
}: NamePickerModalProps) {
  const { users, usersLoading, usersError, selectIdentity } = useSession();

  const handleSelect = (u: User) => {
    selectIdentity(u.id);
    onSelect(u);
  };

  return (
    <Modal open={open} title={title} onClose={onClose}>
      {usersLoading && <Spinner label="명단을 불러오는 중..." />}
      {!usersLoading && usersError && <ErrorState />}
      {!usersLoading && !usersError && users.length === 0 && (
        <EmptyState message="등록된 조교가 없습니다." />
      )}
      {!usersLoading && !usersError && users.length > 0 && (
        <div className="name-list">
          {users.map((u) => (
            <button
              key={u.id}
              className="name-btn"
              onClick={() => handleSelect(u)}
            >
              <span>
                {u.name} {u.title}
              </span>
              <span className="name-btn__badge name-btn__badge--assistant">
                {u.title}
              </span>
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}
