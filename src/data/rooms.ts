import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Room } from '../types/models';

const roomsCol = collection(db, 'rooms');

/** 활성 회의실 목록을 order 순으로 구독 */
export function subscribeRooms(
  onData: (rooms: Room[]) => void,
  onError: (err: Error) => void,
): Unsubscribe {
  const q = query(roomsCol, where('active', '==', true), orderBy('order', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      const rooms: Room[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Room, 'id'>),
      }));
      onData(rooms);
    },
    (err) => onError(err),
  );
}
