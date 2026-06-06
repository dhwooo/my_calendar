"use client";

import * as React from "react";
import { X, GripHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  initialX?: number;
  initialY?: number;
  width?: number;
  tone?: "info" | "error" | "warning" | "success";
};

const toneStyles: Record<NonNullable<Props["tone"]>, string> = {
  info: "border-fg/15",
  error: "border-red-500/40",
  warning: "border-amber-500/40",
  success: "border-emerald-500/40",
};

const toneDot: Record<NonNullable<Props["tone"]>, string> = {
  info: "bg-fg-muted",
  error: "bg-red-500",
  warning: "bg-amber-500",
  success: "bg-emerald-500",
};

export function DraggablePopup({
  open,
  onClose,
  title,
  children,
  initialX,
  initialY,
  width = 420,
  tone = "info",
}: Props) {
  const [pos, setPos] = React.useState<{ x: number; y: number } | null>(null);
  const dragRef = React.useRef<{ dx: number; dy: number } | null>(null);

  React.useEffect(() => {
    if (!open) return;
    if (pos) return;
    const x =
      initialX ?? Math.max(16, (window.innerWidth - width) / 2);
    const y = initialY ?? Math.max(16, window.innerHeight * 0.18);
    setPos({ x, y });
  }, [open, initialX, initialY, width, pos]);

  React.useEffect(() => {
    function onMove(e: PointerEvent) {
      if (!dragRef.current) return;
      const { dx, dy } = dragRef.current;
      const x = Math.min(
        window.innerWidth - 80,
        Math.max(-width + 80, e.clientX - dx),
      );
      const y = Math.min(window.innerHeight - 40, Math.max(0, e.clientY - dy));
      setPos({ x, y });
    }
    function onUp() {
      dragRef.current = null;
      document.body.style.userSelect = "";
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [width]);

  if (!open || !pos) return null;

  return (
    <div
      role="dialog"
      style={{
        position: "fixed",
        left: pos.x,
        top: pos.y,
        width,
        zIndex: 100,
      }}
      className={cn(
        "rounded-2xl border bg-bg shadow-2xl shadow-black/20 backdrop-blur",
        toneStyles[tone],
      )}
    >
      <div
        onPointerDown={(e) => {
          (e.target as Element).setPointerCapture?.(e.pointerId);
          dragRef.current = {
            dx: e.clientX - pos.x,
            dy: e.clientY - pos.y,
          };
          document.body.style.userSelect = "none";
        }}
        className="flex cursor-grab items-center gap-2 rounded-t-2xl border-b border-border/60 bg-bg-subtle/60 px-4 py-2.5 active:cursor-grabbing"
      >
        <GripHorizontal className="h-3.5 w-3.5 text-fg-subtle" />
        <span
          className={cn(
            "inline-block h-1.5 w-1.5 shrink-0 rounded-full",
            toneDot[tone],
          )}
        />
        <span className="flex-1 truncate text-[12px] font-medium text-fg">
          {title}
        </span>
        <button
          onClick={onClose}
          onPointerDown={(e) => e.stopPropagation()}
          className="rounded-md p-1 text-fg-muted hover:bg-bg-muted hover:text-fg"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="max-h-[60vh] overflow-y-auto px-4 py-3">{children}</div>
    </div>
  );
}
