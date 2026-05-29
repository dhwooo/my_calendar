"use client";

import * as React from "react";
import useSWR from "swr";
import { Eye, Pencil, Smile } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import { cn } from "@/lib/utils";
import { MarkdownView } from "./MarkdownView";
import { SlashMenu, type SlashCommand } from "./SlashMenu";

type FullPage = {
  id: string;
  title: string;
  content: string;
  icon: string | null;
};

const EMOJIS = [
  "📝", "📄", "📚", "🌱", "💡", "🔥", "⭐", "🎯",
  "🧠", "💼", "🍳", "✈️", "🏠", "💖", "☕", "🎨",
];

type Mode = "edit" | "view";

export function WikiEditor({
  id,
  onMutateTree,
}: {
  id: string;
  onMutateTree: () => void;
}) {
  const { data } = useSWR<{ page: FullPage }>(`/api/wiki/${id}`);
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [icon, setIcon] = React.useState<string | null>(null);
  const [mode, setMode] = React.useState<Mode>("view");
  const [saved, setSaved] = React.useState(true);
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Slash menu state
  const [slashState, setSlashState] = React.useState<{
    query: string;
    pos: { top: number; left: number };
    start: number;
  } | null>(null);

  React.useEffect(() => {
    if (data?.page) {
      setTitle(data.page.title);
      setContent(data.page.content);
      setIcon(data.page.icon);
      setMode(data.page.content ? "view" : "edit");
    }
  }, [data?.page?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = React.useCallback(
    (next: { title?: string; content?: string; icon?: string | null }) => {
      setSaved(false);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        await fetch(`/api/wiki/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(next),
        });
        setSaved(true);
        onMutateTree();
      }, 400);
    },
    [id, onMutateTree],
  );

  // Detect slash on textarea
  function onTextareaInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    setContent(value);
    save({ content: value });

    const ta = textareaRef.current;
    if (!ta) return;
    const caret = ta.selectionStart;
    // Look back from caret for "/" not preceded by non-space (i.e. start of a line)
    const before = value.slice(0, caret);
    const slashIdx = Math.max(
      before.lastIndexOf("\n/"),
      before.startsWith("/") ? 0 : -1,
    );
    if (slashIdx === -1) {
      // also support "/" right after newline
      const m = before.match(/(^|\n)\/(\S*)$/);
      if (!m) {
        setSlashState(null);
        return;
      }
      const start = before.length - m[2].length - 1;
      openSlash(start, m[2]);
      return;
    }
    const start = slashIdx === 0 ? 0 : slashIdx + 1; // skip the leading "\n"
    const afterSlash = value.slice(start + 1, caret);
    if (afterSlash.includes(" ") || afterSlash.includes("\n")) {
      setSlashState(null);
      return;
    }
    openSlash(start, afterSlash);
  }

  function openSlash(start: number, query: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const rect = ta.getBoundingClientRect();
    // Approximate caret position using a hidden mirror
    const { x, y } = measureCaret(ta);
    setSlashState({
      query,
      pos: {
        top: Math.min(rect.bottom - 40, rect.top + y + 24),
        left: Math.min(rect.right - 290, rect.left + x),
      },
      start,
    });
  }

  function applyCommand(cmd: SlashCommand) {
    if (!slashState) return;
    const ta = textareaRef.current;
    if (!ta) return;

    const caret = ta.selectionStart;
    const before = content.slice(0, slashState.start);
    const after = content.slice(caret);
    const [pre, post] = cmd.insert.split("{|}");
    const newContent = `${before}${pre ?? ""}${post ?? ""}${after}`;
    const newCaret = before.length + (pre?.length ?? 0);

    setContent(newContent);
    save({ content: newContent });
    setSlashState(null);

    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(newCaret, newCaret);
    });
  }

  if (!data?.page) {
    return (
      <div className="px-8 py-12">
        <div className="h-10 w-1/2 animate-pulse rounded bg-bg-muted" />
        <div className="mt-6 h-4 w-full animate-pulse rounded bg-bg-muted" />
        <div className="mt-2 h-4 w-4/5 animate-pulse rounded bg-bg-muted" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[820px] px-5 py-8 sm:px-12 sm:py-12">
      {/* Toolbar */}
      <div className="mb-3 flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex h-12 w-12 items-center justify-center rounded-xl text-[28px] hover:bg-bg-muted"
              aria-label="아이콘"
            >
              {icon ?? <Smile className="h-6 w-6 text-fg-subtle" />}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[300px] p-3">
            <div className="grid grid-cols-8 gap-1">
              {EMOJIS.map((em) => (
                <button
                  key={em}
                  onClick={() => {
                    setIcon(em);
                    save({ icon: em });
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-[20px] hover:bg-bg-muted"
                >
                  {em}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setIcon(null);
                save({ icon: null });
              }}
              className="mt-2 w-full rounded-lg py-1.5 text-[11px] text-fg-muted hover:bg-bg-muted"
            >
              아이콘 제거
            </button>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="ml-auto flex items-center gap-1">
          <div className="flex rounded-lg bg-bg-muted/70 p-1">
            <button
              onClick={() => setMode("view")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-medium transition",
                mode === "view"
                  ? "bg-bg text-fg shadow-sm"
                  : "text-fg-muted hover:text-fg",
              )}
            >
              <Eye className="h-3 w-3" />
              보기
            </button>
            <button
              onClick={() => {
                setMode("edit");
                requestAnimationFrame(() => textareaRef.current?.focus());
              }}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-medium transition",
                mode === "edit"
                  ? "bg-bg text-fg shadow-sm"
                  : "text-fg-muted hover:text-fg",
              )}
            >
              <Pencil className="h-3 w-3" />
              편집
            </button>
          </div>
          <span className="ml-2 font-mono text-[10px] text-fg-subtle">
            {saved ? "저장됨" : "저장 중..."}
          </span>
        </div>
      </div>

      {/* Title */}
      <input
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          save({ title: e.target.value });
        }}
        placeholder="제목 없음"
        className="mb-4 w-full bg-transparent text-[40px] font-semibold leading-tight tracking-tight text-fg outline-none placeholder:text-fg-subtle/50"
      />

      {/* Edit / View */}
      {mode === "edit" ? (
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={onTextareaInput}
            onKeyDown={(e) => {
              if (e.key === "Escape") setSlashState(null);
            }}
            onBlur={() => setTimeout(() => setSlashState(null), 100)}
            placeholder="여기서부터 작성. `/` 누르면 명령 메뉴."
            spellCheck={false}
            className="min-h-[60vh] w-full resize-none bg-transparent text-[15px] leading-[1.75] text-fg outline-none placeholder:text-fg-subtle/60"
          />
          {slashState && (
            <SlashMenu
              query={slashState.query}
              position={slashState.pos}
              onSelect={applyCommand}
              onClose={() => setSlashState(null)}
            />
          )}
        </div>
      ) : (
        <div
          onClick={() => {
            setMode("edit");
            requestAnimationFrame(() => textareaRef.current?.focus());
          }}
          className="cursor-text"
        >
          <MarkdownView content={content} />
        </div>
      )}
    </div>
  );
}

/** Lightweight caret position measurement via mirrored span. */
function measureCaret(ta: HTMLTextAreaElement) {
  const div = document.createElement("div");
  const styles = window.getComputedStyle(ta);
  const props = [
    "boxSizing",
    "width",
    "height",
    "overflowX",
    "overflowY",
    "borderTopWidth",
    "borderRightWidth",
    "borderBottomWidth",
    "borderLeftWidth",
    "paddingTop",
    "paddingRight",
    "paddingBottom",
    "paddingLeft",
    "fontStyle",
    "fontVariant",
    "fontWeight",
    "fontStretch",
    "fontSize",
    "fontSizeAdjust",
    "lineHeight",
    "fontFamily",
    "textAlign",
    "textTransform",
    "textIndent",
    "textDecoration",
    "letterSpacing",
    "wordSpacing",
    "tabSize",
    "MozTabSize",
    "whiteSpace",
    "wordWrap",
  ] as const;
  for (const p of props) {
    // @ts-expect-error styles index
    div.style[p] = styles[p];
  }
  div.style.position = "absolute";
  div.style.visibility = "hidden";
  div.style.whiteSpace = "pre-wrap";
  div.style.wordWrap = "break-word";
  div.textContent = ta.value.substring(0, ta.selectionStart);
  const span = document.createElement("span");
  span.textContent = "•";
  div.appendChild(span);
  document.body.appendChild(div);
  const x = span.offsetLeft;
  const y = span.offsetTop;
  document.body.removeChild(div);
  return { x, y };
}
