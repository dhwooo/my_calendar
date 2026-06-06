"use client";

import * as React from "react";
import useSWR, { mutate } from "swr";
import { Plus, RefreshCw, Target, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DraggablePopup } from "@/components/ui/DraggablePopup";
import { cn } from "@/lib/utils";
import {
  daysBetween,
  fmt,
  isSameDay,
  isSameMonth,
  monthGridRange,
} from "@/lib/date";

type Props = {
  anchor: Date;
  selected: Date;
  onSelect: (d: Date) => void;
  onCreate: () => void;
  onRefreshIcal?: () => Promise<void> | void;
};

type DiagnoseResult = {
  step: string;
  message?: string;
  url?: string;
  status?: number;
  statusText?: string;
  bytes?: number;
  lines?: number;
  vEventCountRaw?: number;
  vEventParsed?: number;
  error?: string;
  sample?: string;
};

export function Sidebar({
  anchor,
  selected,
  onSelect,
  onCreate,
  onRefreshIcal,
}: Props) {
  const days = daysBetween(monthGridRange(anchor));
  const weekHeader = ["월", "화", "수", "목", "금", "토", "일"];
  const today = new Date();
  const [refreshing, setRefreshing] = React.useState(false);
  const [diag, setDiag] = React.useState<DiagnoseResult | null>(null);
  const [diagLoading, setDiagLoading] = React.useState(false);

  const { data: profile } = useSWR<{ user: { icalUrl: string | null } }>(
    "/api/profile",
  );
  const hasIcal = !!profile?.user?.icalUrl;

  return (
    <aside className="relative z-10 flex h-full w-[260px] shrink-0 flex-col gap-6 border-r border-border/60 bg-bg-subtle/30 px-5 py-6 backdrop-blur-sm">
      <Button
        onClick={onCreate}
        className="h-10 w-full justify-center gap-2 rounded-xl"
      >
        <Plus className="h-4 w-4" />
        새 이벤트
      </Button>

      <div>
        <div className="mb-3 flex items-center justify-between px-1">
          <span className="text-[13px] font-medium tracking-tight text-fg">
            {fmt.monthYear(anchor)}
          </span>
        </div>

        <div className="grid grid-cols-7 gap-y-1.5 text-center">
          {weekHeader.map((w, i) => (
            <span
              key={w}
              className={cn(
                "font-mono text-[10px] uppercase tracking-wider",
                i === 5 || i === 6 ? "text-fg-subtle/80" : "text-fg-subtle",
              )}
            >
              {w}
            </span>
          ))}
          {days.map((d) => {
            const isSel = isSameDay(d, selected);
            const isToday = isSameDay(d, today);
            const muted = !isSameMonth(d, anchor);
            return (
              <button
                key={d.toISOString()}
                onClick={() => onSelect(d)}
                className={cn(
                  "mx-auto flex h-7 w-7 items-center justify-center rounded-full font-mono text-[11px] transition",
                  muted && "text-fg-subtle",
                  !muted && !isSel && !isToday && "text-fg hover:bg-bg-muted",
                  isToday && !isSel && "text-accent ring-1 ring-inset ring-accent/40",
                  isSel && "bg-accent text-accent-fg",
                )}
              >
                {fmt.day(d)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-auto space-y-3">
        {hasIcal && onRefreshIcal && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[12px] font-medium text-fg">
                iCal 구독
              </span>
              <span className="font-mono text-[10px] text-emerald-600">
                ● 활성
              </span>
            </div>
            <Button
              variant="outline"
              className="mt-2 h-8 w-full justify-center gap-2 rounded-lg text-[12px]"
              onClick={async () => {
                setRefreshing(true);
                try {
                  await onRefreshIcal();
                } finally {
                  setRefreshing(false);
                }
              }}
              disabled={refreshing}
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", refreshing && "animate-spin")}
              />
              {refreshing ? "가져오는 중..." : "지금 새로고침"}
            </Button>
            <button
              onClick={async () => {
                setDiagLoading(true);
                try {
                  const res = await fetch("/api/calendar/ical/diagnose");
                  const j = (await res.json()) as DiagnoseResult;
                  setDiag(j);
                } finally {
                  setDiagLoading(false);
                }
              }}
              disabled={diagLoading}
              className="mt-1.5 w-full text-[10px] text-fg-muted underline-offset-2 hover:text-fg hover:underline disabled:opacity-50"
            >
              {diagLoading ? "진단 중..." : "연동 진단"}
            </button>
            <p className="mt-2 font-mono text-[10px] leading-relaxed text-fg-subtle">
              자동: 5분마다. 즉시 반영하려면 위 버튼.
            </p>
          </div>
        )}

      </div>

      <DraggablePopup
        open={!!diag}
        onClose={() => setDiag(null)}
        title={`iCal 진단 — ${diag?.step ?? ""}`}
        tone={
          diag?.step === "ok"
            ? "success"
            : diag?.step === "no-url"
              ? "warning"
              : "error"
        }
      >
        {diag && <DiagnoseBody diag={diag} />}
      </DraggablePopup>
    </aside>
  );
}

function DiagnoseBody({ diag }: { diag: DiagnoseResult }) {
  const Row = ({ k, v }: { k: string; v: React.ReactNode }) => (
    <div className="flex items-start gap-3 border-b border-border/40 py-1.5 last:border-0">
      <span className="w-24 shrink-0 font-mono text-[10px] uppercase tracking-wide text-fg-subtle">
        {k}
      </span>
      <span className="min-w-0 flex-1 break-all text-[12px] text-fg">{v}</span>
    </div>
  );
  const hint =
    diag.step === "parse-failed"
      ? "ICS 본문은 받아왔지만 파서가 실패. URL 끝 토큰이 잘려있거나 응답이 HTML(로그인 페이지)일 가능성. 'sample' 첫줄이 BEGIN:VCALENDAR 인지 확인."
      : diag.step === "http-error"
        ? "URL이 만료/잘못됨. Google 캘린더 설정 → 비공개 주소 재발급."
        : diag.step === "fetch-failed"
          ? "네트워크/도메인 오류."
          : diag.step === "no-url"
            ? "프로필 페이지에서 ICS URL 저장 필요."
            : diag.step === "ok" && (diag.vEventParsed ?? 0) === 0
              ? "파싱은 됐지만 이벤트 0개. 캘린더가 비었거나 범위 밖."
              : null;
  return (
    <div className="space-y-1">
      <Row k="step" v={<code className="font-mono text-[11px]">{diag.step}</code>} />
      {diag.url && <Row k="url" v={diag.url} />}
      {diag.status !== undefined && (
        <Row k="http" v={`${diag.status} ${diag.statusText ?? ""}`} />
      )}
      {diag.bytes !== undefined && <Row k="bytes" v={diag.bytes.toLocaleString()} />}
      {diag.vEventCountRaw !== undefined && (
        <Row k="vevent raw" v={String(diag.vEventCountRaw)} />
      )}
      {diag.vEventParsed !== undefined && (
        <Row k="parsed" v={String(diag.vEventParsed)} />
      )}
      {diag.message && <Row k="message" v={diag.message} />}
      {diag.error && (
        <Row
          k="error"
          v={
            <pre className="whitespace-pre-wrap rounded-md bg-red-500/5 p-2 font-mono text-[10px] text-red-500">
              {diag.error}
            </pre>
          }
        />
      )}
      {diag.sample && (
        <Row
          k="sample"
          v={
            <pre className="max-h-32 overflow-auto whitespace-pre-wrap rounded-md bg-bg-muted p-2 font-mono text-[10px] text-fg-muted">
              {diag.sample}
            </pre>
          }
        />
      )}
      {hint && (
        <p className="mt-2 rounded-md bg-fg/5 p-2 text-[11px] leading-relaxed text-fg-muted">
          {hint}
        </p>
      )}
    </div>
  );
}

type Goal = { id: string; year: number; month: number | null; text: string; done: boolean };

function GoalsPanel({ anchor }: { anchor: Date }) {
  const year = anchor.getFullYear();
  const month = anchor.getMonth() + 1;
  const key = `/api/goals?year=${year}`;
  const { data } = useSWR<{ goals: Goal[] }>(key);
  const yearGoals = (data?.goals ?? []).filter((g) => g.month === null);
  const monthGoals = (data?.goals ?? []).filter((g) => g.month === month);
  return (
    <>
      <GoalCard
        title={`${year}년 목표`}
        sub="year"
        goals={yearGoals}
        year={year}
        month={null}
        cacheKey={key}
      />
      <GoalCard
        title={`${month}월 목표`}
        sub="month"
        goals={monthGoals}
        year={year}
        month={month}
        cacheKey={key}
      />
    </>
  );
}

function GoalCard({
  title,
  sub,
  goals,
  year,
  month,
  cacheKey,
}: {
  title: string;
  sub: string;
  goals: Goal[];
  year: number;
  month: number | null;
  cacheKey: string;
}) {
  const [text, setText] = React.useState("");
  const done = goals.filter((g) => g.done).length;
  const add = async () => {
    const v = text.trim();
    if (!v) return;
    setText("");
    await fetch("/api/goals", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ year, month, text: v }),
    });
    mutate(cacheKey);
  };
  const toggle = async (g: Goal) => {
    await fetch(`/api/goals/${g.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ done: !g.done }),
    });
    mutate(cacheKey);
  };
  const remove = async (g: Goal) => {
    await fetch(`/api/goals/${g.id}`, { method: "DELETE" });
    mutate(cacheKey);
  };
  return (
    <div className="rounded-2xl border border-border/60 bg-bg-subtle/30 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Target className="h-3 w-3 text-fg-muted" />
          <span className="text-[11px] font-medium text-fg">{title}</span>
        </div>
        <span className="font-mono text-[9px] uppercase tracking-wider text-fg-subtle">
          {sub} {goals.length > 0 && `· ${done}/${goals.length}`}
        </span>
      </div>
      <div className="mb-1.5 flex gap-1.5">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="추가"
          className="h-7 flex-1 rounded-md border border-border/60 bg-bg px-2 text-[11px] outline-none focus:border-accent/60"
        />
        <button
          onClick={add}
          className="rounded-md border border-border/60 px-1.5 text-fg-muted hover:bg-bg-muted hover:text-fg"
          aria-label="추가"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
      {goals.length === 0 ? (
        <p className="px-1 py-0.5 font-mono text-[9px] text-fg-subtle">
          비어 있음
        </p>
      ) : (
        <ul className="space-y-0.5">
          {goals.map((g) => (
            <li key={g.id} className="group flex items-start gap-1.5 rounded-md px-1 py-1 hover:bg-bg-muted">
              <button
                onClick={() => toggle(g)}
                className={cn(
                  "mt-0.5 flex h-3 w-3 shrink-0 items-center justify-center rounded border",
                  g.done ? "border-accent bg-accent text-accent-fg" : "border-border",
                )}
              >
                {g.done && (
                  <svg viewBox="0 0 20 20" className="h-2.5 w-2.5">
                    <path d="M5 10.5l3.5 3.5L15 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                )}
              </button>
              <span className={cn("flex-1 text-[11px] leading-relaxed", g.done ? "text-fg-subtle line-through" : "text-fg")}>
                {g.text}
              </span>
              <button
                onClick={() => remove(g)}
                className="rounded-sm p-0.5 text-fg-subtle opacity-0 hover:text-red-500 group-hover:opacity-100"
                aria-label="삭제"
              >
                <Trash2 className="h-2.5 w-2.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
