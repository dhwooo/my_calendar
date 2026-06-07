"use client";

import * as React from "react";
import useSWR from "swr";
import { Smile } from "lucide-react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";

type FullPage = {
  id: string;
  title: string;
  content: string;
  icon: string | null;
};

const EMOJIS = [
  "📝", "📄", "📚", "🌱", "💡", "🔥", "⭐", "🎯",
  "🧠", "💼", "🍳", "✈️", "🏠", "💖", "☕", "🎨",
  "🐧", "🏅", "🌐", "⚙️", "📋", "🎉", "🥗", "🛠️",
];

type ChildPage = { id: string; title: string; icon: string | null };

export function WikiEditor({
  id,
  onMutateTree,
  children,
  onSelectChild,
  onAddChild,
}: {
  id: string;
  onMutateTree: () => void;
  children?: ChildPage[];
  onSelectChild?: (id: string) => void;
  onAddChild?: (parentId: string) => void;
}) {
  const { data } = useSWR<{ page: FullPage }>(`/api/wiki/${id}`);
  const [title, setTitle] = React.useState("");
  const [icon, setIcon] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(true);
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null);

  const editor = useCreateBlockNote({});

  // 페이지 변경 시 새 콘텐츠 로드
  React.useEffect(() => {
    if (!data?.page) return;
    setTitle(data.page.title);
    setIcon(data.page.icon);
    (async () => {
      const md = data.page.content ?? "";
      const blocks = md
        ? await editor.tryParseMarkdownToBlocks(md)
        : [{ type: "paragraph" as const }];
      editor.replaceBlocks(editor.document, blocks);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.page?.id]);

  const persist = React.useCallback(
    (patch: Partial<{ title: string; content: string; icon: string | null }>) => {
      setSaved(false);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        await fetch(`/api/wiki/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        setSaved(true);
        onMutateTree();
      }, 600);
    },
    [id, onMutateTree],
  );

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col px-5 py-6 sm:px-10 sm:py-10">
      {/* Icon + Title */}
      <div className="mb-4 flex items-start gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-bg-subtle/40 text-[26px] hover:bg-bg-muted"
              aria-label="아이콘 변경"
            >
              {icon ?? <Smile className="h-5 w-5 text-fg-subtle" />}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="grid w-[280px] grid-cols-8 gap-1 p-2">
            <button
              onClick={() => {
                setIcon(null);
                persist({ icon: null });
              }}
              className="col-span-8 mb-1 rounded-md py-1 text-[11px] text-fg-muted hover:bg-bg-muted"
            >
              제거
            </button>
            {EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => {
                  setIcon(e);
                  persist({ icon: e });
                }}
                className="flex h-9 w-9 items-center justify-center rounded-md text-[20px] hover:bg-bg-muted"
              >
                {e}
              </button>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            persist({ title: e.target.value });
          }}
          placeholder="제목 없음"
          className="flex-1 bg-transparent text-[28px] font-semibold tracking-tight text-fg outline-none placeholder:text-fg-subtle sm:text-[34px]"
        />
        <span className="mt-3 shrink-0 font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
          {saved ? "저장됨" : "저장중…"}
        </span>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto">
        <BlockNoteView
          editor={editor}
          theme="light"
          onChange={async () => {
            const md = await editor.blocksToMarkdownLossy();
            persist({ content: md });
          }}
        />
      </div>
    </div>
  );
}
