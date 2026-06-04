# 제주대학교 회의실 예약 (PWA)

학과 회의실을 쉽고 빠르게 예약하는 모바일 우선 PWA입니다.
고령 사용자를 고려해 **큰 글씨 · 큰 버튼 · 간단한 단계**로 구성했습니다.

- **사용자**: 조교 2명 + 교수 N명
- **로그인**: 이름 선택만 (비밀번호 없음). 내부적으로 Firebase 익명 인증 사용.
- **예약 방식(하이브리드)**: 교수는 본인 예약을 직접, 조교는 누구의 예약이든 생성/수정/취소 가능.
- **회의실/사용자**는 데이터로 관리되어 확장 가능 (현재 회의실 2개).
- 모든 UI는 한국어.

## 화면 구성

1. **시작(Start)** — 앱 소개 + 시작하기
2. **이름 선택(NameSelect)** — 본인 이름 선택 (교수/조교 그룹)
3. **캘린더(Calendar)** — 메인 허브. 회의실 탭 + 주(월~일) 스트립 + 시간표(08:00~22:00, 30분 단위)
4. **예약 작성/수정(CreateReservation)** — 예약자·목적·시작/종료 시간 입력, 충돌 검사
5. **관리(Admin, 조교 전용)** — 날짜/회의실 필터 + 예약 목록 수정/취소, 대리 예약

## 데이터 모델 (Firestore)

- `rooms/{id}`: `{ name, order, active, capacity? }`
- `users/{id}`: `{ name, title, role('professor'|'assistant'), order, active }`
- `reservations/{id}`: `{ roomId, date('YYYY-MM-DD' KST), startSlot(0-27), endSlot(1-28), startLabel, endLabel, personUserId, personName, personTitle, purpose, createdByUid, createdByName, createdByRole, createdAt, updatedAt }`

시간 슬롯: `OPEN_HOUR=8`, `CLOSE_HOUR=22`, `SLOT_MIN=30` → 하루 28슬롯.
`slotIndex = (hour-8)*2 + (min===30?1:0)`. index 0 = `08:00` … 28 = `22:00`.

## 사전 준비 (Firebase 프로젝트)

1. [Firebase 콘솔](https://console.firebase.google.com)에서 프로젝트 생성.
2. **Authentication → 로그인 방법 → 익명(Anonymous)** 사용 설정.
3. **Firestore Database** 생성 (프로덕션 모드).
4. **App Check** → reCAPTCHA v3 등록 후 **사이트 키** 발급.
5. **Hosting** 사용 설정.
6. 웹 앱 등록 후 설정값을 복사.

## 환경 변수 설정

`.env.example` 를 복사해 `.env` 생성 후 값을 채웁니다.

```bash
cp .env.example .env
```

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_RECAPTCHA_SITE_KEY=...        # App Check (reCAPTCHA v3) 사이트 키
VITE_USE_EMULATOR=false            # 에뮬레이터 사용 시 true
```

> 플레이스홀더 값(`your-...`)이 남아 있어도 앱은 크래시하지 않고 셸이 렌더링됩니다.
> 실제 값이 모두 채워져야 Firestore/Auth/App Check 가 동작합니다.

## 설치

```bash
npm install
```

## 로컬 개발

### A) 실제 Firebase 사용

```bash
npm run dev
```

### B) 에뮬레이터 사용 (App Check 비활성화)

```bash
# 터미널 1: 에뮬레이터
npx firebase-tools emulators:start

# 터미널 2: .env 에서 VITE_USE_EMULATOR=true 로 설정 후
npm run dev
```

## 시드 데이터 (회의실 2 + 교수 2 + 조교 2)

스크립트는 자동 실행되지 않습니다. (`scripts/seedData.ts`)

### 에뮬레이터에 시드 (권장)

```powershell
$env:FIRESTORE_EMULATOR_HOST="127.0.0.1:8080"
$env:VITE_FIREBASE_PROJECT_ID="demo-project"
npx tsx scripts/seedData.ts
```

### 실제 프로젝트에 시드

`firestore.rules` 가 `rooms`/`users` 쓰기를 막으므로(클라이언트 불가),
다음 중 하나를 사용하세요.

- Firebase 콘솔에서 문서 수동 입력 (가장 간단), 또는
- Admin SDK / `gcloud` 로 입력, 또는
- 시드 시점에만 규칙을 임시 완화 후 원복.

시드 데이터:

- 회의실: `제1회의실`, `제2회의실`
- 교수: 홍길동 교수, 김영희 교수
- 조교: 이조교, 박조교

## 빌드

```bash
npm run build      # tsc -b && vite build → dist/
npm run preview    # 빌드 결과 미리보기
```

## 배포

```bash
# 로그인 (최초 1회)
npx firebase-tools login

# 규칙 / 인덱스 / 호스팅 배포
npx firebase-tools deploy --only firestore:rules,firestore:indexes,hosting
```

`.firebaserc` 의 `default` 프로젝트 id 를 실제 프로젝트로 바꾸세요.
`firebase.json` 의 호스팅 rewrite(`** → /index.html`)로 SPA 라우팅이 동작합니다.

## PWA (홈 화면에 추가)

- **iOS (Safari)**: 공유 버튼 → "홈 화면에 추가".
- **Android (Chrome)**: 메뉴(⋮) → "앱 설치" 또는 "홈 화면에 추가".

설치 후 앱 아이콘으로 전체 화면(standalone)으로 실행됩니다.
서비스 워커는 `autoUpdate` 로 새 버전을 자동 반영하며, Firebase API 요청은
캐시하지 않고 항상 네트워크를 사용합니다(NetworkOnly).

## 한계 (v1, 의도된 단순화)

- **역할(role) 구분은 UI 전용**입니다. Firestore 규칙은 인증된 사용자라면
  누구나 예약을 생성/수정/삭제할 수 있게 허용합니다. (소규모 신뢰 그룹 가정)
- **시간 겹침(conflict) 차단은 클라이언트에서만** 수행합니다. 교수는 충돌 시
  차단, 조교는 강제 예약(override) 가능.
- **동시 예약 경쟁 상태(double-booking race)** 는 v1에서 허용된 한계입니다.
  거의 동시에 두 사람이 같은 시간을 예약하면 둘 다 저장될 수 있습니다.

## 기술 스택

React 18 · TypeScript(strict) · Vite 5 · React Router 6 · Firebase 10
(Auth/Firestore/App Check) · dayjs · vite-plugin-pwa
