// scripts/seedRest.mjs
// 에뮬레이터 전용 시드: Firestore REST + owner 우회로 rooms/users 를 기록한다.
// firestore.rules 의 write:false 는 변경하지 않는다(로컬 한정 우회).
// 한글이 셸 인자 경계에서 깨지는 문제를 피하려고, 한글은 이 파일(UTF-8)에만 둔다.
// 실행:  node scripts/seedRest.mjs
const BASE =
  'http://127.0.0.1:8080/v1/projects/demo-jeju/databases/(default)/documents';
const HDR = {
  Authorization: 'Bearer owner',
  'Content-Type': 'application/json',
};

const rooms = [
  { id: 'room-419', name: '419호', order: 1 },
  { id: 'room-420', name: '420호', order: 2 },
  { id: 'room-424', name: '424호', order: 3 },
];

const users = [
  { id: 'asst-oeh', name: '오은희', title: '조교', order: 1 },
  { id: 'asst-mhk', name: '문하경', title: '조교', order: 2 },
];

// 본문을 순수 ASCII 로 직렬화한다(비ASCII -> \uXXXX). 그러면 에뮬레이터가 본문을
// 어떤 코드페이지로 해석하더라도 바이트가 동일하고, JSON 파서가 \uXXXX 를 원래
// 한글로 복원한다(윈도우 레거시 코드페이지로 인한 본문 깨짐 방지).
function asciiJSON(obj) {
  return JSON.stringify(obj).replace(
    /[^\x00-\x7f]/g,
    (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'),
  );
}

async function patch(path, fields) {
  const res = await fetch(`${BASE}/${path}`, {
    method: 'PATCH',
    headers: HDR,
    body: asciiJSON({ fields }),
  });
  console.log(res.status, path, res.ok ? 'OK' : await res.text());
}

for (const r of rooms) {
  await patch(`rooms/${r.id}`, {
    name: { stringValue: r.name },
    order: { integerValue: String(r.order) },
    active: { booleanValue: true },
  });
}
for (const u of users) {
  await patch(`users/${u.id}`, {
    name: { stringValue: u.name },
    title: { stringValue: u.title },
    order: { integerValue: String(u.order) },
    active: { booleanValue: true },
  });
}
console.log('seed done');
