import type { ReactNode } from 'react';
import { AppHeader } from './AppHeader';
import { SiteFooter } from './SiteFooter';

interface ScreenProps {
  /** 본문 상단 작은 제목(선택) */
  title?: string;
  /** 히어로 밴드: 값이 있으면 셰브론 히어로를 렌더 */
  heroEyebrow?: string;
  heroTitle?: string;
  heroSub?: string;
  showHeader?: boolean;
  showFooter?: boolean;
  children: ReactNode;
}

/**
 * 페이지 셸 (HP 밴드 구조):
 *  헤더(유틸바+톱내비) → 히어로(흰) → 본문(구름) → 푸터(잉크)
 */
export function Screen({
  title,
  heroEyebrow,
  heroTitle,
  heroSub,
  showHeader = true,
  showFooter = true,
  children,
}: ScreenProps) {
  return (
    <>
      {showHeader && <AppHeader />}
      <main className="screen">
        {heroTitle && (
          <section className="hero">
            <div className="hero__inner">
              {heroEyebrow && <p className="hero__eyebrow">{heroEyebrow}</p>}
              <h1 className="hero__title">{heroTitle}</h1>
              {heroSub && <p className="hero__sub">{heroSub}</p>}
              <span className="hero__chevrons" aria-hidden="true">
                <i />
                <i />
              </span>
            </div>
          </section>
        )}
        <div className="page">
          <div className="page__inner">
            {title && <h2 className="screen-title">{title}</h2>}
            {children}
          </div>
        </div>
      </main>
      {showFooter && <SiteFooter />}
    </>
  );
}
