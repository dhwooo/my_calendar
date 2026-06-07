"use client";

import * as React from "react";
import useSWR, { mutate } from "swr";
import { format } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Plus,
  Target,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Goal = {
  id: string;
  year: number;
  month: number | null;
  text: string;
  done: boolean;
};

type Todo = {
  id: string;
  date: string;
  text: string;
  done: boolean;
  order: number;
};

const MONTH_LABELS = [
  "1월",
  "2월",
  "3월",
  "4월",
  "5월",
  "6월",
  "7월",
  "8월",
  "9월",
  "10월",
  "11월",
  "12월",
];

export function GoalsClient() {
  const [year, setYear] = React.useState(() => new Date().getFullYear());
  const [month, setMonth] = React.useState(() => new Date().getMonth() + 1);
  const key = `/api/goals?year=${year}`;
  const { data } = useSWR<{ goals: Goal[] }>(key);
  const goals = data?.goals ?? [];
  const yearGoals = goals.filter((g) => g.month === null);
  const monthGoals = goals.filter((g) => g.month === month);

  const shiftMonth = (n: number) => {
    let m = month + n;
    let y = year;
    while (m < 1) {
      m += 12;
      y -= 1;
    }
    while (m > 12) {
      m -= 12;
      y += 1;
    }
    setYear(y);
    setMonth(m);
  };
  const goToday = () => {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth() + 1);
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-6 sm:px-8 sm:py-10 anim-fade-in">
      <div className="mb-6 flex items-baseline gap-3">
        <h1 className="text-gradient text-[32px] font-semibold tracking-tight sm:text-[40px]">
          목표
        </h1>
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-subtle">
          goals
        </span>
      </div>

      <div className="mb-5 flex items-center gap-2 rounded-2xl border border-border/60 bg-bg-subtle/40 p-2">
        <Button variant="ghost" size="icon" onClick={() => shiftMonth(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex flex-1 items-baseline justify-center gap-2">
          <span className="text-[20px] font-semibold tracking-tight text-fg">
            {year}년 {month}월
          </span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => shiftMonth(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 rounded-lg text-[11px]"
          onClick={goToday}
        >
          오늘
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card
          title={`${year}년 목표`}
          sub="year"
          goals={yearGoals}
          year={year}
          month={null}
          cacheKey={key}
          large
        />
        <Card
          title={`${month}월 목표`}
          sub="month"
          goals={monthGoals}
          year={year}
          month={month}
          cacheKey={key}
          large
        />
      </div>

      <TodoSection />
    </div>
  );
}

function Card({
  title,
  sub,
  goals,
  year,
  month,
  cacheKey,
  large,
}: {
  title: string;
  sub: string;
  goals: Goal[];
  year: number;
  month: number | null;
  cacheKey: string;
  large?: boolean;
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
    <div
      className={cn(
        "rounded-2xl border border-border/60 bg-bg shadow-sm",
        large ? "p-5" : "p-4",
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className={cn("text-fg-muted", large ? "h-4 w-4" : "h-3.5 w-3.5")} />
          <span
            className={cn(
              "font-semibold tracking-tight text-fg",
              large ? "text-[15px]" : "text-[13px]",
            )}
          >
            {title}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-subtle">
            {sub}
          </span>
        </div>
        {goals.length > 0 && (
          <span className="font-mono text-[11px] text-fg-muted">
            {done}/{goals.length}
          </span>
        )}
      </div>

      <div className="mb-2 flex gap-1.5">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder={`${title} 추가`}
          className={cn(
            "flex-1 rounded-lg border border-border/60 bg-bg-subtle/40 px-2.5 outline-none focus:border-accent/60 focus:bg-bg",
            large ? "h-9 text-[13px]" : "h-8 text-[12px]",
          )}
        />
        <Button
          onClick={add}
          variant="outline"
          className={cn("gap-1 rounded-lg px-2", large ? "h-9 text-[12px]" : "h-8 text-[11px]")}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {goals.length === 0 ? (
        <p className="px-1 py-1 font-mono text-[10px] text-fg-subtle">비어 있음</p>
      ) : (
        <ul className="space-y-0.5">
          {goals.map((g) => (
            <li
              key={g.id}
              className="group flex items-start gap-2 rounded-lg px-1 py-1 hover:bg-bg-muted"
            >
              <button
                onClick={() => toggle(g)}
                className={cn(
                  "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                  g.done
                    ? "border-accent bg-accent text-accent-fg"
                    : "border-border hover:border-fg/40",
                )}
              >
                {g.done && (
                  <svg viewBox="0 0 20 20" className="h-3 w-3">
                    <path
                      d="M5 10.5l3.5 3.5L15 7"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </svg>
                )}
              </button>
              <span
                className={cn(
                  "flex-1 leading-snug",
                  large ? "text-[13px]" : "text-[12px]",
                  g.done ? "text-fg-subtle line-through" : "text-fg",
                )}
              >
                {g.text}
              </span>
              <button
                onClick={() => remove(g)}
                className="rounded-sm p-0.5 text-fg-subtle opacity-0 hover:text-red-500 group-hover:opacity-100"
                aria-label="삭제"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TodoSection() {
  const [date, setDate] = React.useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const dateStr = format(date, "yyyy-MM-dd");
  const key = `/api/todos?date=${dateStr}`;
  const { data } = useSWR<{ todos: Todo[] }>(key);
  const todos = data?.todos ?? [];
  const [text, setText] = React.useState("");
  const doneCount = todos.filter((t) => t.done).length;

  const shift = (n: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    setDate(d);
  };
  const today = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    setDate(d);
  };
  const isToday = format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
  const day = date.getDay();
  const dayTone =
    day === 0 ? "text-red-500" : day === 6 ? "text-blue-500" : "text-fg-muted";

  const add = async () => {
    const v = text.trim();
    if (!v) return;
    setText("");
    await fetch("/api/todos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ date: dateStr, text: v }),
    });
    mutate(key);
  };
  const toggle = async (t: Todo) => {
    await fetch(`/api/todos/${t.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ done: !t.done }),
    });
    mutate(key);
  };
  const remove = async (t: Todo) => {
    await fetch(`/api/todos/${t.id}`, { method: "DELETE" });
    mutate(key);
  };

  return (
    <div className="mt-5 rounded-2xl border border-border/60 bg-bg p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-fg-muted" />
          <h2 className="text-[15px] font-semibold tracking-tight text-fg">할 일</h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-subtle">
            todo
          </span>
        </div>
        {todos.length > 0 && (
          <span className="font-mono text-[11px] text-fg-muted">
            {doneCount}/{todos.length}
          </span>
        )}
      </div>

      <div className="mb-3 flex items-center gap-2 rounded-xl border border-border/60 bg-bg-subtle/40 p-1.5">
        <Button variant="ghost" size="icon" onClick={() => shift(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex flex-1 items-baseline justify-center gap-2">
          <span className="text-[14px] font-semibold text-fg">
            {format(date, "M월 d일")}
          </span>
          <span className={cn("font-mono text-[10px]", dayTone)}>
            {format(date, "EEE")}
          </span>
          {isToday && (
            <span className="rounded-full bg-accent/15 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-accent">
              today
            </span>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={() => shift(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={today}
          className="h-7 rounded-md text-[10px]"
        >
          오늘
        </Button>
      </div>

      <div className="mb-2 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="할 일 입력 + Enter"
          className="h-10 flex-1 rounded-xl border border-border/60 bg-bg-subtle/40 px-3 text-[14px] outline-none focus:border-accent/60 focus:bg-bg"
        />
        <Button onClick={add} className="h-10 gap-1 rounded-xl">
          <Plus className="h-4 w-4" /> 추가
        </Button>
      </div>

      {todos.length === 0 ? (
        <p className="py-4 text-center font-mono text-[11px] text-fg-subtle">
          할 일이 없습니다
        </p>
      ) : (
        <ul className="space-y-0.5">
          {todos.map((t) => (
            <li
              key={t.id}
              className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-bg-muted"
            >
              <button
                onClick={() => toggle(t)}
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-md border",
                  t.done
                    ? "border-accent bg-accent text-accent-fg"
                    : "border-border hover:border-fg/40",
                )}
              >
                {t.done && (
                  <svg viewBox="0 0 20 20" className="h-3 w-3">
                    <path
                      d="M5 10.5l3.5 3.5L15 7"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </svg>
                )}
              </button>
              <span
                className={cn(
                  "flex-1 text-[13px]",
                  t.done ? "text-fg-subtle line-through" : "text-fg",
                )}
              >
                {t.text}
              </span>
              <button
                onClick={() => remove(t)}
                className="rounded-md p-1 text-fg-subtle opacity-0 hover:bg-red-500/10 hover:text-red-500 group-hover:opacity-100"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
