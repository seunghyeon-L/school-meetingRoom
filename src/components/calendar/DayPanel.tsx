import { useMemo } from 'react';
import type { Reservation, Room } from '../../types/models';
import { colorFor, type RoomColor } from '../../lib/roomColor';
import { fullDateLabel } from '../../lib/dateKey';
import { rangeLabel } from '../../lib/time';
import { BigButton } from '../ui/BigButton';

interface DayPanelProps {
  date: string;
  rooms: Room[];
  roomColors: Map<string, RoomColor>;
  /** 선택한 날짜의 예약(전체 회의실) */
  dayReservations: Reservation[];
  onAdd: (roomId?: string) => void;
  onEdit: (r: Reservation) => void;
}

export function DayPanel({
  date,
  rooms,
  roomColors,
  dayReservations,
  onAdd,
  onEdit,
}: DayPanelProps) {
  const byRoom = useMemo(() => {
    const m = new Map<string, Reservation[]>();
    for (const r of dayReservations) {
      const list = m.get(r.roomId);
      if (list) list.push(r);
      else m.set(r.roomId, [r]);
    }
    for (const list of m.values()) list.sort((a, b) => a.startSlot - b.startSlot);
    return m;
  }, [dayReservations]);

  return (
    <div className="daypanel">
      <div className="daypanel__date">{fullDateLabel(date)}</div>
      <BigButton size="sm" onClick={() => onAdd()}>
        + 예약 추가
      </BigButton>

      {rooms.map((room) => {
        const c = colorFor(roomColors, room.id);
        const list = byRoom.get(room.id) ?? [];
        return (
          <div key={room.id} className="daypanel__room">
            <div className="daypanel__room-head">
              <span
                className="daypanel__dot"
                style={{ background: c.bar }}
                aria-hidden="true"
              />
              <span className="daypanel__room-name">{room.name}</span>
              <button
                className="daypanel__add-mini"
                aria-label={`${room.name} 예약 추가`}
                onClick={() => onAdd(room.id)}
              >
                +
              </button>
            </div>
            {list.length === 0 ? (
              <div className="daypanel__empty">예약 없음</div>
            ) : (
              list.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className="daypanel__resv"
                  style={{ borderLeftColor: c.bar }}
                  onClick={() => onEdit(r)}
                >
                  <span className="daypanel__resv-time">
                    {rangeLabel(r.startSlot, r.endSlot)}
                    {r.groupId ? (
                      <span title="반복(다일) 예약" aria-label="반복 예약">
                        {' '}
                        ↻
                      </span>
                    ) : null}
                  </span>
                  <span className="daypanel__resv-for">
                    {r.bookedFor}
                    {r.purpose ? ` · ${r.purpose}` : ''}
                  </span>
                </button>
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}
