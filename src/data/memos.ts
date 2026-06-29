import { pb } from '../pb/client';
import type { Memo, MemoInput } from '../types/models';

/** 공유 메모 실시간 구독 (최신순). 변화가 생기면 다시 불러온다. */
export function subscribeMemos(
  onData: (rows: Memo[]) => void,
  onError: (err: Error) => void,
): () => void {
  const load = () => {
    pb.collection('memos')
      .getFullList<Memo>({ sort: '-created' })
      .then(onData)
      .catch(onError);
  };

  load();

  const unsub = pb.collection('memos').subscribe('*', () => load());

  return () => {
    unsub.then((fn) => fn()).catch(() => {});
  };
}

/** 메모 작성 */
export async function createMemo(input: MemoInput): Promise<string> {
  const rec = await pb.collection('memos').create<Memo>(input);
  return rec.id;
}

/** 메모 삭제 */
export async function deleteMemo(id: string): Promise<void> {
  await pb.collection('memos').delete(id);
}
