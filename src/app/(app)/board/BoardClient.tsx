"use client";

import * as React from "react";
import useSWR, { mutate } from "swr";
import { useSession } from "next-auth/react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { ImageIcon, Send, Trash2, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
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
  createdAt: string;
  author: Author;
  images: PostImage[];
  comments: Comment[];
};

export function BoardClient() {
  const { data: session } = useSession();
  const meId = session?.user?.id ?? null;
  const { data } = useSWR<{ posts: Post[] }>("/api/board");
  const posts = data?.posts ?? [];

  const [content, setContent] = React.useState("");
  const [images, setImages] = React.useState<string[]>([]);
  const [posting, setPosting] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  async function onPickFiles(files: FileList | null) {
    if (!files) return;
    const arr = Array.from(files).slice(0, 8 - images.length);
    const dataUrls = await Promise.all(
      arr.map(
        (f) =>
          new Promise<string>((res, rej) => {
            const r = new FileReader();
            r.onload = () => res(r.result as string);
            r.onerror = rej;
            r.readAsDataURL(f);
          }),
      ),
    );
    setImages((p) => [...p, ...dataUrls]);
  }

  async function submit() {
    if (!content.trim() && images.length === 0) return;
    setPosting(true);
    try {
      const res = await fetch("/api/board", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content, images }),
      });
      if (res.ok) {
        setContent("");
        setImages([]);
        await mutate("/api/board");
      }
    } finally {
      setPosting(false);
    }
  }

  async function deletePost(id: string) {
    if (!confirm("이 게시물을 삭제할까요?")) return;
    await fetch(`/api/board/${id}`, { method: "DELETE" });
    await mutate("/api/board");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-8 sm:py-10 anim-fade-in">
      <div className="mb-6 flex items-baseline gap-3">
        <h1 className="text-gradient text-[32px] font-semibold tracking-tight sm:text-[40px]">
          공용 게시판
        </h1>
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-subtle">
          board
        </span>
      </div>

      {/* Composer */}
      <div className="mb-6 rounded-2xl border border-border/70 bg-bg-subtle/40 p-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="둘만의 이야기를 남겨보세요…"
          rows={3}
          className="w-full resize-none rounded-xl border border-border/60 bg-bg p-3 text-[14px] outline-none focus:border-accent/60"
        />
        {images.length > 0 && (
          <div className="mt-3 grid grid-cols-4 gap-2">
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
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
                  aria-label="삭제"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="mt-3 flex items-center justify-between">
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
            disabled={images.length >= 8}
            className="gap-2 rounded-xl text-[12px]"
          >
            <ImageIcon className="h-4 w-4" />
            사진 ({images.length}/8)
          </Button>
          <Button
            onClick={submit}
            disabled={posting || (!content.trim() && images.length === 0)}
            className="gap-2 rounded-xl"
          >
            <Send className="h-4 w-4" />
            {posting ? "올리는 중..." : "올리기"}
          </Button>
        </div>
      </div>

      {/* List */}
      {posts.length === 0 ? (
        <p className="py-16 text-center font-mono text-[12px] text-fg-subtle">
          첫 게시물을 남겨보세요
        </p>
      ) : (
        <div className="space-y-4">
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
      await mutate("/api/board");
    } finally {
      setCommenting(false);
    }
  }
  async function deleteComment(cid: string) {
    if (!confirm("댓글을 삭제할까요?")) return;
    await fetch(`/api/board/${post.id}/comments/${cid}`, { method: "DELETE" });
    await mutate("/api/board");
  }

  return (
    <article className="rounded-2xl border border-border/70 bg-bg p-4 shadow-sm">
      <header className="mb-3 flex items-center gap-3">
        <Avatar
          name={post.author.name ?? post.author.username ?? "?"}
          src={post.author.image}
          size={36}
        />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium text-fg">
            {post.author.name ?? post.author.username}
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
        <p className="mb-3 whitespace-pre-wrap text-[14px] leading-relaxed text-fg">
          {post.content}
        </p>
      )}

      {post.images.length > 0 && (
        <div
          className={cn(
            "mb-3 grid gap-1.5",
            post.images.length === 1
              ? "grid-cols-1"
              : post.images.length === 2
                ? "grid-cols-2"
                : "grid-cols-3",
          )}
        >
          {post.images.map((img) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={img.id}
              src={img.url}
              alt=""
              className="aspect-square w-full rounded-xl object-cover"
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
        <div className="mt-3 space-y-2 border-t border-border/40 pt-3">
          {post.comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2">
              <Avatar
                name={c.author.name ?? c.author.username ?? "?"}
                src={c.author.image}
                size={24}
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
                <p className="whitespace-pre-wrap text-[12px] text-fg">{c.content}</p>
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

          <div className="mt-3 flex gap-2">
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
    </article>
  );
}
