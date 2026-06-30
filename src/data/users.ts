import { pb } from '../pb/client';
import type { User } from '../types/models';

/** 활성 조교 명단을 order 순으로 구독한다(변경 시 자동 갱신). */
export function subscribeUsers(
  onData: (users: User[]) => void,
  onError: (err: Error) => void,
): () => void {
  const load = () => {
    // 조교 명단은 'assistants' 컬렉션 (PocketBase 기본 'users' 와 구분하려고 이름을 다르게 씀)
    pb.collection('assistants')
      .getFullList<User>({ filter: 'active = true', sort: 'order' })
      .then(onData)
      .catch(onError);
  };

  load();

  const unsub = pb.collection('assistants').subscribe('*', () => load());

  return () => {
    unsub.then((fn) => fn()).catch(() => {});
  };
}

// ── 관리 화면용 (조교 추가/수정/삭제) ──

export interface AssistantInput {
  name: string;
  title: string;
  order: number;
  active: boolean;
}

/** 모든 조교(비활성 포함)을 order 순으로 — 관리 화면용 */
export async function getAllAssistants(): Promise<User[]> {
  return pb.collection('assistants').getFullList<User>({ sort: 'order' });
}

export async function createAssistant(input: AssistantInput): Promise<void> {
  await pb.collection('assistants').create(input);
}

export async function updateAssistant(
  id: string,
  patch: Partial<AssistantInput>,
): Promise<void> {
  await pb.collection('assistants').update(id, patch);
}

export async function deleteAssistant(id: string): Promise<void> {
  await pb.collection('assistants').delete(id);
}
