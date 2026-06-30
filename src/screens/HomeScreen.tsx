import { useMemo, useState } from 'react';
import { Screen } from '../components/layout/Screen';
import { Spinner } from '../components/ui/Spinner';
import { ErrorState } from '../components/ui/EmptyState';
import {
  MonthCalendar,
  type CalendarView,
} from '../components/calendar/MonthCalendar';
import { DayPanel } from '../components/calendar/DayPanel';
import { ReservationDialog } from '../components/booking/ReservationDialog';
import { MemoPanel } from '../components/memo/MemoPanel';
import { useRooms } from '../hooks/useRooms';
import { useReservationsRange } from '../hooks/useReservationsByMonth';
import { buildRoomColorMap } from '../lib/roomColor';
import {
  addDays,
  addMonths,
  isSameMonth,
  monthDayLabel,
  monthGridWeeks,
  monthLabel,
  sundayIndex,
  todayKey,
} from '../lib/dateKey';
import type { Reservation } from '../types/models';

export default function HomeScreen() {
  const today = todayKey();
  const [view, setView] = useState<CalendarView>('month');
  /** 포커스 날짜 — 월/2주 범위 계산의 기준 */
  const [anchor, setAnchor] = useState(today);
  const [selectedDate, setSelectedDate] = useState(today);
  /** 방 필터 (null = 전체). 선택 시 그 방 예약만 보임 */
  const [roomFilter, setRoomFilter] = useState<string | null>(null);

  const { rooms, loading: roomsLoading, error: roomsError } = useRooms();

  // 보기 모드에 따라 표시할 날짜들 + 데이터 범위 + 제목 계산
  const { days, rangeStart, rangeEnd, title } = useMemo(() => {
    if (view === 'biweek') {
      const start = addDays(anchor, -sundayIndex(anchor)); // 그 주의 일요일
      const ds = Array.from({ length: 14 }, (_, i) => addDays(start, i));
      return {
        days: ds,
        rangeStart: ds[0],
        rangeEnd: ds[13],
        title: `${monthDayLabel(ds[0])} ~ ${monthDayLabel(ds[13])}`,
      };
    }
    const ds = monthGridWeeks(anchor).flat();
    return {
      days: ds,
      rangeStart: ds[0],
      rangeEnd: ds[ds.length - 1],
      title: monthLabel(anchor),
    };
  }, [view, anchor]);

  const { byDate, error: resvError } = useReservationsRange(rangeStart, rangeEnd);

  const roomColors = useMemo(
    () => buildRoomColorMap(rooms.map((r) => r.id)),
    [rooms],
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Reservation | null>(null);
  const [presetRoomId, setPresetRoomId] = useState<string | undefined>(
    undefined,
  );

  const selectDate = (d: string) => {
    setSelectedDate(d);
    // 월 보기에서 다른 달 날짜를 누르면 그 달로 이동
    if (view === 'month' && !isSameMonth(d, anchor)) setAnchor(d);
  };

  const goPrev = () =>
    setAnchor((a) => (view === 'biweek' ? addDays(a, -14) : addMonths(a, -1)));
  const goNext = () =>
    setAnchor((a) => (view === 'biweek' ? addDays(a, 14) : addMonths(a, 1)));
  const goToday = () => {
    setAnchor(today);
    setSelectedDate(today);
  };

  const openCreate = (roomId?: string) => {
    setEditing(null);
    setPresetRoomId(roomId);
    setDialogOpen(true);
  };

  // 달력에서 날짜 더블클릭 → 그 날짜로 새 예약
  const openCreateOnDate = (d: string) => {
    selectDate(d);
    setEditing(null);
    setPresetRoomId(undefined);
    setDialogOpen(true);
  };

  const openEdit = (r: Reservation) => {
    setEditing(r);
    setPresetRoomId(undefined);
    setDialogOpen(true);
  };

  const dayReservations = (byDate[selectedDate] ?? []).filter(
    (r) => roomFilter === null || r.roomId === roomFilter,
  );

  return (
    <Screen>
      {roomsError || resvError ? (
        <ErrorState />
      ) : roomsLoading ? (
        <Spinner label="불러오는 중..." />
      ) : (
        <div className="home-layout">
          <section className="home-layout__cal">
            <MonthCalendar
              days={days}
              title={title}
              view={view}
              dimMonth={view === 'month' ? anchor : undefined}
              byDate={byDate}
              rooms={rooms}
              roomColors={roomColors}
              selectedDate={selectedDate}
              onSelectDate={selectDate}
              onAddOnDate={openCreateOnDate}
              onPrev={goPrev}
              onNext={goNext}
              onToday={goToday}
              onViewChange={setView}
              roomFilter={roomFilter}
              onRoomFilterChange={setRoomFilter}
            />
          </section>
          <aside className="home-layout__panel">
            <DayPanel
              date={selectedDate}
              rooms={rooms}
              roomColors={roomColors}
              dayReservations={dayReservations}
              onAdd={openCreate}
              onEdit={openEdit}
            />
            <MemoPanel />
          </aside>
        </div>
      )}

      <ReservationDialog
        open={dialogOpen}
        rooms={rooms}
        reservation={editing}
        defaultDate={selectedDate}
        defaultRoomId={presetRoomId}
        onClose={() => setDialogOpen(false)}
        onSaved={() => setDialogOpen(false)}
      />
    </Screen>
  );
}
