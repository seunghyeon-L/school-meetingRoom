import { pb } from '../pb/client';
import type { Room } from '../types/models';

/** 활성 회의실을 order 순으로 구독한다(변경 시 자동 갱신). */
export function subscribeRooms(
  onData: (rooms: Room[]) => void,
  onError: (err: Error) => void,
): () => void {
  const load = () => {
    pb.collection('rooms')
      .getFullList<Room>({ filter: 'active = true', sort: 'order' })
      .then(onData)
      .catch(onError);
  };

  load(); // 처음 한 번 불러오기

  // 실시간: rooms 에 변화(추가/수정/삭제)가 생기면 다시 불러온다.
  const unsub = pb.collection('rooms').subscribe('*', () => load());

  // 정리(구독 해제) 함수 반환
  return () => {
    unsub.then((fn) => fn()).catch(() => {});
  };
}

// ── 관리 화면용 (방 추가/수정/삭제) ──

export interface RoomInput {
  name: string;
  order: number;
  active: boolean;
}

/** 모든 방(비활성 포함)을 order 순으로 — 관리 화면용 */
export async function getAllRooms(): Promise<Room[]> {
  return pb.collection('rooms').getFullList<Room>({ sort: 'order' });
}

export async function createRoom(input: RoomInput): Promise<void> {
  await pb.collection('rooms').create(input);
}

export async function updateRoom(
  id: string,
  patch: Partial<RoomInput>,
): Promise<void> {
  await pb.collection('rooms').update(id, patch);
}

export async function deleteRoom(id: string): Promise<void> {
  await pb.collection('rooms').delete(id);
}
