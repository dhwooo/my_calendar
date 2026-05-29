"use client";

import * as React from "react";
import useSWR from "swr";
import { cn } from "@/lib/utils";

type Quote = {
  symbol: string;
  label: string;
  price: number;
  changePct: number;
  currency: "KRW" | "USD" | "PT";
};

function fmtPrice(q: Quote) {
  if (q.currency === "KRW") {
    return q.price >= 1000
      ? `₩${Math.round(q.price).toLocaleString("ko-KR")}`
      : `₩${q.price.toFixed(2)}`;
  }
  return q.price.toLocaleString("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
}

export function MarketTicker() {
  const { data } = useSWR<{ quotes: Quote[] }>("/api/markets", {
    refreshInterval: 30_000,
  });
  const quotes = data?.quotes ?? [];

  if (quotes.length === 0) {
    return (
      <div className="h-9 border-y border-border/60 bg-bg-subtle/40" />
    );
  }

  const items = [...quotes, ...quotes]; // duplicate for seamless marquee

  return (
    <div className="relative h-9 overflow-hidden border-y border-border/60 bg-bg-subtle/40">
      <div className="ticker-track flex items-center gap-8 whitespace-nowrap py-2">
        {items.map((q, i) => {
          const up = q.changePct >= 0;
          return (
            <span key={`${q.symbol}-${i}`} className="flex items-center gap-2 px-1">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-subtle">
                {q.label}
              </span>
              <span className="text-[12px] font-medium text-fg tabular-nums">
                {fmtPrice(q)}
              </span>
              <span
                className={cn(
                  "font-mono text-[11px] tabular-nums",
                  up ? "text-red-500" : "text-blue-500",
                )}
              >
                {up ? "▲" : "▼"} {Math.abs(q.changePct).toFixed(2)}%
              </span>
            </span>
          );
        })}
      </div>
      {/* Soft edge mask */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-bg to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-bg to-transparent" />
    </div>
  );
}
