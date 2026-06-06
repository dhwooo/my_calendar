"use client";

import * as React from "react";
import useSWR from "swr";
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Plus,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import { WikiEditor } from "@/components/wiki/WikiEditor";

export type WikiPageMeta = {
  id: string;
  parentId: string | null;
  title: string;
  icon: string | null;
  updatedAt: string;
};

function buildTree(pages: WikiPageMeta[]) {
  const byParent = new Map<string | null, WikiPageMeta[]>();
  for (const p of pages) {
    const key = p.parentId;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(p);
  }
  return byParent;
}

export function WikiClient({
  initialPages,
}: {
  initialPages: WikiPageMeta[];
}) {
  const { data, mutate } = useSWR<{ pages: WikiPageMeta[] }>("/api/wiki", {
    fallbackData: { pages: initialPages },
    revalidateOnMount: false,
  });
  const pages = data?.pages ?? [];
  const tree = buildTree(pages);

  const [activeId, setActiveId] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!activeId && pages.length > 0) setActiveId(pages[0].id);
  }, [pages, activeId]);

  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());
  function toggle(id: string) {
    const n = new Set(expanded);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    setExpanded(n);
  }

  async function createPage(parentId: string | null = null) {
    const tempId = `tmp-${Date.now()}`;
    const optimistic: WikiPageMeta = {
      id: tempId,
      parentId,
      title: "새 페이지",
      icon: null,
      updatedAt: new Date().toISOString(),
    };
    setActiveId(tempId);
    if (parentId) setExpanded(new Set([...expanded, parentId]));

    await mutate(
      async () => {
        const res = await fetch("/api/wiki", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ parentId }),
        });
        if (!res.ok) throw new Error("create failed");
        const j = await res.json();
        setActiveId(j.page.id);
        return { pages: [...pages.filter((p) => p.id !== tempId), j.page] };
      },
      {
        optimisticData: { pages: [...pages, optimistic] },
        rollbackOnError: true,
        revalidate: false,
      },
    );
  }

  async function deletePage(id: string) {
    if (!confirm("이 페이지와 하위 페이지가 삭제됩니다. 계속할까요?")) return;
    await fetch(`/api/wiki/${id}`, { method: "DELETE" });
    await mutate();
    if (activeId === id) setActiveId(null);
  }

  return (
    <div className="flex h-[calc(100dvh-3.5rem-env(safe-area-inset-top))] anim-fade-in">
      {/* Sidebar */}
      <aside className="hidden w-[260px] shrink-0 flex-col border-r border-border/60 bg-bg-subtle/30 px-3 py-4 md:flex">
        <div className="mb-3 flex items-center justify-between px-2">
          <h2 className="text-[12px] font-medium tracking-tight text-fg">
            워크스페이스
          </h2>
          <button
            onClick={() => createPage(null)}
            className="rounded-md p-1 text-fg-muted hover:bg-bg-muted hover:text-fg"
            aria-label="새 페이지"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex-1 overflow-auto">
          <PageTree
            tree={tree}
            parentId={null}
            depth={0}
            expanded={expanded}
            activeId={activeId}
            onSelect={setActiveId}
            onToggle={toggle}
            onAddChild={createPage}
            onDelete={deletePage}
          />
          {pages.length === 0 && (
            <div className="mt-2 space-y-2">
              <button
                onClick={() => createPage(null)}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[12px] text-fg-muted transition hover:bg-bg-muted hover:text-fg"
              >
                <Plus className="h-3.5 w-3.5" />
                첫 페이지 만들기
              </button>
              <button
                onClick={async () => {
                  const res = await fetch("/api/wiki/seed/linux-master", {
                    method: "POST",
                  });
                  if (res.ok) await mutate();
                }}
                className="flex w-full items-center gap-2 rounded-lg border border-fg/10 bg-gradient-to-br from-[rgb(var(--grad-1))]/8 to-[rgb(var(--grad-3))]/8 px-2.5 py-2.5 text-left text-[12px] text-fg transition hover:from-[rgb(var(--grad-1))]/12 hover:to-[rgb(var(--grad-3))]/12"
              >
                <span className="text-[16px]">🐧</span>
                <span className="flex-1">
                  <span className="block font-medium">리눅스마스터 2급 2차</span>
                  <span className="block font-mono text-[10px] text-fg-subtle">
                    합격 플랜 가져오기
                  </span>
                </span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile: page selector */}
      <div className="flex w-full overflow-auto border-b border-border/60 bg-bg-subtle/30 px-3 py-2 md:hidden">
        {pages.length === 0 ? (
          <button
            onClick={() => createPage(null)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium text-fg-muted hover:bg-bg-muted hover:text-fg"
          >
            <Plus className="h-3.5 w-3.5" />첫 페이지
          </button>
        ) : (
          <div className="flex gap-1.5">
            {pages.map((p) => (
              <button
                key={p.id}
                onClick={() => setActiveId(p.id)}
                className={cn(
                  "shrink-0 rounded-lg px-3 py-1.5 text-[12px] font-medium transition",
                  activeId === p.id
                    ? "bg-bg text-fg shadow-sm"
                    : "text-fg-muted hover:bg-bg-muted",
                )}
              >
                {p.icon ? `${p.icon} ` : ""}
                {p.title || "이름 없음"}
              </button>
            ))}
            <button
              onClick={() => createPage(null)}
              className="shrink-0 rounded-lg p-1.5 text-fg-muted hover:bg-bg-muted hover:text-fg"
              aria-label="새 페이지"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Editor */}
      <main className="flex-1 overflow-auto">
        {activeId ? (
          <WikiEditor key={activeId} id={activeId} onMutateTree={mutate} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-fg-muted">
            <FileText className="h-8 w-8" />
            <p className="text-[14px]">왼쪽에서 페이지를 선택해주세요</p>
          </div>
        )}
      </main>
    </div>
  );
}

function PageTree({
  tree,
  parentId,
  depth,
  expanded,
  activeId,
  onSelect,
  onToggle,
  onAddChild,
  onDelete,
}: {
  tree: Map<string | null, WikiPageMeta[]>;
  parentId: string | null;
  depth: number;
  expanded: Set<string>;
  activeId: string | null;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  onAddChild: (parentId: string) => void;
  onDelete: (id: string) => void;
}) {
  const items = tree.get(parentId) ?? [];
  if (items.length === 0) return null;

  return (
    <div>
      {items.map((p) => {
        const children = tree.get(p.id) ?? [];
        const isOpen = expanded.has(p.id);
        const hasChildren = children.length > 0;
        return (
          <div key={p.id}>
            <div
              className={cn(
                "group flex items-center gap-1 rounded-lg pr-1 text-[13px] transition",
                activeId === p.id ? "bg-bg-muted text-fg" : "text-fg-muted hover:bg-bg-muted/70",
              )}
              style={{ paddingLeft: 4 + depth * 14 }}
            >
              <button
                onClick={() => onToggle(p.id)}
                className={cn(
                  "flex h-6 w-5 items-center justify-center text-fg-subtle hover:text-fg",
                  !hasChildren && "opacity-30",
                )}
              >
                {isOpen ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </button>
              <button
                onClick={() => onSelect(p.id)}
                className="flex flex-1 items-center gap-1.5 truncate py-1 text-left"
              >
                <span className="w-4 text-center">
                  {p.icon ?? <FileText className="inline h-3 w-3 text-fg-subtle" />}
                </span>
                <span className="truncate">{p.title || "이름 없음"}</span>
              </button>
              <button
                onClick={() => onAddChild(p.id)}
                className="rounded p-0.5 text-fg-subtle opacity-0 transition group-hover:opacity-100 hover:bg-bg hover:text-fg"
                aria-label="하위 페이지"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger className="rounded p-0.5 text-fg-subtle opacity-0 transition group-hover:opacity-100 hover:bg-bg hover:text-fg">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem destructive onSelect={() => onDelete(p.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                    삭제
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {isOpen && (
              <PageTree
                tree={tree}
                parentId={p.id}
                depth={depth + 1}
                expanded={expanded}
                activeId={activeId}
                onSelect={onSelect}
                onToggle={onToggle}
                onAddChild={onAddChild}
                onDelete={onDelete}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
