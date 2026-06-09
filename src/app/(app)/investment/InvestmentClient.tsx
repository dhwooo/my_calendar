"use client";

import * as React from "react";
import useSWR from "swr";
import Link from "next/link";
import { TrendingUp, TrendingDown, Link2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Holding = {
  symbol: string;
  name?: string;
  market?: string;
  quantity: number;
  averagePrice?: number;
  currentPrice?: number;
  evalAmount?: number;
  profit?: number;
  profitRate?: number;
  currency?: string;
};
type Resp = {
  connected: boolean;
  error?: string;
  summary: {
    totalAsset?: number;
    cashBalance?: number;
    evalAmount?: number;
    totalProfit?: number;
    totalProfitRate?: number;
  } | null;
  holdings: Holding[];
};

const krw = (n?: number) =>
  n == null ? "—" : new Intl.NumberFormat("ko-KR").format(Math.round(n));

export function InvestmentClient() {
  const { data, mutate, isLoading } = useSWR<Resp>("/api/finance/toss/holdings");

  if (!data && isLoading) {
    return (
      <div className="flex h-[40vh] items-center justify-center font-mono text-[11px] text-fg-subtle">
        loading...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-8 sm:py-10 anim-fade-in">
      <div className="mb-6 flex items-baseline gap-3">
        <h1 className="text-gradient text-[32px] font-semibold tracking-tight sm:text-[40px]">
          투자
        </h1>
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-subtle">
          investment
        </span>
      </div>

      {!data?.connected ? (
        <ConnectPrompt />
      ) : data.error ? (
        <ErrorCard error={data.error} onRetry={() => mutate()} />
      ) : (
        <>
          <Summary summary={data.summary} />
          <Holdings holdings={data.holdings} onRefresh={() => mutate()} />
        </>
      )}
    </div>
  );
}

function ConnectPrompt() {
  return (
    <div className="rounded-2xl border border-border/70 bg-bg-subtle/40 p-6 text-center">
      <Link2 className="mx-auto mb-3 h-8 w-8 text-fg-subtle" />
      <h2 className="mb-1 text-[15px] font-semibold text-fg">
        토스증권 미연결
      </h2>
      <p className="mb-4 font-mono text-[11px] leading-relaxed text-fg-subtle">
        프로필에서 토스 OpenAPI 자격증명(client_id / secret / 계좌번호)을
        입력하면 보유 종목이 표시됩니다.
      </p>
      <Link
        href="/profile"
        className="inline-flex h-9 items-center justify-center rounded-xl bg-accent px-4 text-[12px] font-medium text-accent-fg hover:opacity-90"
      >
        프로필에서 연결하기
      </Link>
    </div>
  );
}

function ErrorCard({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-5">
      <h2 className="mb-2 text-[14px] font-semibold text-red-500">
        토스 API 오류
      </h2>
      <pre className="mb-3 max-h-32 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-bg p-3 font-mono text-[10px] text-fg-muted">
        {error}
      </pre>
      <Button
        onClick={onRetry}
        variant="outline"
        className="h-9 gap-2 rounded-xl text-[12px]"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        다시 시도
      </Button>
    </div>
  );
}

function Summary({ summary }: { summary: Resp["summary"] }) {
  if (!summary) return null;
  const profit = summary.totalProfit ?? 0;
  const pColor =
    profit > 0 ? "text-red-500" : profit < 0 ? "text-blue-500" : "text-fg-muted";
  const pIcon = profit > 0 ? TrendingUp : profit < 0 ? TrendingDown : null;

  return (
    <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <SummaryCard label="총 자산" value={krw(summary.totalAsset)} unit="원" accent />
      <SummaryCard label="예수금" value={krw(summary.cashBalance)} unit="원" />
      <SummaryCard label="평가금액" value={krw(summary.evalAmount)} unit="원" />
      <SummaryCard
        label="평가손익"
        value={
          summary.totalProfit != null
            ? `${profit > 0 ? "+" : ""}${krw(summary.totalProfit)}`
            : "—"
        }
        unit={
          summary.totalProfitRate != null
            ? `${summary.totalProfitRate > 0 ? "+" : ""}${summary.totalProfitRate.toFixed(2)}%`
            : "원"
        }
        valueClass={pColor}
        Icon={pIcon}
      />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  unit,
  accent,
  valueClass,
  Icon,
}: {
  label: string;
  value: string;
  unit: string;
  accent?: boolean;
  valueClass?: string;
  Icon?: typeof TrendingUp | null;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-3 sm:p-4",
        accent
          ? "border-fg/10 bg-gradient-to-br from-[rgb(var(--grad-1))]/8 to-[rgb(var(--grad-3))]/8"
          : "border-border/70 bg-bg-subtle/40",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-fg-subtle">
          {label}
        </span>
        {Icon && <Icon className={cn("h-3.5 w-3.5", valueClass)} />}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span
          className={cn(
            "text-[22px] font-semibold leading-none tabular-nums sm:text-[24px]",
            valueClass ?? "text-fg",
          )}
        >
          {value}
        </span>
        <span className="font-mono text-[11px] text-fg-subtle">{unit}</span>
      </div>
    </div>
  );
}

function Holdings({
  holdings,
  onRefresh,
}: {
  holdings: Holding[];
  onRefresh: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-bg-subtle/40 p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[14px] font-medium tracking-tight text-fg">
          보유 종목
          <span className="ml-2 font-mono text-[10px] text-fg-subtle">
            {holdings.length}개
          </span>
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRefresh}
          aria-label="새로고침"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>
      {holdings.length === 0 ? (
        <p className="py-6 text-center font-mono text-[11px] text-fg-subtle">
          보유 종목이 없어요
        </p>
      ) : (
        <ul className="divide-y divide-border/60">
          {holdings.map((h) => {
            const profit = h.profit ?? 0;
            const pColor =
              profit > 0
                ? "text-red-500"
                : profit < 0
                  ? "text-blue-500"
                  : "text-fg-muted";
            return (
              <li
                key={h.symbol}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[14px] font-medium text-fg">
                      {h.name ?? h.symbol}
                    </span>
                    {h.market && (
                      <span className="font-mono text-[9px] uppercase text-fg-subtle">
                        {h.market}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 font-mono text-[10px] text-fg-subtle">
                    <span>{h.quantity}주</span>
                    {h.averagePrice != null && (
                      <>
                        <span>·</span>
                        <span>평단 {krw(h.averagePrice)}</span>
                      </>
                    )}
                    {h.currentPrice != null && (
                      <>
                        <span>·</span>
                        <span>현재 {krw(h.currentPrice)}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[14px] font-semibold tabular-nums text-fg">
                    {krw(h.evalAmount)}
                  </div>
                  {h.profit != null && (
                    <div
                      className={cn(
                        "font-mono text-[10px] tabular-nums",
                        pColor,
                      )}
                    >
                      {profit > 0 ? "+" : ""}
                      {krw(profit)}
                      {h.profitRate != null &&
                        ` (${h.profitRate > 0 ? "+" : ""}${h.profitRate.toFixed(2)}%)`}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
