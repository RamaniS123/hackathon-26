"use client";

import type { DiagramContent } from "@/lib/types";

export function DiagramView({ content }: { content: DiagramContent }) {
  if (content.layout === "chain") {
    return (
      <div className="space-y-3">
        <p className="text-sm font-semibold text-[var(--mint)]">{content.title}</p>
        <p className="text-[10px] uppercase tracking-wide text-[var(--text-faint)]">
          Layout: chain
        </p>
        <ol className="space-y-2">
          {content.nodes.map((node, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[rgba(110,231,197,0.45)] bg-[var(--mint-dim)] text-xs font-bold text-[var(--mint)]">
                {i + 1}
              </span>
              <span className="text-sm text-[var(--text)]">{node}</span>
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap items-center gap-1 pt-1 text-[var(--mint)]">
          {content.nodes.map((_, i) => (
            <span key={i} className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-[var(--mint)]" />
              {i < content.nodes.length - 1 && (
                <span className="text-xs text-[var(--text-faint)]">→</span>
              )}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (content.layout === "split") {
    const left = content.nodes[0] ?? "";
    const right = content.nodes[1] ?? "";
    return (
      <div className="space-y-3">
        <p className="text-sm font-semibold text-[var(--mint)]">{content.title}</p>
        <p className="text-[10px] uppercase tracking-wide text-[var(--text-faint)]">
          Layout: split comparison
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-[rgba(110,231,197,0.3)] bg-[var(--mint-dim)] p-3">
            <p className="mb-1 text-xs font-semibold uppercase text-[var(--mint)]">
              {content.labels?.left ?? "A"}
            </p>
            <p className="text-sm text-[var(--text)]">{left}</p>
          </div>
          <div className="rounded-lg border border-[rgba(232,184,109,0.35)] bg-[rgba(232,184,109,0.1)] p-3">
            <p className="mb-1 text-xs font-semibold uppercase text-[var(--amber)]">
              {content.labels?.right ?? "B"}
            </p>
            <p className="text-sm text-[var(--text)]">{right}</p>
          </div>
        </div>
        <p className="text-center text-xs font-medium text-[var(--text-muted)]">
          vs — compara el costo de cada lado
        </p>
      </div>
    );
  }

  const before = content.nodes[0] ?? "";
  const after = content.nodes[1] ?? "";
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-[var(--mint)]">{content.title}</p>
      <p className="text-[10px] uppercase tracking-wide text-[var(--text-faint)]">
        Layout: before / after
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <div className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-inset)] p-3">
          <p className="mb-1 text-xs font-semibold uppercase text-[var(--text-faint)]">
            {content.labels?.before ?? "Antes"}
          </p>
          <p className="text-sm text-[var(--text)]">{before}</p>
        </div>
        <div className="flex items-center justify-center px-1 text-[var(--mint)]">
          →
        </div>
        <div className="flex-1 rounded-lg border border-[rgba(110,231,197,0.35)] bg-[var(--mint-dim)] p-3">
          <p className="mb-1 text-xs font-semibold uppercase text-[var(--mint)]">
            {content.labels?.after ?? "Después"}
          </p>
          <p className="text-sm text-[var(--text)]">{after}</p>
        </div>
      </div>
    </div>
  );
}
