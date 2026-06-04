/**
 * 로컬 에뮬레이터 전용 재시드 스크립트 (개발용).
 *
 * 동작:
 *  1) 에뮬레이터의 모든 Firestore 문서 삭제(이전 스키마/스테일 데이터 제거)
 *  2) 현재 firestore.rules 를 에뮬레이터에 다시 로드(최신 규칙 보장)
 *  3) rooms/users 를 REST + `Bearer owner`(규칙 우회 관리자 토큰)로 시드
 *
 * 실행: node scripts/dev-reseed.mjs   (에뮬레이터가 떠 있어야 함)
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HOST = process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080';
const PROJECT = process.env.VITE_FIREBASE_PROJECT_ID ?? 'demo-jeju';
const BASE = `http://${HOST}/v1/projects/${PROJECT}/databases/(default)/documents`;
const ADMIN_DOCS = `http://${HOST}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`;
const ADMIN_RULES = `http://${HOST}/emulator/v1/projects/${PROJECT}:securityRules`;
const OWNER = { Authorization: 'Bearer owner', 'Content-Type': 'application/json' };

const __dirname = dirname(fileURLToPath(import.meta.url));

const rooms = [
  { id: 'room-419', name: '419호', order: 1, active: true },
  { id: 'room-420', name: '420호', order: 2, active: true },
  { id: 'room-424', name: '424호', order: 3, active: true },
];

const users = [
  { id: 'asst-oeh', name: '오은희', title: '조교', order: 1, active: true },
  { id: 'asst-mhk', name: '문하경', title: '조교', order: 2, active: true },
];

const roomFields = (r) => ({
  fields: {
    name: { stringValue: r.name },
    order: { integerValue: String(r.order) },
    active: { booleanValue: r.active },
  },
});

const userFields = (u) => ({
  fields: {
    name: { stringValue: u.name },
    title: { stringValue: u.title },
    order: { integerValue: String(u.order) },
    active: { booleanValue: u.active },
  },
});

async function main() {
  // 1) 전체 삭제
  const del = await fetch(ADMIN_DOCS, { method: 'DELETE' });
  console.log(`[wipe] ${del.status} ${del.statusText}`);

  // 2) 현재 규칙 재로드
  const rulesText = await readFile(join(__dirname, '..', 'firestore.rules'), 'utf8');
  const putRules = await fetch(ADMIN_RULES, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      rules: { files: [{ name: 'firestore.rules', content: rulesText }] },
    }),
  });
  console.log(`[rules] ${putRules.status} ${putRules.statusText}`);

  // 3) 시드 (PATCH = upsert, Bearer owner 로 규칙 우회)
  for (const r of rooms) {
    const res = await fetch(`${BASE}/rooms/${r.id}`, {
      method: 'PATCH',
      headers: OWNER,
      body: JSON.stringify(roomFields(r)),
    });
    console.log(`[room] ${r.name} -> ${res.status}`);
    if (!res.ok) console.error(await res.text());
  }
  for (const u of users) {
    const res = await fetch(`${BASE}/users/${u.id}`, {
      method: 'PATCH',
      headers: OWNER,
      body: JSON.stringify(userFields(u)),
    });
    console.log(`[user] ${u.name} -> ${res.status}`);
    if (!res.ok) console.error(await res.text());
  }

  // 4) 검증: owner 토큰으로 되읽기
  const verifyRooms = await fetch(`${BASE}/rooms`, { headers: OWNER });
  const verifyUsers = await fetch(`${BASE}/users`, { headers: OWNER });
  const rj = await verifyRooms.json();
  const uj = await verifyUsers.json();
  console.log(`[verify] rooms=${(rj.documents ?? []).length} users=${(uj.documents ?? []).length}`);
  console.log('[done]');
}

main().catch((e) => {
  console.error('[reseed] 실패:', e);
  process.exit(1);
});
