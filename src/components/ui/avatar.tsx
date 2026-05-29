"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Props = {
  name?: string | null;
  src?: string | null;
  size?: number;
  className?: string;
};

/**
 * Elegant default avatar:
 * - If `src` is given, renders the image.
 * - Otherwise renders a subtle gradient ring around a refined silhouette glyph.
 *   Initials are layered on top for personalization.
 */
export function Avatar({ name, src, size = 36, className }: Props) {
  const initial = (name ?? "?").trim().charAt(0).toUpperCase();

  return (
    <div
      className={cn(
        "relative flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full",
        "bg-gradient-to-br from-[rgb(var(--grad-1))]/30 via-[rgb(var(--grad-2))]/30 to-[rgb(var(--grad-3))]/40",
        "ring-1 ring-inset ring-fg/10",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name ?? "avatar"}
          className="h-full w-full object-cover"
        />
      ) : (
        <>
          <SilhouetteGlyph />
          <span
            className="absolute font-medium text-fg"
            style={{ fontSize: Math.max(10, size * 0.38) }}
          >
            {initial}
          </span>
        </>
      )}
    </div>
  );
}

function SilhouetteGlyph() {
  // A discreet head/shoulders silhouette in low contrast.
  return (
    <svg
      viewBox="0 0 40 40"
      className="absolute inset-0 h-full w-full text-fg/15"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="20" cy="15" r="6.5" fill="currentColor" />
      <path
        d="M6 36c2.2-7.5 7.7-11 14-11s11.8 3.5 14 11"
        fill="currentColor"
      />
    </svg>
  );
}
