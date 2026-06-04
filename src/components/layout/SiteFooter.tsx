/**
 * 페이지를 마감하는 다크 네이비 슬림 바 푸터 (HP 스타일).
 * 단일 화면(무스크롤) 앱이므로 큰 슬래브 대신 한 줄짜리 바로 마감한다.
 */
export function SiteFooter() {
  return (
    <footer className="sitefooter">
      <div className="sitefooter__bar">
        <span className="sitefooter__word">
          <span className="chevrons" aria-hidden="true">
            <i />
            <i />
          </span>
          회의실 예약
        </span>
        <span className="sitefooter__sep" aria-hidden="true">
          ·
        </span>
        <span className="sitefooter__note">
          제주대학교 학과 회의실 · 운영 08:00–22:00
        </span>
        <span className="sitefooter__spacer" />
        <span className="sitefooter__copy">
          © 2026 제주대학교 학과 회의실 예약 시스템
        </span>
      </div>
    </footer>
  );
}
