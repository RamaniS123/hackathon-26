"use client";

import type { Mode } from "@/lib/types";

export function ModeBadge({ mode, size = "md" }: { mode: Mode; size?: "sm" | "md" }) {
  const pad = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";
  return (
    <span
      className={`rounded-full font-bold uppercase tracking-wide ${pad} ${
        mode === "live" ? "mode-pill-live" : "mode-pill-mock"
      }`}
    >
      {mode === "live" ? "LIVE AI" : "MOCK DEMO"}
    </span>
  );
}
