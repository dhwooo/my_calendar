"use client";

import * as React from "react";
import useSWR, { mutate } from "swr";
import { format } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Target,
  Trash2,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Todo = {
  id: string;
  date: string;
  text: string;
  done: boolean;
  order: number;
};
type Goal = {
  id: string;
  year: number;
  month: number | null;
  text: string;
  done: boolean;
  order: number;
};

const dayKey = (d: Date) => format(d, "yyyy-MM-dd");

export function DashboardClient() {
  const [date, setDate] = React.useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  const todoKey = `/api/todos?date=${dayKey(date)}`;
  const goalKey = `/api/goals?year=${year}`;
  const { data: todoData } = useSWR<{ todos: Todo[] }>(todoKey);
  const { data: goalData } = useSWR<{ goals: Goal[] }>(goalKey);
  const todos = todoData?.todos ?? [];
  const yearGoals = (goalData?.goals ?? []).filter((g) => g.month === null);
  const monthGoals = (goalData?.goals ?? []).filter((g) => g.month === month);

  return (
    <div className="mx-auto max-w-5xl px-5 py-6 sm:px-8 sm:py-10 anim-fade-in">
      <div className="mb-6 flex items-baseline gap-3">
        <h1 className="text-gradient text-[32px] font-semibold tracking-tight sm:text-[40px]">
          대시보드
        </h1>
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-subtle">
          dashboard
        </span>
      </div>

      <DateBar date={date} onChange={setDate} />

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <TodoCard date={date} todos={todos} cacheKey={todoKey} />
        </div>
        <GoalCard
          title={`${year}년 목표`}
          subtitle="year"
          icon={<Target className="h-4 w-4" />}
          goals={yearGoals}
          year={year}
          month={null}
          cacheKey={goalKey}
        />
        <GoalCard
          title={`${month}월 목표`}
          subtitle="month"
          icon={<CalendarIcon className="h-4 w-4" />}
          goals={monthGoals}
          year={year}
          month={month}
          cacheKey={goalKey}
        />
      </div>
    </div>
  );
}

function DateBar({
  date,
  onChange,
}: {
  date: Date;
  onChange: (d: Date) => void;
}) {
  const shift = (n: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    onChange(d);
  };
  const today = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    onChange(d);
  };
  const isToday = dayKey(date) === dayKey(new Date());
  const day = date.getDay();
  const dayTone =
    day === 0 ? "text-red-500" : day === 6 ? "text-blue-500" : "text-fg-muted";
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-bg-subtle/40 p-2">
      <Button variant="ghost" size="icon" onClick={() => shift(-1)}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="flex flex-1 items-baseline justify-center gap-2">
        <span className="text-[18px] font-semibold tracking-tight text-fg">
          {format(date, "yyyy. M. d")}
        </span>
        <span className={cn("font-mono text-[11px]", dayTone)}>
          {format(date, "EEE")}
        </span>
        {isToday && (
          <span className="rounded-full bg-accent/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-accent">
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
        className="h-8 rounded-lg text-[11px]"
      >
        오늘
      </Button>
    </div>
  );
}

function TodoCard({
  date,
  todos,
  cacheKey,
}: {
  date: Date;
  todos: Todo[];
  cacheKey: string;
}) {
  const [text, setText] = React.useState("");
  const dateStr = dayKey(date);
  const doneCount = todos.filter((t) => t.done).length;

  const add = async () => {
    const v = text.trim();
    if (!v) return;
    setText("");
    await fetch("/api/todos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ date: dateStr, text: v }),
    });
    mutate(cacheKey);
  };

  const toggle = async (t: Todo) => {
    await fetch(`/api/todos/${t.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ done: !t.done }),
    });
    mutate(cacheKey);
  };

  const remove = async (t: Todo) => {
    await fetch(`/api/todos/${t.id}`, { method: "DELETE" });
    mutate(cacheKey);
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-bg p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <h2 className="text-[15px] font-semibold tracking-tight text-fg">
            오늘 할 일
          </h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-fg-subtle">
            todo
          </span>
        </div>
        {todos.length > 0 && (
          <span className="font-mono text-[11px] text-fg-muted">
            {doneCount} / {todos.length}
          </span>
        )}
      </div>

      <div className="mb-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="할 일을 입력하고 Enter"
          className="h-10 flex-1 rounded-xl border border-border/60 bg-bg-subtle/40 px-3 text-[14px] outline-none focus:border-accent/60 focus:bg-bg"
        />
        <Button onClick={add} className="h-10 gap-1 rounded-xl">
          <Plus className="h-4 w-4" />
          추가
        </Button>
      </div>

      {todos.length === 0 ? (
        <p className="py-8 text-center font-mono text-[11px] text-fg-subtle">
          이 날 할 일이 없습니다
        </p>
      ) : (
        <ul className="space-y-1">
          {todos.map((t) => (
            <li
              key={t.id}
              className="group flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-bg-muted"
            >
              <button
                onClick={() => toggle(t)}
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition",
                  t.done
                    ? "border-accent bg-accent text-accent-fg"
                    : "border-border hover:border-fg/40",
                )}
              >
                {t.done && (
                  <svg viewBox="0 0 20 20" className="h-3.5 w-3.5">
                    <path
                      d="M5 10.5l3.5 3.5L15 7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </svg>
                )}
              </button>
              <span
                className={cn(
                  "flex-1 text-[14px]",
                  t.done ? "text-fg-subtle line-through" : "text-fg",
                )}
              >
                {t.text}
              </span>
              <button
                onClick={() => remove(t)}
                className="rounded-md p-1 text-fg-subtle opacity-0 transition hover:bg-red-500/10 hover:text-red-500 group-hover:opacity-100"
                aria-label="삭제"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function GoalCard({
  title,
  subtitle,
  icon,
  goals,
  year,
  month,
  cacheKey,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  goals: Goal[];
  year: number;
  month: number | null;
  cacheKey: string;
}) {
  const [text, setText] = React.useState("");
  const doneCount = goals.filter((g) => g.done).length;

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
    <div className="rounded-2xl border border-border/60 bg-bg p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-fg-muted">{icon}</span>
          <h2 className="text-[14px] font-semibold tracking-tight text-fg">
            {title}
          </h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-fg-subtle">
            {subtitle}
          </span>
        </div>
        {goals.length > 0 && (
          <span className="font-mono text-[11px] text-fg-muted">
            {doneCount} / {goals.length}
          </span>
        )}
      </div>

      <div className="mb-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="목표를 입력하고 Enter"
          className="h-9 flex-1 rounded-xl border border-border/60 bg-bg-subtle/40 px-3 text-[13px] outline-none focus:border-accent/60 focus:bg-bg"
        />
        <Button onClick={add} variant="outline" className="h-9 gap-1 rounded-xl text-[12px]">
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {goals.length === 0 ? (
        <p className="py-6 text-center font-mono text-[11px] text-fg-subtle">
          등록된 목표가 없습니다
        </p>
      ) : (
        <ul className="space-y-1">
          {goals.map((g) => (
            <li
              key={g.id}
              className="group flex items-start gap-3 rounded-xl px-2 py-2 transition hover:bg-bg-muted"
            >
              <button
                onClick={() => toggle(g)}
                className={cn(
                  "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-md border transition",
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
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </svg>
                )}
              </button>
              <span
                className={cn(
                  "flex-1 text-[13px] leading-relaxed",
                  g.done ? "text-fg-subtle line-through" : "text-fg",
                )}
              >
                {g.text}
              </span>
              <button
                onClick={() => remove(g)}
                className="mt-0.5 rounded-md p-1 text-fg-subtle opacity-0 transition hover:bg-red-500/10 hover:text-red-500 group-hover:opacity-100"
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
