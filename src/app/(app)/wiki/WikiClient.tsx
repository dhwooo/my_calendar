"use client";

import * as React from "react";
import useSWR, { preload, mutate as globalMutate } from "swr";

const swrFetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`${r.status}`);
    return r.json();
  });

function prefetchPage(id: string) {
  preload(`/api/wiki/${id}`, swrFetcher);
}
import {
  ChevronRight,
  ChevronDown,
  ChevronLeft,
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
import { useConfirm } from "@/components/ui/confirm-dialog";

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
    fallbackData: initialPages.length > 0 ? { pages: initialPages } : undefined,
  });
  const pages = data?.pages ?? [];
  const tree = buildTree(pages);
  const studyPage = pages.find((p) => p.parentId === null && p.title === "공부");
  const confirm = useConfirm();

  const [activeId, setActiveId] = React.useState<string | null>(null);
  // Auto-select root page on desktop (mobile starts on list view)
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(min-width: 768px)").matches) {
      if (!activeId && pages.length > 0) {
        const root = pages.find((p) => p.parentId === null);
        setActiveId((root ?? pages[0]).id);
      }
    }
  }, [pages, activeId]);

  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());

  // activeId 변경 시 (자기 자신 + 조상) 자동 expand → 현재 페이지의 하위와 위치까지 트리에서 보이도록
  React.useEffect(() => {
    if (!activeId) return;
    const toExpand = new Set<string>([activeId]);
    let cur = pages.find((p) => p.id === activeId)?.parentId ?? null;
    while (cur) {
      toExpand.add(cur);
      cur = pages.find((p) => p.id === cur)?.parentId ?? null;
    }
    setExpanded((prev) => {
      const next = new Set(prev);
      let changed = false;
      toExpand.forEach((a) => {
        if (!next.has(a)) {
          next.add(a);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [activeId, pages]);
  function toggle(id: string) {
    const n = new Set(expanded);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    setExpanded(n);
  }

  const [creating, setCreating] = React.useState(false);
  async function createPage(parentId: string | null = null) {
    if (creating) return;
    setCreating(true);
    if (parentId) setExpanded(new Set([...expanded, parentId]));
    try {
      const res = await fetch("/api/wiki", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentId }),
      });
      if (!res.ok) throw new Error("create failed");
      const j = await res.json();
      // 새 페이지 본문 캐시를 미리 채워서, setActiveId 직후 에디터가 즉시 렌더되도록
      await globalMutate(`/api/wiki/${j.page.id}`, { page: j.page }, false);
      await mutate();
      // 서버 응답 후에만 activeId 변경 — 임시 ID로 인한 재마운트 충돌 방지
      setActiveId(j.page.id);
    } finally {
      setCreating(false);
    }
  }

  async function deletePage(id: string) {
    const ok = await confirm({
      title: "페이지 삭제",
      description: "이 페이지와 모든 하위 페이지가 삭제됩니다. 복구할 수 없어요.",
      confirmText: "삭제",
      tone: "destructive",
    });
    if (!ok) return;
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
        {studyPage && (
          <button
            onMouseEnter={() => prefetchPage(studyPage.id)}
            onTouchStart={() => prefetchPage(studyPage.id)}
            onClick={() => {
              setActiveId(studyPage.id);
              setExpanded(new Set([...expanded, studyPage.id]));
            }}
            className={cn(
              "mx-1 mb-2 flex items-center gap-2 rounded-lg px-2 py-2 text-left text-[12px] transition",
              activeId === studyPage.id
                ? "bg-bg-muted text-fg"
                : "border border-fg/10 bg-gradient-to-br from-[rgb(var(--grad-1))]/8 to-[rgb(var(--grad-3))]/8 text-fg hover:from-[rgb(var(--grad-1))]/14 hover:to-[rgb(var(--grad-3))]/14",
            )}
          >
            <span className="text-[14px]">{studyPage.icon ?? "📚"}</span>
            <span className="flex-1 font-medium">공부</span>
            <span className="font-mono text-[9px] uppercase tracking-wider text-fg-subtle">
              pin
            </span>
          </button>
        )}

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
            <button
              onClick={() => createPage(null)}
              className="mt-2 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[12px] text-fg-muted transition hover:bg-bg-muted hover:text-fg"
            >
              <Plus className="h-3.5 w-3.5" />
              첫 페이지 만들기
            </button>
          )}
        </div>
      </aside>

      {/* Mobile: 풀스크린 list ↔ editor (Notion 스타일) */}
      <main className="flex flex-1 flex-col overflow-hidden md:overflow-auto">
        {/* Mobile list view — activeId 없을 때만 */}
        {!activeId && (
          <div className="flex flex-1 flex-col overflow-y-auto bg-bg md:hidden">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/60 bg-bg/95 px-4 py-3 backdrop-blur">
              <h2 className="text-[15px] font-semibold tracking-tight text-fg">
                워크스페이스
              </h2>
              <button
                onClick={() => createPage(null)}
                className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-[12px] font-medium text-accent-fg"
              >
                <Plus className="h-3.5 w-3.5" />
                새 페이지
              </button>
            </div>

            <div className="flex-1 px-3 py-2">
              {pages.length === 0 ? (
                <div className="flex flex-col items-center gap-3 pt-12 text-center">
                  <FileText className="h-8 w-8 text-fg-subtle" />
                  <p className="text-[14px] text-fg-muted">아직 페이지가 없어요</p>
                  <button
                    onClick={async () => {
                      const res = await fetch("/api/wiki/seed/linux-master", {
                        method: "POST",
                      });
                      if (res.ok) await mutate();
                    }}
                    className="mt-2 flex items-center gap-2 rounded-xl border border-fg/10 bg-gradient-to-br from-[rgb(var(--grad-1))]/8 to-[rgb(var(--grad-3))]/8 px-4 py-3"
                  >
                    <span className="text-[18px]">🐧</span>
                    <span className="text-left">
                      <span className="block text-[13px] font-medium text-fg">
                        리눅스마스터 2급 2차
                      </span>
                      <span className="block font-mono text-[10px] text-fg-subtle">
                        합격 플랜 가져오기
                      </span>
                    </span>
                  </button>
                </div>
              ) : (
                <ul className="space-y-0.5">
                  {pages
                    .filter((p) => !p.parentId)
                    .map((p) => (
                      <MobilePageRow
                        key={p.id}
                        page={p}
                        allPages={pages}
                        depth={0}
                        onSelect={setActiveId}
                        onDelete={deletePage}
                        onAddChild={createPage}
                      />
                    ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Editor view (모바일: activeId 있을 때 풀스크린, 데스크탑: 항상) */}
        <div
          className={cn(
            "flex-1 overflow-y-auto",
            activeId ? "flex flex-col" : "hidden md:flex md:flex-col",
          )}
        >
          {activeId ? (
            <>
              {/* Mobile-only back bar */}
              <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-border/60 bg-bg/95 px-3 py-2 backdrop-blur md:hidden">
                <button
                  onClick={() => setActiveId(null)}
                  className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[13px] font-medium text-fg-muted hover:bg-bg-muted hover:text-fg"
                  aria-label="목록으로"
                >
                  <ChevronLeft className="h-4 w-4" />
                  목록
                </button>
              </div>
              <WikiEditor
                key={activeId}
                id={activeId}
                metaHint={pages.find((p) => p.id === activeId) ?? null}
                onMutateTree={mutate}
              />
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-fg-muted">
              <FileText className="h-8 w-8" />
              <p className="text-[14px]">왼쪽에서 페이지를 선택해주세요</p>
            </div>
          )}
        </div>
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
              {/* 아이콘 슬롯 — 기본은 이모지, hover 시 chevron (자식 있을 때만) */}
              <div className="relative h-6 w-5 shrink-0">
                <span
                  aria-hidden
                  className={cn(
                    "pointer-events-none absolute inset-0 flex items-center justify-center text-[13px] leading-none",
                    hasChildren && "transition-opacity group-hover:opacity-0",
                  )}
                >
                  {p.icon ?? <FileText className="h-3 w-3 text-fg-subtle" />}
                </span>
                {hasChildren && (
                  <button
                    type="button"
                    onClick={() => onToggle(p.id)}
                    aria-label={isOpen ? "접기" : "펼치기"}
                    className="absolute inset-0 flex items-center justify-center rounded text-fg-subtle opacity-0 transition group-hover:opacity-100 hover:text-fg"
                  >
                    {isOpen ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </button>
                )}
              </div>
              <button
                onMouseEnter={() => prefetchPage(p.id)}
                onTouchStart={() => prefetchPage(p.id)}
                onClick={() => {
                  onSelect(p.id);
                  if (hasChildren && !isOpen) onToggle(p.id);
                }}
                className="flex flex-1 items-center truncate py-1 text-left"
              >
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

function MobilePageRow({
  page,
  allPages,
  depth,
  onSelect,
  onDelete,
  onAddChild,
}: {
  page: WikiPageMeta;
  allPages: WikiPageMeta[];
  depth: number;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
}) {
  const [open, setOpen] = React.useState(true);
  const children = allPages.filter((p) => p.parentId === page.id);
  const hasChildren = children.length > 0;

  return (
    <li>
      <div
        className="group flex items-center gap-1 rounded-xl py-2.5 pr-2 active:bg-bg-muted"
        style={{ paddingLeft: 8 + depth * 16 }}
      >
        <button
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex h-7 w-7 items-center justify-center text-fg-subtle",
            !hasChildren && "opacity-30",
          )}
          aria-label="펼치기"
        >
          {open ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        <button
          onTouchStart={() => prefetchPage(page.id)}
          onMouseEnter={() => prefetchPage(page.id)}
          onClick={() => onSelect(page.id)}
          className="flex flex-1 items-center gap-2 text-left"
        >
          <span className="w-5 text-center text-[16px]">
            {page.icon ?? <FileText className="inline h-4 w-4 text-fg-subtle" />}
          </span>
          <span className="truncate text-[14px] font-medium text-fg">
            {page.title || "이름 없음"}
          </span>
        </button>
        <button
          onClick={() => onAddChild(page.id)}
          className="rounded-md p-1.5 text-fg-subtle active:bg-bg-muted active:text-fg"
          aria-label="하위 페이지"
        >
          <Plus className="h-4 w-4" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger
            className="rounded-md p-1.5 text-fg-subtle active:bg-bg-muted active:text-fg"
            aria-label="더보기"
          >
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem destructive onSelect={() => onDelete(page.id)}>
              <Trash2 className="h-3.5 w-3.5" />
              삭제
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {open && hasChildren && (
        <ul className="space-y-0.5">
          {children.map((c) => (
            <MobilePageRow
              key={c.id}
              page={c}
              allPages={allPages}
              depth={depth + 1}
              onSelect={onSelect}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
