import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { User } from '../types/models';

const usersCol = collection(db, 'users');

/** 활성 사용자(명단)를 order 순으로 구독 */
export function subscribeUsers(
  onData: (users: User[]) => void,
  onError: (err: Error) => void,
): Unsubscribe {
  const q = query(usersCol, where('active', '==', true), orderBy('order', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      const users: User[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<User, 'id'>),
      }));
      onData(users);
    },
    (err) => onError(err),
  );
}
