import { cn } from "@/lib/utils";

/**
 * Brand mark — a refined monogram of "P" (Private) constructed from two
 * arcs. Codex풍의 그라데이션 텍스트와 어울리도록 stroke-only로 디자인했어요.
 */
export function Logo({
  size = 24,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn("inline-block", className)}
    >
      <defs>
        <linearGradient id="logo-stroke" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="rgb(var(--grad-1))" />
          <stop offset="0.5" stopColor="rgb(var(--grad-2))" />
          <stop offset="1" stopColor="rgb(var(--grad-3))" />
        </linearGradient>
      </defs>
      {/* Outer circle */}
      <circle
        cx="16"
        cy="16"
        r="13"
        stroke="url(#logo-stroke)"
        strokeWidth="1.6"
      />
      {/* Inner P loop */}
      <path
        d="M12 22 L12 10 L18 10 A4 4 0 0 1 18 18 L12 18"
        stroke="url(#logo-stroke)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Dot — lock indicator */}
      <circle cx="22" cy="22" r="1.4" fill="url(#logo-stroke)" />
    </svg>
  );
}
