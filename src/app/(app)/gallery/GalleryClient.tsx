"use client";

import * as React from "react";
import useSWR from "swr";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type Photo = {
  id: string;
  url: string;
  width: number | null;
  height: number | null;
  caption: string | null;
};

const MAX_DIM = 1600;
const QUALITY = 0.86;

async function compress(file: File): Promise<{
  dataUrl: string;
  width: number;
  height: number;
}> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  const dataUrl = canvas.toDataURL("image/jpeg", QUALITY);
  return { dataUrl, width: w, height: h };
}

export function GalleryClient({
  initialPhotos,
}: {
  initialPhotos: Photo[];
}) {
  const { data, mutate } = useSWR<{ photos: Photo[] }>("/api/photos", {
    fallbackData: { photos: initialPhotos },
    revalidateOnMount: false,
  });
  const photos = data?.photos ?? [];
  const [uploading, setUploading] = React.useState(false);
  const [preview, setPreview] = React.useState<Photo | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const compressed = await compress(file);
        await fetch("/api/photos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(compressed),
        });
      }
      await mutate();
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-6 sm:px-8 sm:py-10 anim-fade-in">
      <div className="mb-6 flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h1 className="text-gradient text-[32px] font-semibold tracking-tight sm:text-[40px]">
            갤러리
          </h1>
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-subtle">
            gallery
          </span>
        </div>
        <Button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="h-10 gap-2 rounded-xl"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImagePlus className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">사진 추가</span>
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
      </div>

      {photos.length === 0 ? (
        <button
          onClick={() => inputRef.current?.click()}
          className="flex h-72 w-full flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border bg-bg-subtle/40 text-fg-muted transition hover:border-fg/30 hover:bg-bg-subtle/70"
        >
          <ImagePlus className="h-7 w-7" />
          <div className="text-center">
            <p className="text-[14px] font-medium text-fg">
              첫 사진을 올려보세요
            </p>
            <p className="mt-1 font-mono text-[10px] text-fg-subtle">
              JPEG · PNG · WEBP / 자동으로 {MAX_DIM}px 이하로 최적화됩니다
            </p>
          </div>
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((p) => (
            <button
              key={p.id}
              onClick={() => setPreview(p)}
              className={cn(
                "group relative aspect-square overflow-hidden rounded-2xl bg-bg-muted",
                "anim-fade-in",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt={p.caption ?? ""}
                loading="lazy"
                className="h-full w-full object-cover transition group-hover:scale-105"
              />
            </button>
          ))}
        </div>
      )}

      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md anim-fade-in"
          onClick={() => setPreview(null)}
        >
          <button
            aria-label="닫기"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={() => setPreview(null)}
            style={{ top: "calc(env(safe-area-inset-top) + 1rem)" }}
          >
            <X className="h-5 w-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview.url}
            alt={preview.caption ?? ""}
            className="max-h-full max-w-full rounded-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
