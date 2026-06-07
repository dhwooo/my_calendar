"use client";

import * as React from "react";
import useSWR, { mutate } from "swr";
import { useSession } from "next-auth/react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { ImageIcon, Send, Trash2, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";

type Author = {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
};
type PostImage = { id: string; url: string; width?: number | null; height?: number | null };
type Comment = {
  id: string;
  content: string;
  createdAt: string;
  author: Author;
};
type Post = {
  id: string;
  content: string;
  category: string;
  createdAt: string;
  author: Author;
  images: PostImage[];
  comments: Comment[];
};

const CATEGORIES = [
  { key: "전체", value: null },
  { key: "일반", value: "일반" },
  { key: "여행", value: "여행" },
  { key: "음식", value: "음식" },
  { key: "추억", value: "추억" },
  { key: "기타", value: "기타" },
] as const;

const POST_CATEGORIES = ["일반", "여행", "음식", "추억", "기타"];

/**
 * 클라이언트 사이드 이미지 압축 — 최대 2048px, JPEG quality 0.82.
 * 큰 사진(예: 5MB)도 200~500KB 수준으로 축소돼 업로드/저장 비용을 크게 줄임.
 */
async function compressImage(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 2048;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) {
          height = Math.round((height * MAX) / width);
          width = MAX;
        } else {
          width = Math.round((width * MAX) / height);
          height = MAX;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return res(dataUrl);
      ctx.drawImage(img, 0, 0, width, height);
      // GIF는 압축 시 정지 이미지가 되므로 원본 유지
      if (file.type === "image/gif") return res(dataUrl);
      res(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = rej;
    img.src = dataUrl;
  });
}

export function BoardClient() {
  const { data: session } = useSession();
  const meId = session?.user?.id ?? null;
  const confirm = useConfirm();
  const [filterCategory, setFilterCategory] = React.useState<string | null>(null);
  const listKey = filterCategory
    ? `/api/board?category=${encodeURIComponent(filterCategory)}`
    : "/api/board";
  const { data } = useSWR<{ posts: Post[] }>(listKey);
  const posts = data?.posts ?? [];

  const [content, setContent] = React.useState("");
  const [images, setImages] = React.useState<string[]>([]);
  const [category, setCategory] = React.useState<string>("일반");
  const [posting, setPosting] = React.useState(false);
  const [compressing, setCompressing] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  async function onPickFiles(files: FileList | null) {
    if (!files) return;
    const arr = Array.from(files).slice(0, 20 - images.length);
    setCompressing(true);
    try {
      const compressed = await Promise.all(arr.map((f) => compressImage(f)));
      setImages((p) => [...p, ...compressed]);
    } finally {
      setCompressing(false);
    }
  }

  async function submit() {
    if (!content.trim() && images.length === 0) return;
    setPosting(true);
    try {
      const res = await fetch("/api/board", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content, category, images }),
      });
      if (res.ok) {
        setContent("");
        setImages([]);
        await mutate(listKey);
        // 다른 카테고리 캐시도 무효화
        await mutate(
          (k) => typeof k === "string" && k.startsWith("/api/board"),
        );
      }
    } finally {
      setPosting(false);
    }
  }

  async function deletePost(id: string) {
    const ok = await confirm({
      title: "게시물 삭제",
      description: "이 게시물과 댓글이 모두 삭제됩니다. 복구할 수 없어요.",
      confirmText: "삭제",
      tone: "destructive",
    });
    if (!ok) return;
    await fetch(`/api/board/${id}`, { method: "DELETE" });
    await mutate((k) => typeof k === "string" && k.startsWith("/api/board"));
  }

  return (
    <div className="mx-auto max-w-2xl px-3 py-4 sm:px-8 sm:py-10 anim-fade-in">
      <div className="mb-4 flex items-baseline gap-3 px-1 sm:mb-6">
        <h1 className="text-gradient text-[26px] font-semibold tracking-tight sm:text-[40px]">
          공용 게시판
        </h1>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-fg-subtle">
          board
        </span>
      </div>

      {/* Category filter tabs */}
      <div className="-mx-3 mb-4 overflow-x-auto px-3 sm:mx-0 sm:px-0">
        <div className="flex gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setFilterCategory(c.value)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-medium transition",
                filterCategory === c.value
                  ? "border-accent bg-accent text-accent-fg"
                  : "border-border bg-bg-subtle/40 text-fg-muted hover:bg-bg-muted hover:text-fg",
              )}
            >
              {c.key}
            </button>
          ))}
        </div>
      </div>

      {/* Composer */}
      <div className="mb-5 rounded-2xl border border-border/70 bg-bg-subtle/40 p-3 sm:p-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="둘만의 이야기를 남겨보세요…"
          rows={3}
          className="w-full resize-none rounded-xl border border-border/60 bg-bg p-3 text-[14px] outline-none focus:border-accent/60"
        />
        {images.length > 0 && (
          <div className="mt-2 grid grid-cols-4 gap-1.5 sm:grid-cols-5">
            {images.map((src, i) => (
              <div key={i} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=""
                  className="aspect-square w-full rounded-lg object-cover"
                />
                <button
                  onClick={() => setImages((p) => p.filter((_, j) => j !== i))}
                  className="absolute right-0.5 top-0.5 rounded-full bg-black/70 p-0.5 text-white"
                  aria-label="삭제"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-9 rounded-lg border border-border/60 bg-bg px-2 text-[12px] outline-none focus:border-accent/60"
          >
            {POST_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => onPickFiles(e.target.files)}
          />
          <Button
            variant="ghost"
            onClick={() => fileRef.current?.click()}
            disabled={images.length >= 20 || compressing}
            className="h-9 gap-1.5 rounded-lg text-[12px]"
          >
            <ImageIcon className="h-3.5 w-3.5" />
            {compressing ? "압축중..." : `사진 ${images.length}/20`}
          </Button>
          <div className="ml-auto" />
          <Button
            onClick={submit}
            disabled={posting || compressing || (!content.trim() && images.length === 0)}
            className="h-9 gap-1.5 rounded-lg"
          >
            <Send className="h-3.5 w-3.5" />
            {posting ? "올리는 중..." : "올리기"}
          </Button>
        </div>
      </div>

      {/* List */}
      {posts.length === 0 ? (
        <p className="py-12 text-center font-mono text-[12px] text-fg-subtle">
          첫 게시물을 남겨보세요
        </p>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} meId={meId} onDelete={deletePost} />
          ))}
        </div>
      )}
    </div>
  );
}

function PostCard({
  post,
  meId,
  onDelete,
}: {
  post: Post;
  meId: string | null;
  onDelete: (id: string) => void;
}) {
  const isMine = post.author.id === meId;
  const [commentText, setCommentText] = React.useState("");
  const [showComments, setShowComments] = React.useState(false);
  const [commenting, setCommenting] = React.useState(false);
  const [viewer, setViewer] = React.useState<number | null>(null);
  const confirm = useConfirm();

  async function addComment() {
    const v = commentText.trim();
    if (!v) return;
    setCommenting(true);
    try {
      await fetch(`/api/board/${post.id}/comments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: v }),
      });
      setCommentText("");
      await mutate((k) => typeof k === "string" && k.startsWith("/api/board"));
    } finally {
      setCommenting(false);
    }
  }
  async function deleteComment(cid: string) {
    const ok = await confirm({
      title: "댓글 삭제",
      description: "이 댓글을 삭제할까요?",
      confirmText: "삭제",
      tone: "destructive",
    });
    if (!ok) return;
    await fetch(`/api/board/${post.id}/comments/${cid}`, { method: "DELETE" });
    await mutate((k) => typeof k === "string" && k.startsWith("/api/board"));
  }

  return (
    <article className="rounded-2xl border border-border/70 bg-bg p-3 shadow-sm sm:p-4">
      <header className="mb-2.5 flex items-center gap-2.5">
        <Avatar
          name={post.author.name ?? post.author.username ?? "?"}
          src={post.author.image}
          size={32}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-medium text-fg">
              {post.author.name ?? post.author.username}
            </span>
            <span className="rounded-full bg-bg-muted px-1.5 py-0.5 font-mono text-[9px] text-fg-muted">
              {post.category || "일반"}
            </span>
          </div>
          <div className="font-mono text-[10px] text-fg-subtle">
            {formatDistanceToNow(new Date(post.createdAt), {
              addSuffix: true,
              locale: ko,
            })}
          </div>
        </div>
        {isMine && (
          <button
            onClick={() => onDelete(post.id)}
            className="rounded-md p-1.5 text-fg-subtle hover:bg-red-500/10 hover:text-red-500"
            aria-label="삭제"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </header>

      {post.content && (
        <p className="mb-2.5 whitespace-pre-wrap break-words text-[14px] leading-relaxed text-fg">
          {post.content}
        </p>
      )}

      {post.images.length > 0 && (
        <div
          className={cn(
            "mb-2.5 grid gap-1",
            post.images.length === 1
              ? "grid-cols-1"
              : post.images.length === 2
                ? "grid-cols-2"
                : "grid-cols-3",
          )}
        >
          {post.images.map((img, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={img.id}
              src={img.url}
              alt=""
              loading="lazy"
              decoding="async"
              onClick={() => setViewer(i)}
              className={cn(
                "w-full cursor-zoom-in object-cover transition hover:opacity-90",
                post.images.length === 1
                  ? "max-h-[420px] rounded-xl"
                  : "aspect-square rounded-lg",
              )}
            />
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 border-t border-border/40 pt-2">
        <button
          onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] text-fg-muted hover:bg-bg-muted"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          댓글 {post.comments.length}
        </button>
      </div>

      {showComments && (
        <div className="mt-2.5 space-y-2 border-t border-border/40 pt-2.5">
          {post.comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2">
              <Avatar
                name={c.author.name ?? c.author.username ?? "?"}
                src={c.author.image}
                size={22}
              />
              <div className="min-w-0 flex-1 rounded-xl bg-bg-subtle/60 px-3 py-2">
                <div className="mb-0.5 flex items-baseline gap-2">
                  <span className="text-[11px] font-medium text-fg">
                    {c.author.name ?? c.author.username}
                  </span>
                  <span className="font-mono text-[9px] text-fg-subtle">
                    {formatDistanceToNow(new Date(c.createdAt), {
                      addSuffix: true,
                      locale: ko,
                    })}
                  </span>
                </div>
                <p className="whitespace-pre-wrap break-words text-[12px] text-fg">{c.content}</p>
              </div>
              {c.author.id === meId && (
                <button
                  onClick={() => deleteComment(c.id)}
                  className="rounded-md p-1 text-fg-subtle hover:text-red-500"
                  aria-label="삭제"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}

          <div className="mt-2 flex gap-2">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addComment()}
              placeholder="댓글 추가..."
              className="h-9 flex-1 rounded-xl border border-border/60 bg-bg-subtle/40 px-3 text-[13px] outline-none focus:border-accent/60"
            />
            <Button
              onClick={addComment}
              disabled={commenting || !commentText.trim()}
              className="h-9 rounded-xl"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Image viewer overlay */}
      {viewer !== null && (
        <div
          onClick={() => setViewer(null)}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.images[viewer].url}
            alt=""
            className="max-h-full max-w-full object-contain"
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              setViewer(null);
            }}
            className="absolute right-4 top-4 rounded-full bg-white/20 p-2 text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </article>
  );
}
