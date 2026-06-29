import PocketBase from 'pocketbase';

// PocketBase 서버 주소.
// - 개발 중(Vite): PocketBase 는 127.0.0.1:8090 에서 따로 돌아감
// - 배포 후: PocketBase 가 앱까지 같이 서빙하므로 같은 주소(window.location.origin)
//   => 나중에 데스크탑 서버로 옮겨도 이 파일을 고칠 필요가 없다.
const url = import.meta.env.DEV
  ? 'http://127.0.0.1:8090'
  : window.location.origin;

export const pb = new PocketBase(url);
