/**
 * 로컬 에뮬레이터 전용 규칙 검증 스크립트 (개발용).
 *
 * 보안 규칙(firestore.rules)이 의도대로 동작하는지, 익명 인증 토큰으로
 * "규칙이 강제된" 상태에서 정상/거부 케이스를 직접 확인한다.
 * (빌드/타입체크로는 규칙 구문 오류를 잡을 수 없으므로 별도 검증)
 *
 * 실행: node scripts/dev-verify.mjs   (에뮬레이터가 떠 있어야 함)
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const FS_HOST = process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080';
const AUTH_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST ?? '127.0.0.1:9099';
const PROJECT = process.env.VITE_FIREBASE_PROJECT_ID ?? 'demo-jeju';
const BASE = `http://${FS_HOST}/v1/projects/${PROJECT}/databases/(default)/documents`;
const ADMIN_RULES = `http://${FS_HOST}/emulator/v1/projects/${PROJECT}:securityRules`;
const SIGNUP = `http://${AUTH_HOST}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo`;

const __dirname = dirname(fileURLToPath(import.meta.url));

let pass = 0;
let fail = 0;
function check(name, ok, detail = '') {
  if (ok) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    console.error(`  ✗ ${name} ${detail}`);
  }
}

/** 예약 문서를 Firestore REST 타입형으로 변환 */
function resvFields(r) {
  const f = {
    roomId: { stringValue: r.roomId },
    date: { stringValue: r.date },
    startSlot: { integerValue: String(r.startSlot) },
    endSlot: { integerValue: String(r.endSlot) },
    startLabel: { stringValue: r.startLabel },
    endLabel: { stringValue: r.endLabel },
    bookedFor: { stringValue: r.bookedFor },
    createdByUid: { stringValue: r.createdByUid },
    createdByName: { stringValue: r.createdByName },
  };
  if (r.purpose !== undefined) f.purpose = { stringValue: r.purpose };
  if (r.groupId !== undefined) f.groupId = { stringValue: r.groupId };
  return { fields: f };
}

async function createResv(token, r) {
  const res = await fetch(`${BASE}/reservations`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(resvFields(r)),
  });
  let name;
  if (res.ok) {
    const j = await res.json();
    name = j.name; // 생성된 문서 경로(정리에 사용)
  }
  return { status: res.status, name };
}

async function main() {
  // 0) 현재 규칙 재로드 (디스크의 firestore.rules 를 에뮬레이터에 반영)
  const rulesText = await readFile(join(__dirname, '..', 'firestore.rules'), 'utf8');
  const putRules = await fetch(ADMIN_RULES, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      rules: { files: [{ name: 'firestore.rules', content: rulesText }] },
    }),
  });
  console.log(`[rules] reload -> ${putRules.status} ${putRules.statusText}`);
  if (!putRules.ok) {
    console.error(await putRules.text());
    throw new Error('규칙 로드 실패(구문 오류 가능). 중단.');
  }

  // 1) 익명 사용자 토큰 발급
  const su = await fetch(SIGNUP, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ returnSecureToken: true }),
  });
  const suj = await su.json();
  const token = suj.idToken;
  const uid = suj.localId;
  if (!token || !uid) throw new Error('익명 토큰 발급 실패: ' + JSON.stringify(suj));
  console.log(`[auth] uid=${uid}`);

  const created = [];
  const baseDoc = {
    roomId: 'room-419',
    date: '2099-01-02',
    startSlot: 2,
    endSlot: 4,
    startLabel: '09:00',
    endLabel: '10:00',
    bookedFor: '검증 예약자',
    createdByUid: uid,
    createdByName: '검증조교',
  };

  console.log('[cases]');

  // A) 용도 + groupId 포함 정상 예약 → 성공(2xx)
  {
    const r = await createResv(token, {
      ...baseDoc,
      purpose: '학과 세미나',
      groupId: 'grp-verify-1',
    });
    check('A. 용도+groupId 정상 생성 → 허용', r.status === 200, `status=${r.status}`);
    if (r.name) created.push(r.name);
  }

  // B) 용도/groupId 없는 예약(기존 호환) → 성공(2xx)
  {
    const r = await createResv(token, { ...baseDoc, date: '2099-01-03' });
    check('B. 용도/groupId 없이 생성(하위호환) → 허용', r.status === 200, `status=${r.status}`);
    if (r.name) created.push(r.name);
  }

  // C) 용도 100자(>80) → 거부(403)
  {
    const r = await createResv(token, {
      ...baseDoc,
      date: '2099-01-04',
      purpose: 'ㄱ'.repeat(100),
    });
    check('C. 용도 100자 초과 → 거부', r.status === 403, `status=${r.status}`);
    if (r.name) created.push(r.name);
  }

  // D) createdByUid 위조 → 거부(403)
  {
    const r = await createResv(token, {
      ...baseDoc,
      date: '2099-01-05',
      createdByUid: 'someone-else',
    });
    check('D. createdByUid 위조 → 거부', r.status === 403, `status=${r.status}`);
    if (r.name) created.push(r.name);
  }

  // E) 잘못된 날짜 형식 → 거부(403) (기존 규칙 정상 동작 확인)
  {
    const r = await createResv(token, { ...baseDoc, date: '2099/01/06' });
    check('E. 잘못된 날짜 형식 → 거부', r.status === 403, `status=${r.status}`);
    if (r.name) created.push(r.name);
  }

  // 정리: 테스트로 생성된 문서 삭제 (Bearer owner = 규칙 우회)
  for (const name of created) {
    const path = name.split('/documents/')[1];
    await fetch(`${BASE}/${path}`, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer owner' },
    });
  }
  console.log(`[cleanup] removed ${created.length} test docs`);

  console.log(`\n[result] PASS=${pass} FAIL=${fail}`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error('[verify] 실패:', e);
  process.exit(1);
});
