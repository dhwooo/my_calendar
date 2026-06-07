"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { SWRConfig } from "swr";

/**
 * localStorage 기반 SWR 캐시 — 새로고침해도 이전 응답을 즉시 보여주고
 * 백그라운드에서 최신 데이터를 받아 갱신.
 */
function localStorageProvider(): Map<string, unknown> {
  if (typeof window === "undefined") return new Map();
  let map: Map<string, unknown>;
  try {
    map = new Map(JSON.parse(localStorage.getItem("dhwoo-swr") ?? "[]"));
  } catch {
    map = new Map();
  }
  window.addEventListener("beforeunload", () => {
    try {
      const entries = Array.from(map.entries()).filter(([k]) =>
        // 너무 큰 캐시 방지 — 주요 데이터만 영구 저장
        typeof k === "string" &&
        (k.startsWith("/api/calendar/") ||
          k.startsWith("/api/weight") ||
          k.startsWith("/api/wiki") ||
          k.startsWith("/api/goals") ||
          k.startsWith("/api/todos") ||
          k.startsWith("/api/profile")),
      );
      localStorage.setItem("dhwoo-swr", JSON.stringify(entries));
    } catch {
      // QuotaExceeded 등 무시
    }
  });
  return map;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={0}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange
      >
        <SWRConfig
          value={{
            provider: localStorageProvider,
            fetcher: (url: string) =>
              fetch(url).then((r) => {
                if (!r.ok) throw new Error(`${r.status}`);
                return r.json();
              }),
            revalidateOnFocus: false,
            // 캐시 즉시 표시 + 백그라운드 갱신 (stale-while-revalidate 기본 동작)
            keepPreviousData: true,
          }}
        >
          {children}
        </SWRConfig>
      </ThemeProvider>
    </SessionProvider>
  );
}
