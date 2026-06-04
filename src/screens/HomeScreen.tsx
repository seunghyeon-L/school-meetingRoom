import { useMemo, useState } from 'react';
import { Screen } from '../components/layout/Screen';
import { Spinner } from '../components/ui/Spinner';
import { ErrorState } from '../components/ui/EmptyState';
import { MonthCalendar } from '../components/calendar/MonthCalendar';
import { DayPanel } from '../components/calendar/DayPanel';
import { ReservationDialog } from '../components/booking/ReservationDialog';
import { useRooms } from '../hooks/useRooms';
import { useReservationsByMonth } from '../hooks/useReservationsByMonth';
import { buildRoomColorMap } from '../lib/roomColor';
import { addMonths, isSameMonth, startOfMonth, todayKey } from '../lib/dateKey';
import type { Reservation } from '../types/models';

export default function HomeScreen() {
  const today = todayKey();
  const [monthAnchor, setMonthAnchor] = useState(() => startOfMonth(today));
  const [selectedDate, setSelectedDate] = useState(today);

  const { rooms, loading: roomsLoading, error: roomsError } = useRooms();
  const { byDate, error: resvError } = useReservationsByMonth(monthAnchor);

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
    // 이전/다음 달 날짜를 누르면 그 달로 이동 (갤럭시 달력 동작)
    if (!isSameMonth(d, monthAnchor)) setMonthAnchor(startOfMonth(d));
  };

  const goToday = () => {
    setMonthAnchor(startOfMonth(today));
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

  const dayReservations = byDate[selectedDate] ?? [];

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
              monthAnchor={monthAnchor}
              byDate={byDate}
              rooms={rooms}
              roomColors={roomColors}
              selectedDate={selectedDate}
              onSelectDate={selectDate}
              onAddOnDate={openCreateOnDate}
              onPrevMonth={() => setMonthAnchor((m) => addMonths(m, -1))}
              onNextMonth={() => setMonthAnchor((m) => addMonths(m, 1))}
              onToday={goToday}
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
