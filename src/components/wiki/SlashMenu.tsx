"use client";

import * as React from "react";
import {
  CheckSquare,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Minus,
  Quote,
  Table,
  Type,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type SlashCommand = {
  id: string;
  label: string;
  hint: string;
  icon: React.ElementType;
  /** Markdown to insert at the slash position (replaces /query). Use `{|}` for caret. */
  insert: string;
};

export const COMMANDS: SlashCommand[] = [
  { id: "h1", label: "제목 1", hint: "큰 섹션 제목", icon: Heading1, insert: "# {|}" },
  { id: "h2", label: "제목 2", hint: "중간 제목", icon: Heading2, insert: "## {|}" },
  { id: "h3", label: "제목 3", hint: "작은 제목", icon: Heading3, insert: "### {|}" },
  { id: "text", label: "본문", hint: "일반 텍스트", icon: Type, insert: "{|}" },
  { id: "todo", label: "할 일", hint: "체크박스 리스트", icon: CheckSquare, insert: "- [ ] {|}" },
  { id: "bullet", label: "글머리 목록", hint: "• 항목", icon: List, insert: "- {|}" },
  { id: "numbered", label: "번호 목록", hint: "1. 항목", icon: ListOrdered, insert: "1. {|}" },
  { id: "quote", label: "인용", hint: "강조 인용", icon: Quote, insert: "> {|}" },
  { id: "code", label: "코드 블록", hint: "```...```", icon: Code, insert: "```\n{|}\n```" },
  { id: "divider", label: "구분선", hint: "수평 구분선", icon: Minus, insert: "\n---\n{|}" },
  { id: "table", label: "테이블", hint: "2x2 표", icon: Table, insert: "| {|} | |\n| --- | --- |\n|   |   |" },
];

type Props = {
  query: string;
  position: { top: number; left: number };
  onSelect: (cmd: SlashCommand) => void;
  onClose: () => void;
};

export function SlashMenu({ query, position, onSelect, onClose }: Props) {
  const filtered = React.useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return COMMANDS;
    return COMMANDS.filter(
      (c) => c.id.includes(q) || c.label.toLowerCase().includes(q),
    );
  }, [query]);

  const [active, setActive] = React.useState(0);
  React.useEffect(() => setActive(0), [query]);

  React.useEffect(() => {
    function key(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((a) => Math.min(a + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((a) => Math.max(a - 1, 0));
      } else if (e.key === "Enter" || e.key === "Tab") {
        if (filtered[active]) {
          e.preventDefault();
          onSelect(filtered[active]);
        }
      }
    }
    window.addEventListener("keydown", key, true);
    return () => window.removeEventListener("keydown", key, true);
  }, [filtered, active, onSelect, onClose]);

  if (filtered.length === 0) {
    return null;
  }

  return (
    <div
      role="listbox"
      className="anim-pop fixed z-50 max-h-[320px] w-[280px] overflow-auto rounded-2xl border border-border/70 bg-bg/95 p-1.5 backdrop-blur-2xl"
      style={{
        top: position.top,
        left: position.left,
        boxShadow:
          "0 24px 60px -20px rgb(0 0 0 / 0.35), 0 1px 0 rgb(255 255 255 / 0.06) inset",
      }}
    >
      <div className="px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-fg-subtle">
        기본 블록
      </div>
      {filtered.map((c, i) => {
        const Icon = c.icon;
        return (
          <button
            key={c.id}
            onClick={() => onSelect(c)}
            onMouseEnter={() => setActive(i)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition",
              active === i ? "bg-bg-muted" : "hover:bg-bg-muted/60",
            )}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-bg-subtle/60">
              <Icon className="h-3.5 w-3.5 text-fg-muted" />
            </span>
            <span className="min-w-0 flex-1">
              <div className="text-[13px] font-medium text-fg">{c.label}</div>
              <div className="truncate font-mono text-[10px] text-fg-subtle">
                {c.hint}
              </div>
            </span>
          </button>
        );
      })}
    </div>
  );
}
