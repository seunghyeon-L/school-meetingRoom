import { useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import type {
  Reservation,
  ReservationInput,
  Room,
} from '../../types/models';
import { Modal } from '../ui/Modal';
import { BigButton } from '../ui/BigButton';
import { DatePicker } from '../ui/DatePicker';
import { CalendarPanel } from '../ui/CalendarPanel';
import { TimeListPanel } from '../ui/TimeListPanel';
import { useSession } from '../../hooks/useSession';
import {
  checkConflict,
  createReservation,
  createReservations,
  deleteReservation,
  deleteReservationGroup,
  findConflictsAcrossDates,
  updateReservation,
  type DateConflict,
} from '../../data/reservations';
import { rangeLabel, slotToLabel, slotToLabel12 } from '../../lib/time';
import { addDays, monthDayLabel, weekdayLabel } from '../../lib/dateKey';
import { SLOT_COUNT, WEEKDAY_LABELS_SUN } from '../../lib/constants';
import {
  MAX_COUNT,
  MAX_INSTANCES,
  MAX_INTERVAL,
  REPEAT_OPTIONS,
  expandRecurrence,
  type EndMode,
  type RepeatKind,
} from '../../lib/recurrence';

interface ReservationDialogProps {
  open: boolean;
  rooms: Room[];
  /** 편집 대상(없으면 새 예약) */
  reservation: Reservation | null;
  defaultDate: string;
  defaultRoomId?: string;
  onClose: () => void;
  onSaved: () => void;
}

type Phase = 'form' | 'conflict' | 'deleting';
type ActivePicker = 'none' | 'date' | 'date-end' | 'start' | 'end';

const START_SLOTS = Array.from({ length: SLOT_COUNT }, (_, i) => i);

/** 'YYYY-MM-DD' -> 'M/D' 짧은 표기 */
function shortDate(date: string): string {
  const [, m, d] = date.split('-');
  return `${Number(m)}/${Number(d)}`;
}

/** 간격 단위 라벨 */
function intervalUnit(kind: RepeatKind): string {
  return kind === 'weekly' ? '주마다' : kind === 'monthly' ? '개월마다' : '일마다';
}

export function ReservationDialog({
  open,
  rooms,
  reservation,
  defaultDate,
  defaultRoomId,
  onClose,
  onSaved,
}: ReservationDialogProps) {
  const { user } = useSession();
  const isEdit = reservation !== null;

  const [roomId, setRoomId] = useState('');
  const [date, setDate] = useState(defaultDate);
  /** 기간(여러 날) 예약의 종료 날짜. date 와 같으면 하루 예약 */
  const [endDate, setEndDate] = useState(defaultDate);
  const [bookedFor, setBookedFor] = useState('');
  const [purpose, setPurpose] = useState('');
  const [startSlot, setStartSlot] = useState(0);
  const [endSlot, setEndSlot] = useState(1);
  const [allDay, setAllDay] = useState(false);
  /** 카드 안에서 펼쳐진 선택기 (날짜/시작/종료) */
  const [activePicker, setActivePicker] = useState<ActivePicker>('none');
  const dtRef = useRef<HTMLDivElement>(null);

  // 반복 규칙
  const [repeat, setRepeat] = useState<RepeatKind>('none');
  const [repeatEvery, setRepeatEvery] = useState(1);
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [endMode, setEndMode] = useState<EndMode>('count');
  const [count, setCount] = useState(10);
  const [until, setUntil] = useState(defaultDate);

  const [phase, setPhase] = useState<Phase>('form');
  const [conflicts, setConflicts] = useState<Reservation[]>([]);
  const [dateConflicts, setDateConflicts] = useState<DateConflict[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 다이얼로그가 열릴 때 초기값 세팅
  useEffect(() => {
    if (!open) return;
    if (reservation) {
      setRoomId(reservation.roomId);
      setDate(reservation.date);
      setEndDate(reservation.date);
      setBookedFor(reservation.bookedFor);
      setPurpose(reservation.purpose ?? '');
      setStartSlot(reservation.startSlot);
      setEndSlot(reservation.endSlot);
      setAllDay(
        reservation.startSlot === 0 && reservation.endSlot === SLOT_COUNT,
      );
    } else {
      setRoomId(defaultRoomId ?? rooms[0]?.id ?? '');
      setDate(defaultDate);
      setEndDate(defaultDate);
      setBookedFor('');
      setPurpose('');
      setStartSlot(0);
      setEndSlot(1);
      setAllDay(false);
    }
    setActivePicker('none');
    setRepeat('none');
    setRepeatEvery(1);
    setWeekdays([]);
    setEndMode('count');
    setCount(10);
    setUntil(defaultDate);
    setPhase('form');
    setConflicts([]);
    setDateConflicts([]);
    setErrorMsg(null);
    setSubmitting(false);
  }, [open, reservation, defaultDate, defaultRoomId, rooms]);

  const endOptions = useMemo(() => {
    const opts: number[] = [];
    for (let s = startSlot + 1; s <= SLOT_COUNT; s++) opts.push(s);
    return opts;
  }, [startSlot]);

  // '하루 종일'이면 운영시간 전체(08:00~22:00)로 예약
  const effStart = allDay ? 0 : startSlot;
  const effEnd = allDay ? SLOT_COUNT : endSlot;
  const timeValid = allDay || endSlot > startSlot;

  // 카드 선택기: 바깥 클릭 시 닫기
  useEffect(() => {
    if (activePicker === 'none') return;
    const onDown = (e: MouseEvent) => {
      if (dtRef.current && !dtRef.current.contains(e.target as Node)) {
        setActivePicker('none');
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [activePicker]);

  // 카드 선택기: Escape는 선택기만 닫고 Modal까지 전파되지 않게 캡처 단계에서 가로챔
  useEffect(() => {
    if (activePicker === 'none') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setActivePicker('none');
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [activePicker]);

  // 생성 시: 반복 규칙으로 펼친 실제 예약 날짜 목록
  const expand = useMemo(
    () =>
      expandRecurrence({
        date,
        kind: repeat,
        interval: repeatEvery,
        weekdays,
        endMode,
        count,
        until,
      }),
    [date, repeat, repeatEvery, weekdays, endMode, count, until],
  );
  // 종료 날짜가 시작보다 뒤면 '기간(여러 날)' 예약으로 본다.
  const isRange = !isEdit && endDate > date;
  // 시작~종료(포함) 연속 날짜 목록. MAX_INSTANCES 로 상한을 둔다.
  const rangeDates = useMemo(() => {
    const out: string[] = [];
    let cur = date;
    for (let i = 0; i < MAX_INSTANCES && cur <= endDate; i++) {
      out.push(cur);
      cur = addDays(cur, 1);
    }
    return out;
  }, [date, endDate]);

  // 실제로 만들 날짜: 편집=그 하루 / 기간=연속 범위 / 그 외=반복 펼침
  const bookDates = isEdit ? [date] : isRange ? rangeDates : expand.dates;
  const bookTruncated = isRange
    ? rangeDates.length >= MAX_INSTANCES &&
      rangeDates[rangeDates.length - 1] < endDate
    : !isEdit && expand.truncated;
  const instanceCount = bookDates.length;

  const handleDateChange = (v: string) => {
    setDate(v);
    // 시작이 종료보다 뒤로 가면 종료도 같이 당겨 항상 시작 ≤ 종료 유지
    if (endDate < v) setEndDate(v);
    if (endMode === 'until' && until < v) setUntil(v);
  };

  const handleEndDateChange = (v: string) => {
    setEndDate(v);
    // 여러 날(범위)을 고르면 '반복'과 겹치지 않게 반복은 끈다
    if (v > date) setRepeat('none');
  };

  const handleRepeatChange = (k: RepeatKind) => {
    setRepeat(k);
    if (k === 'weekly' && weekdays.length === 0) {
      setWeekdays([dayjs(date).day()]);
    }
  };

  const toggleWeekday = (i: number) => {
    setWeekdays((prev) => {
      if (prev.includes(i)) {
        if (prev.length === 1) return prev; // 최소 1개 유지
        return prev.filter((x) => x !== i);
      }
      return [...prev, i].sort((a, b) => a - b);
    });
  };

  const handleEndModeChange = (m: EndMode) => {
    setEndMode(m);
    if (m === 'until' && until <= date) {
      setUntil(dayjs(date).add(1, 'month').format('YYYY-MM-DD'));
    }
  };

  const onNum =
    (setter: (n: number) => void, max: number) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const n = Math.floor(Number(e.target.value));
      setter(!Number.isFinite(n) || n < 1 ? 1 : Math.min(n, max));
    };

  const handleStartChange = (v: number) => {
    setStartSlot(v);
    if (endSlot <= v) setEndSlot(v + 1);
  };

  /** 같은 선택기를 다시 누르면 닫고, 다르면 그 선택기를 펼친다 */
  const openPicker = (k: Exclude<ActivePicker, 'none'>) =>
    setActivePicker((prev) => (prev === k ? 'none' : k));

  const toggleAllDay = () => {
    setAllDay((v) => {
      const next = !v;
      // 종일로 켜면 시간 선택기는 닫는다
      if (next) {
        setActivePicker((p) => (p === 'start' || p === 'end' ? 'none' : p));
      }
      return next;
    });
  };

  const baseValid =
    roomId !== '' &&
    bookedFor.trim().length > 0 &&
    timeValid &&
    !submitting;
  const canSubmit = isEdit
    ? baseValid && !!date
    : baseValid && instanceCount > 0 && !bookTruncated;

  const roomName = rooms.find((r) => r.id === roomId)?.name ?? '';

  const persistEdit = async () => {
    if (!reservation) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const payload: Partial<ReservationInput> = {
        roomId,
        date,
        startSlot: effStart,
        endSlot: effEnd,
        startLabel: slotToLabel(effStart),
        endLabel: slotToLabel(effEnd),
        bookedFor: bookedFor.trim(),
        purpose: purpose.trim(),
      };
      await updateReservation(reservation.id, payload);
      onSaved();
    } catch (err) {
      console.error(err);
      setErrorMsg('저장에 실패했습니다. 잠시 후 다시 시도해 주세요.');
      setSubmitting(false);
    }
  };

  const persistCreate = async (datesToBook: string[]) => {
    if (!user) {
      setErrorMsg('조교 이름을 먼저 선택해 주세요.');
      return;
    }
    if (datesToBook.length === 0) {
      setErrorMsg('예약할 날짜가 없습니다.');
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const trimmedPurpose = purpose.trim();
      const groupId = datesToBook.length > 1 ? crypto.randomUUID() : null;
      const base = {
        roomId,
        startSlot: effStart,
        endSlot: effEnd,
        startLabel: slotToLabel(effStart),
        endLabel: slotToLabel(effEnd),
        bookedFor: bookedFor.trim(),
        createdByUid: user.id,
        createdByName: user.name,
      };
      const inputs: ReservationInput[] = datesToBook.map((d) => {
        const input: ReservationInput = { ...base, date: d };
        if (trimmedPurpose) input.purpose = trimmedPurpose;
        if (groupId) input.groupId = groupId;
        return input;
      });
      if (inputs.length === 1) await createReservation(inputs[0]);
      else await createReservations(inputs);
      onSaved();
    } catch (err) {
      console.error(err);
      setErrorMsg('저장에 실패했습니다. 잠시 후 다시 시도해 주세요.');
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      if (isEdit && reservation) {
        const found = await checkConflict(
          roomId,
          date,
          effStart,
          effEnd,
          reservation.id,
        );
        if (found.length > 0) {
          setConflicts(found);
          setPhase('conflict');
          setSubmitting(false);
          return;
        }
        await persistEdit();
      } else {
        const dc = await findConflictsAcrossDates(
          roomId,
          bookDates,
          effStart,
          effEnd,
        );
        if (dc.length > 0) {
          setDateConflicts(dc);
          setPhase('conflict');
          setSubmitting(false);
          return;
        }
        await persistCreate(bookDates);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('예약 확인 중 오류가 발생했습니다. 다시 시도해 주세요.');
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!reservation) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await deleteReservation(reservation.id);
      onSaved();
    } catch (err) {
      console.error(err);
      setErrorMsg('삭제에 실패했습니다. 다시 시도해 주세요.');
      setSubmitting(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!reservation?.groupId) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await deleteReservationGroup(reservation.groupId);
      onSaved();
    } catch (err) {
      console.error(err);
      setErrorMsg('삭제에 실패했습니다. 다시 시도해 주세요.');
      setSubmitting(false);
    }
  };

  if (!open) return null;

  // 생성 시 충돌나지 않는 날짜(충돌 제외 예약용)
  const conflictDateSet = new Set(dateConflicts.map((d) => d.date));
  const nonConflictDates = bookDates.filter((d) => !conflictDateSet.has(d));

  const countWarning = !isEdit && (bookTruncated || instanceCount === 0);
  const countHint = isEdit
    ? null
    : bookTruncated
      ? `최대 ${MAX_INSTANCES}개 날짜까지만 만들 수 있어요. 기간이나 횟수를 줄여주세요.`
      : instanceCount === 0
        ? '날짜를 확인해주세요.'
        : instanceCount === 1
          ? '하루만 예약됩니다.'
          : `${instanceCount}개 날짜에 같은 시간으로 예약됩니다. (${shortDate(
              bookDates[0],
            )} ~ ${shortDate(bookDates[instanceCount - 1])})`;

  return (
    <Modal open={open} title={isEdit ? '예약 수정' : '새 예약'} onClose={onClose}>
      {errorMsg && <div className="error-state">{errorMsg}</div>}

      {phase === 'conflict' ? (
        isEdit ? (
          <div>
            <p>
              <strong>겹치는 예약이 있습니다.</strong> 그래도 저장할까요?
            </p>
            <ul className="conflict-list">
              {conflicts.map((c) => (
                <li key={c.id}>
                  {rangeLabel(c.startSlot, c.endSlot)} · {c.bookedFor}
                  {c.purpose ? ` (${c.purpose})` : ''}
                </li>
              ))}
            </ul>
            <div className="modal__actions">
              <BigButton
                variant="ghost"
                onClick={() => setPhase('form')}
                disabled={submitting}
              >
                뒤로
              </BigButton>
              <BigButton
                variant="danger"
                onClick={persistEdit}
                disabled={submitting}
              >
                {submitting ? '저장 중...' : '그래도 저장'}
              </BigButton>
            </div>
          </div>
        ) : (
          <div>
            <p>
              <strong>
                {dateConflicts.length}개 날짜에 겹치는 예약이 있습니다.
              </strong>
            </p>
            <ul className="conflict-list">
              {dateConflicts.map((d) => (
                <li key={d.date}>
                  <strong>{shortDate(d.date)}</strong>{' '}
                  {d.conflicts
                    .map(
                      (c) => `${rangeLabel(c.startSlot, c.endSlot)} ${c.bookedFor}`,
                    )
                    .join(', ')}
                </li>
              ))}
            </ul>
            <div className="modal__actions" style={{ flexWrap: 'wrap' }}>
              <BigButton
                variant="ghost"
                onClick={() => setPhase('form')}
                disabled={submitting}
              >
                뒤로
              </BigButton>
              {nonConflictDates.length > 0 && (
                <BigButton
                  onClick={() => persistCreate(nonConflictDates)}
                  disabled={submitting}
                >
                  {submitting
                    ? '저장 중...'
                    : `충돌 빼고 예약 (${nonConflictDates.length}개)`}
                </BigButton>
              )}
              <BigButton
                variant="danger"
                onClick={() => persistCreate(bookDates)}
                disabled={submitting}
              >
                {submitting ? '저장 중...' : '그래도 전체 예약'}
              </BigButton>
            </div>
          </div>
        )
      ) : phase === 'deleting' ? (
        <div>
          <p>이 예약을 정말 취소(삭제)할까요?</p>
          <p>
            <strong>
              {roomName} · {allDay ? '하루 종일' : rangeLabel(startSlot, endSlot)}{' '}
              · {bookedFor}
            </strong>
            {purpose ? ` (${purpose})` : ''}
          </p>
          {reservation?.groupId ? (
            <>
              <p className="hint">이 예약은 반복(다일) 묶음의 하루입니다.</p>
              <div className="modal__actions" style={{ flexWrap: 'wrap' }}>
                <BigButton
                  variant="ghost"
                  onClick={() => setPhase('form')}
                  disabled={submitting}
                >
                  닫기
                </BigButton>
                <BigButton
                  variant="danger"
                  onClick={handleDelete}
                  disabled={submitting}
                >
                  {submitting ? '삭제 중...' : '이 날짜만 삭제'}
                </BigButton>
                <BigButton
                  variant="danger"
                  onClick={handleDeleteGroup}
                  disabled={submitting}
                >
                  {submitting ? '삭제 중...' : '반복 전체 삭제'}
                </BigButton>
              </div>
            </>
          ) : (
            <div className="modal__actions">
              <BigButton
                variant="ghost"
                onClick={() => setPhase('form')}
                disabled={submitting}
              >
                닫기
              </BigButton>
              <BigButton
                variant="danger"
                onClick={handleDelete}
                disabled={submitting}
              >
                {submitting ? '삭제 중...' : '예약 취소'}
              </BigButton>
            </div>
          )}
        </div>
      ) : (
        <div className="center-col">
          <div className="field">
            <label htmlFor="rd-room">회의실</label>
            <select
              id="rd-room"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="rd-for">누가 (예약자)</label>
            <input
              id="rd-for"
              type="text"
              value={bookedFor}
              maxLength={40}
              placeholder="예: 홍길동 교수님"
              onChange={(e) => setBookedFor(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="rd-purpose">용도 (선택)</label>
            <input
              id="rd-purpose"
              type="text"
              value={purpose}
              maxLength={80}
              placeholder="예: 학과 세미나, 논문 심사"
              onChange={(e) => setPurpose(e.target.value)}
            />
          </div>

          <div className="field">
            <label>날짜 · 시간</label>
            <div className="dtcard" ref={dtRef}>
              <button
                type="button"
                role="switch"
                aria-checked={allDay}
                className={`allday ${allDay ? 'is-on' : ''}`}
                onClick={toggleAllDay}
              >
                <span className="allday__label">
                  <span className="allday__clock" aria-hidden="true">
                    🕗
                  </span>
                  하루 종일
                </span>
                <span className="allday__switch" aria-hidden="true">
                  <span className="allday__knob" />
                </span>
              </button>

              <div className="dtrange">
                <div className="dtrange__col">
                  <button
                    type="button"
                    id="rd-date"
                    className={`dtcell dtcell--date ${
                      activePicker === 'date' ? 'is-active' : ''
                    }`}
                    onClick={() => openPicker('date')}
                  >
                    {monthDayLabel(date)} ({weekdayLabel(date)})
                  </button>
                  {allDay ? (
                    <span className="dtcell dtcell--allday">종일</span>
                  ) : (
                    <button
                      type="button"
                      id="rd-start"
                      className={`dtcell dtcell--time ${
                        activePicker === 'start' ? 'is-active' : ''
                      }`}
                      onClick={() => openPicker('start')}
                    >
                      {slotToLabel12(startSlot)}
                    </button>
                  )}
                </div>

                <div className="dtrange__arrow" aria-hidden="true">
                  →
                </div>

                <div className="dtrange__col">
                  <button
                    type="button"
                    id="rd-date-end"
                    className={`dtcell dtcell--date ${
                      activePicker === (isEdit ? 'date' : 'date-end')
                        ? 'is-active'
                        : ''
                    }`}
                    onClick={() => openPicker(isEdit ? 'date' : 'date-end')}
                  >
                    {monthDayLabel(isEdit ? date : endDate)} (
                    {weekdayLabel(isEdit ? date : endDate)})
                  </button>
                  {allDay ? (
                    <span className="dtcell dtcell--allday">종일</span>
                  ) : (
                    <button
                      type="button"
                      id="rd-end"
                      className={`dtcell dtcell--time ${
                        activePicker === 'end' ? 'is-active' : ''
                      }`}
                      onClick={() => openPicker('end')}
                    >
                      {slotToLabel12(endSlot)}
                    </button>
                  )}
                </div>
              </div>

              {activePicker === 'date' && (
                <div className="dtpanel">
                  <CalendarPanel
                    key="date"
                    value={date}
                    onPick={(d) => {
                      handleDateChange(d);
                      setActivePicker('none');
                    }}
                  />
                </div>
              )}
              {activePicker === 'date-end' && !isEdit && (
                <div className="dtpanel">
                  <CalendarPanel
                    key="date-end"
                    value={endDate}
                    min={date}
                    onPick={(d) => {
                      handleEndDateChange(d);
                      setActivePicker('none');
                    }}
                  />
                </div>
              )}
              {activePicker === 'start' && !allDay && (
                <div className="dtpanel">
                  <TimeListPanel
                    value={startSlot}
                    options={START_SLOTS}
                    onPick={(s) => {
                      handleStartChange(s);
                      setActivePicker('none');
                    }}
                  />
                </div>
              )}
              {activePicker === 'end' && !allDay && (
                <div className="dtpanel">
                  <TimeListPanel
                    value={endSlot}
                    options={endOptions}
                    onPick={(s) => {
                      setEndSlot(s);
                      setActivePicker('none');
                    }}
                  />
                </div>
              )}

              {allDay && (
                <p className="dtcard__note">
                  오전 8:00 ~ 오후 10:00 · 운영시간 전체
                </p>
              )}
            </div>
          </div>

          {!isEdit && !isRange && (
            <>
              <div className="field">
                <label htmlFor="rd-repeat">반복</label>
                <select
                  id="rd-repeat"
                  value={repeat}
                  onChange={(e) =>
                    handleRepeatChange(e.target.value as RepeatKind)
                  }
                >
                  {REPEAT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              {repeat !== 'none' && (
                <div className="repeat-detail">
                  <div className="field">
                    <label htmlFor="rd-interval">반복 간격</label>
                    <div className="row" style={{ gap: 'var(--space-sm)' }}>
                      <input
                        id="rd-interval"
                        type="number"
                        min={1}
                        max={MAX_INTERVAL}
                        value={repeatEvery}
                        onChange={onNum(setRepeatEvery, MAX_INTERVAL)}
                        style={{ width: 96 }}
                      />
                      <span className="repeat-detail__unit">
                        {intervalUnit(repeat)}
                      </span>
                    </div>
                  </div>

                  {repeat === 'weekly' && (
                    <div className="field">
                      <label>반복 요일</label>
                      <div
                        className="wd-toggle"
                        role="group"
                        aria-label="반복 요일 선택"
                      >
                        {WEEKDAY_LABELS_SUN.map((w, i) => {
                          const on = weekdays.includes(i);
                          return (
                            <button
                              key={w}
                              type="button"
                              className={[
                                'wd-toggle__day',
                                on ? 'is-on' : '',
                                i === 0 ? 'wd-toggle__day--sun' : '',
                                i === 6 ? 'wd-toggle__day--sat' : '',
                              ]
                                .filter(Boolean)
                                .join(' ')}
                              aria-pressed={on}
                              onClick={() => toggleWeekday(i)}
                            >
                              {w}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="field">
                    <label>종료</label>
                    <div className="seg" role="group" aria-label="반복 종료 방식">
                      <button
                        type="button"
                        className={`seg__btn ${endMode === 'count' ? 'is-on' : ''}`}
                        aria-pressed={endMode === 'count'}
                        onClick={() => handleEndModeChange('count')}
                      >
                        총 횟수
                      </button>
                      <button
                        type="button"
                        className={`seg__btn ${endMode === 'until' ? 'is-on' : ''}`}
                        aria-pressed={endMode === 'until'}
                        onClick={() => handleEndModeChange('until')}
                      >
                        종료 날짜
                      </button>
                    </div>
                  </div>

                  {endMode === 'count' ? (
                    <div className="field">
                      <label htmlFor="rd-count">총 횟수</label>
                      <div className="row" style={{ gap: 'var(--space-sm)' }}>
                        <span>총</span>
                        <input
                          id="rd-count"
                          type="number"
                          min={1}
                          max={MAX_COUNT}
                          value={count}
                          onChange={onNum(setCount, MAX_COUNT)}
                          style={{ width: 96 }}
                        />
                        <span>번</span>
                      </div>
                    </div>
                  ) : (
                    <div className="field">
                      <label htmlFor="rd-until">종료 날짜</label>
                      <DatePicker
                        id="rd-until"
                        value={until}
                        min={date}
                        onChange={setUntil}
                        ariaLabel="반복 종료 날짜 선택"
                      />
                    </div>
                  )}
                </div>
              )}

            </>
          )}

          {!isEdit && countHint && (
            <p
              className="hint"
              style={countWarning ? { color: 'var(--color-danger)' } : undefined}
            >
              {countHint}
            </p>
          )}

          <div className="modal__actions">
            {isEdit ? (
              <BigButton
                variant="danger"
                onClick={() => setPhase('deleting')}
                disabled={submitting}
              >
                삭제
              </BigButton>
            ) : (
              <BigButton variant="ghost" onClick={onClose} disabled={submitting}>
                취소
              </BigButton>
            )}
            <BigButton onClick={handleSubmit} disabled={!canSubmit}>
              {submitting ? '확인 중...' : isEdit ? '수정 저장' : '예약하기'}
            </BigButton>
          </div>
        </div>
      )}
    </Modal>
  );
}
