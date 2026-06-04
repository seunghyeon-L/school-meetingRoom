export const OPEN_HOUR = 8;
export const CLOSE_HOUR = 22;
export const SLOT_MIN = 30;

/** 하루 슬롯 개수: (22-8) * 2 = 28 */
export const SLOT_COUNT = (CLOSE_HOUR - OPEN_HOUR) * (60 / SLOT_MIN);

export const KST_TZ = 'Asia/Seoul';

export const LOCALE = 'ko';

/** localStorage 에 선택한 신분(사용자 id) 저장 키 */
export const SESSION_USER_KEY = 'session.userId';

/** 요일 라벨 (월~일) */
export const WEEKDAY_LABELS_KO = ['월', '화', '수', '목', '금', '토', '일'] as const;

/** 요일 라벨 (일~토) — 월 달력(일요일 시작)용 */
export const WEEKDAY_LABELS_SUN = ['일', '월', '화', '수', '목', '금', '토'] as const;
