"use client";

import * as React from "react";
import { format } from "date-fns";

type Entry = { id: string; date: string; kg: number };

const W = 800;
const H = 220;
const PAD_X = 36;
const PAD_TOP = 18;
const PAD_BOTTOM = 28;

/** Smooth Catmull-Rom → bezier path through the given points. */
function smoothPath(pts: Array<{ x: number; y: number }>) {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M${pts[0].x},${pts[0].y}`;
  const d: string[] = [`M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const t = 0.18;
    const c1x = p1.x + (p2.x - p0.x) * t;
    const c1y = p1.y + (p2.y - p0.y) * t;
    const c2x = p2.x - (p3.x - p1.x) * t;
    const c2y = p2.y - (p3.y - p1.y) * t;
    d.push(
      `C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`,
    );
  }
  return d.join(" ");
}

export function WeightChart({
  entries,
  targetKg,
}: {
  entries: Entry[];
  targetKg?: number | null;
}) {
  const [hover, setHover] = React.useState<number | null>(null);

  if (entries.length === 0) {
    return (
      <div className="flex h-[180px] items-center justify-center font-mono text-[11px] text-fg-subtle">
        데이터가 모이면 여기에 차트가 표시됩니다
      </div>
    );
  }

  const ys = entries.map((e) => e.kg);
  const tgt = targetKg ?? null;
  const min = Math.floor(Math.min(...ys, tgt ?? Infinity) - 0.6);
  const max = Math.ceil(Math.max(...ys, tgt ?? -Infinity) + 0.6);
  const span = Math.max(max - min, 0.1);

  const x = (i: number) =>
    PAD_X + (i / Math.max(entries.length - 1, 1)) * (W - PAD_X * 2);
  const y = (v: number) =>
    PAD_TOP + (1 - (v - min) / span) * (H - PAD_TOP - PAD_BOTTOM);

  const pts = entries.map((e, i) => ({ x: x(i), y: y(e.kg) }));
  const path = smoothPath(pts);
  const last = pts[pts.length - 1];
  const area = `${path} L${last.x},${H - PAD_BOTTOM} L${pts[0].x},${H - PAD_BOTTOM} Z`;

  // y-axis grid lines (4 lines)
  const yTicks = [min, min + span * 0.25, min + span * 0.5, min + span * 0.75, max];
  // x-axis labels — show 1st, mid, last
  const xTicks = entries.length > 1 ? [0, Math.floor(entries.length / 2), entries.length - 1] : [0];

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="wch-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(var(--grad-1))" stopOpacity="0.35" />
            <stop offset="100%" stopColor="rgb(var(--grad-1))" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="wch-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgb(var(--grad-1))" />
            <stop offset="100%" stopColor="rgb(var(--grad-3))" />
          </linearGradient>
        </defs>

        {/* grid lines */}
        {yTicks.map((v, i) => (
          <g key={i}>
            <line
              x1={PAD_X}
              x2={W - PAD_X}
              y1={y(v)}
              y2={y(v)}
              stroke="rgb(var(--border))"
              strokeWidth="0.7"
              strokeDasharray={i === 0 || i === yTicks.length - 1 ? "" : "2 4"}
              opacity={0.6}
            />
            <text
              x={4}
              y={y(v) + 3}
              className="fill-fg-subtle"
              fontSize="9"
              fontFamily="var(--font-mono)"
            >
              {v.toFixed(1)}
            </text>
          </g>
        ))}

        {/* target weight reference line */}
        {tgt !== null && (
          <g>
            <line
              x1={PAD_X}
              x2={W - PAD_X}
              y1={y(tgt)}
              y2={y(tgt)}
              stroke="rgb(var(--grad-3))"
              strokeWidth="1.4"
              strokeDasharray="4 4"
              opacity={0.7}
            />
            <rect
              x={W - PAD_X - 70}
              y={y(tgt) - 9}
              width="68"
              height="16"
              rx="8"
              fill="rgb(var(--bg))"
              stroke="rgb(var(--grad-3))"
              strokeWidth="1"
            />
            <text
              x={W - PAD_X - 36}
              y={y(tgt) + 3}
              textAnchor="middle"
              fontSize="9"
              fontFamily="var(--font-mono)"
              className="fill-fg-muted"
            >
              목표 {tgt.toFixed(1)}kg
            </text>
          </g>
        )}

        {/* area + line */}
        <path d={area} fill="url(#wch-area)" />
        <path
          d={path}
          fill="none"
          stroke="url(#wch-line)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* dots */}
        {pts.map((p, i) => {
          const isHover = hover === i;
          return (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r={isHover ? 4.5 : 2.8}
                fill="rgb(var(--bg))"
                stroke="rgb(var(--grad-3))"
                strokeWidth={isHover ? 2 : 1.4}
                className="transition-all"
              />
              {/* invisible hover target */}
              <rect
                x={p.x - 14}
                y={0}
                width={28}
                height={H}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
            </g>
          );
        })}

        {/* x-axis labels */}
        {xTicks.map((i) => (
          <text
            key={`x-${i}`}
            x={x(i)}
            y={H - 8}
            textAnchor="middle"
            className="fill-fg-subtle"
            fontSize="9"
            fontFamily="var(--font-mono)"
          >
            {format(new Date(entries[i].date), "M/d")}
          </text>
        ))}

        {/* hover tooltip */}
        {hover !== null && (
          <g pointerEvents="none">
            <line
              x1={pts[hover].x}
              x2={pts[hover].x}
              y1={PAD_TOP}
              y2={H - PAD_BOTTOM}
              stroke="rgb(var(--fg))"
              strokeOpacity="0.15"
              strokeDasharray="2 3"
            />
            <g
              transform={`translate(${Math.min(Math.max(pts[hover].x + 8, PAD_X), W - PAD_X - 80)}, ${Math.max(pts[hover].y - 30, PAD_TOP)})`}
            >
              <rect
                width="80"
                height="32"
                rx="8"
                fill="rgb(var(--bg))"
                stroke="rgb(var(--border))"
              />
              <text x="8" y="13" fontSize="9" className="fill-fg-subtle" fontFamily="var(--font-mono)">
                {format(new Date(entries[hover].date), "yyyy.M.d")}
              </text>
              <text x="8" y="26" fontSize="13" fontWeight="600" className="fill-fg">
                {entries[hover].kg.toFixed(1)} kg
              </text>
            </g>
          </g>
        )}
      </svg>
    </div>
  );
}
