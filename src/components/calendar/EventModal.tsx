"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { fmt } from "@/lib/date";
import type { EventDTO } from "@/types/calendar";

const MOODS = ["😊", "😎", "🥰", "😴", "🔥", "🌱", "🥲", "🧠", "🌧️", "🎉"];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate: Date;
  event: EventDTO | null;
  onSave: (input: {
    title: string;
    description?: string;
    location?: string;
    start: string;
    end: string;
    allDay?: boolean;
    mood?: string | null;
    notifyMinutes?: number | null;
    shared?: boolean;
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
};

function combine(date: string, time: string) {
  return new Date(`${date}T${time}:00`);
}

export function EventModal({
  open,
  onOpenChange,
  defaultDate,
  event,
  onSave,
  onDelete,
}: Props) {
  const isEdit = !!event;
  const initialStart = event ? new Date(event.start) : (() => {
    const d = new Date(defaultDate);
    d.setMinutes(0, 0, 0);
    if (d.getHours() < 9) d.setHours(9);
    return d;
  })();
  const initialEnd = event
    ? new Date(event.end)
    : new Date(initialStart.getTime() + 60 * 60 * 1000);

  const [title, setTitle] = React.useState(event?.title ?? "");
  const [description, setDescription] = React.useState(event?.description ?? "");
  const [location, setLocation] = React.useState(event?.location ?? "");
  const [startDate, setStartDate] = React.useState(fmt.dateInput(initialStart));
  const [startTime, setStartTime] = React.useState(fmt.timeInput(initialStart));
  const [endDate, setEndDate] = React.useState(fmt.dateInput(initialEnd));
  const [endTime, setEndTime] = React.useState(fmt.timeInput(initialEnd));
  const [allDay, setAllDay] = React.useState(event?.allDay ?? false);
  const [mood, setMood] = React.useState<string | null>(event?.mood ?? null);
  const [notifyMinutes, setNotifyMinutes] = React.useState<number | null>(
    event?.notifyMinutes ?? null,
  );
  const [shared, setShared] = React.useState<boolean>(event?.shared ?? false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setTitle(event?.title ?? "");
    setDescription(event?.description ?? "");
    setLocation(event?.location ?? "");
    setAllDay(event?.allDay ?? false);
    setMood(event?.mood ?? null);
    setNotifyMinutes(event?.notifyMinutes ?? null);
    setShared(event?.shared ?? false);
    const s = event ? new Date(event.start) : initialStart;
    const e = event ? new Date(event.end) : initialEnd;
    setStartDate(fmt.dateInput(s));
    setStartTime(fmt.timeInput(s));
    setEndDate(fmt.dateInput(e));
    setEndTime(fmt.timeInput(e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, event?.id]);

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const start = allDay
        ? new Date(`${startDate}T00:00:00`)
        : combine(startDate, startTime);
      const end = allDay
        ? new Date(`${endDate}T23:59:59`)
        : combine(endDate, endTime);
      await onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        start: start.toISOString(),
        end: end.toISOString(),
        allDay,
        mood,
        notifyMinutes,
        shared,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="text-gradient">
            {isEdit ? "이벤트 수정" : "새 이벤트"}
          </DialogTitle>
          <DialogDescription>
            저장하면 (연결된 경우) Google Calendar에도 반영됩니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="제목"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            className="h-11 rounded-xl text-[15px]"
          />

          <div>
            <label className="mb-2 block text-[11px] font-medium text-fg-muted">
              오늘의 무드
            </label>
            <div className="flex flex-wrap gap-1.5">
              {MOODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMood(mood === m ? null : m)}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl border text-[18px] transition",
                    mood === m
                      ? "border-fg/40 bg-bg-muted scale-110"
                      : "border-border bg-bg-subtle/60 hover:bg-bg-muted",
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-fg-muted">
              <input
                type="checkbox"
                checked={allDay}
                onChange={(e) => setAllDay(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              종일
            </label>
            <label className="flex items-center gap-2 text-sm text-fg-muted">
              <input
                type="checkbox"
                checked={shared}
                onChange={(e) => setShared(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              공용 일정 (상대 캘린더에도 표시)
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            {!allDay && (
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            )}
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            {!allDay && (
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            )}
          </div>

          <Input
            placeholder="위치 (선택)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <Textarea
            placeholder="설명 (선택)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-fg-muted">
              알림
            </label>
            <select
              value={notifyMinutes === null ? "" : String(notifyMinutes)}
              onChange={(e) =>
                setNotifyMinutes(e.target.value === "" ? null : Number(e.target.value))
              }
              className="h-10 w-full rounded-xl border border-border bg-bg-subtle/40 px-3 text-[14px] outline-none focus:border-accent/60 focus:bg-bg"
            >
              <option value="">알림 없음</option>
              <option value="0">정각</option>
              <option value="5">5분 전</option>
              <option value="10">10분 전</option>
              <option value="15">15분 전</option>
              <option value="30">30분 전</option>
              <option value="60">1시간 전</option>
              <option value="120">2시간 전</option>
              <option value="1440">1일 전</option>
              <option value="2880">2일 전</option>
            </select>
          </div>
        </div>

        <DialogFooter>
          {isEdit && onDelete && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="삭제"
              onClick={async () => {
                await onDelete();
                onOpenChange(false);
              }}
              className="mr-auto text-red-500 hover:bg-red-500/10 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={saving || !title.trim()}>
            {saving ? "저장 중..." : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
