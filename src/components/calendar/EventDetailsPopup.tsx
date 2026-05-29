"use client";

import * as React from "react";
import { format, isSameDay } from "date-fns";
import {
  Calendar as CalIcon,
  Clock,
  MapPin,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getHoliday } from "@/lib/holidays";
import type { EventDTO } from "@/types/calendar";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  event: EventDTO | null;
  onEdit: () => void;
  onDelete: () => Promise<void>;
};

export function EventDetailsPopup({
  open,
  onOpenChange,
  event,
  onEdit,
  onDelete,
}: Props) {
  if (!event) return null;
  const start = new Date(event.start);
  const end = new Date(event.end);
  const sameDay = isSameDay(start, end);
  const holiday = getHoliday(start);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px] gap-0 overflow-hidden p-0">
        {/* Header band with gradient + mood */}
        <div className="relative bg-gradient-to-br from-[rgb(var(--grad-1))]/15 via-[rgb(var(--grad-2))]/10 to-[rgb(var(--grad-3))]/15 px-6 pt-7 pb-5">
          {event.mood && (
            <div className="mb-2 text-[44px] leading-none">{event.mood}</div>
          )}
          <h2 className="text-[22px] font-semibold leading-tight tracking-tight text-fg">
            {event.title}
          </h2>
          {holiday && (
            <span className="mt-2 inline-block rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-500">
              {holiday}
            </span>
          )}
        </div>

        {/* Body */}
        <div className="space-y-3 px-6 py-5">
          <Row icon={<CalIcon className="h-4 w-4" />}>
            {sameDay
              ? format(start, "yyyy년 M월 d일 (EEE)")
              : `${format(start, "M월 d일")} – ${format(end, "M월 d일")}`}
          </Row>
          {!event.allDay && (
            <Row icon={<Clock className="h-4 w-4" />}>
              <span className="font-mono">
                {format(start, "HH:mm")} – {format(end, "HH:mm")}
              </span>
            </Row>
          )}
          {event.location && (
            <Row icon={<MapPin className="h-4 w-4" />}>{event.location}</Row>
          )}
          {event.description && (
            <div className="mt-3 rounded-xl bg-bg-muted/60 px-3 py-2.5 text-[13px] leading-relaxed text-fg-muted">
              {event.description}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 border-t border-border/60 bg-bg-subtle/40 px-4 py-3">
          <Button
            variant="ghost"
            onClick={async () => {
              if (!confirm("이 이벤트를 삭제할까요?")) return;
              await onDelete();
              onOpenChange(false);
            }}
            className="flex-1 gap-2 rounded-xl text-red-500 hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4" />
            삭제
          </Button>
          <Button onClick={onEdit} className="flex-1 gap-2 rounded-xl">
            <Pencil className="h-4 w-4" />
            수정
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 text-[14px] text-fg">
      <span className="mt-0.5 text-fg-subtle">{icon}</span>
      <span className="min-w-0 flex-1">{children}</span>
    </div>
  );
}
