"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

/**
 * Top-of-screen 그라데이션 프로그레스 바.
 * 페이지 전환 클릭 시 즉시 표시 → 새 경로 마운트되면 100%로 채우고 fade-out.
 */
export function NavProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = React.useState(0);
  const [visible, setVisible] = React.useState(false);
  const startedRef = React.useRef(false);

  // Intercept Link/button clicks to start progress before navigation completes
  React.useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:")) return;
      // Same-origin only
      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;
        if (url.pathname === pathname) return;
      } catch {
        return;
      }
      start();
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [pathname]);

  // When pathname actually changes, complete the bar
  React.useEffect(() => {
    if (!startedRef.current) return;
    setProgress(100);
    const t = setTimeout(() => {
      setVisible(false);
      setProgress(0);
      startedRef.current = false;
    }, 200);
    return () => clearTimeout(t);
  }, [pathname]);

  function start() {
    if (startedRef.current) return;
    startedRef.current = true;
    setVisible(true);
    setProgress(15);
    // Climb gradually to 80% while waiting
    let p = 15;
    const interval = setInterval(() => {
      p = Math.min(80, p + 10 + Math.random() * 10);
      setProgress(p);
      if (p >= 80) clearInterval(interval);
    }, 200);
  }

  if (!visible && progress === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[2px]"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 200ms" }}
    >
      <div
        className="h-full bg-gradient-to-r from-[rgb(var(--grad-1))] via-[rgb(var(--grad-2))] to-[rgb(var(--grad-3))]"
        style={{
          width: `${progress}%`,
          transition: "width 200ms ease-out",
          boxShadow: "0 0 8px rgb(var(--grad-1) / 0.6)",
        }}
      />
    </div>
  );
}
