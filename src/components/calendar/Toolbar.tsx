"use client";

import { CalendarRange, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fmt } from "@/lib/date";
import type { CalendarView } from "@/types/calendar";

type Props = {
  anchor: Date;
  view: CalendarView;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewChange: (view: CalendarView) => void;
  onOpenMobileNav?: () => void;
};

const VIEWS: { key: CalendarView; label: string }[] = [
  { key: "year", label: "연" },
  { key: "month", label: "월" },
  { key: "week", label: "주" },
  { key: "day", label: "일" },
];

export function Toolbar({
  anchor,
  view,
  onPrev,
  onNext,
  onToday,
  onViewChange,
  onOpenMobileNav,
}: Props) {
  // YearView/DayView render their own large titles. Hide here to avoid duplicate.
  const showTitle = view === "month" || view === "week";
  const title =
    view === "week"
      ? `${fmt.monthYear(anchor)} · ${format(anchor, "w")}주차`
      : fmt.monthYear(anchor);

  return (
    <div className="flex flex-wrap items-end justify-between gap-3 px-5 pb-4 pt-6 sm:px-8 sm:pb-5 sm:pt-7">
      <div className="flex items-center gap-2">
        {onOpenMobileNav && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="날짜 패널"
            onClick={onOpenMobileNav}
          >
            <CalendarRange className="h-5 w-5" />
          </Button>
        )}
        {showTitle ? (
          <h2 className="text-gradient text-[26px] font-semibold leading-none tracking-tight sm:text-[34px]">
            {title}
          </h2>
        ) : (
          <span className="h-[26px] sm:h-[34px]" />
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex rounded-xl bg-bg-muted/70 p-1 backdrop-blur-sm">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              onClick={() => onViewChange(v.key)}
              className={cn(
                "min-w-[36px] rounded-lg px-2.5 py-1 text-[12px] font-medium transition",
                view === v.key
                  ? "bg-bg text-fg shadow-sm"
                  : "text-fg-muted hover:text-fg",
              )}
            >
              {v.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-border/70 p-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onPrev}
            aria-label="이전"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <button
            onClick={onToday}
            className="px-2.5 text-[12px] font-medium text-fg-muted hover:text-fg"
          >
            오늘
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onNext}
            aria-label="다음"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
