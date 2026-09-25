"use client";

import { conceptCounts } from "@/lib/storage";
import type { ConfusionEvent, Mode } from "@/lib/types";

interface TeacherSummaryProps {
  events: ConfusionEvent[];
  mode: Mode;
  onClear?: () => void;
}

export function TeacherSummary({ events, mode, onClear }: TeacherSummaryProps) {
  const counts = conceptCounts(events);

  return (
    <section
      className={`panel flex h-full min-h-[240px] flex-col p-4 ${
        mode === "live" ? "panel-live" : ""
      }`}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-[var(--text)]">
          Teacher overview
        </h2>
        <span className="text-xs text-[var(--text-faint)]">
          {events.length} request{events.length === 1 ? "" : "s"}
        </span>
      </div>

      {counts.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">
          Empty confusion log — no concept counts yet. Student help requests in
          this mode will appear here.
        </p>
      ) : (
        <ul className="space-y-2">
          {counts.map((c) => (
            <li
              key={c.conceptId}
              className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-inset)] px-3 py-2.5"
            >
              <div>
                <p className="text-sm font-medium text-[var(--text)]">
                  {c.conceptLabel}
                </p>
                <p className="font-mono text-[10px] text-[var(--text-faint)]">
                  {c.conceptId}
                </p>
              </div>
              <span className="rounded-full border border-[rgba(110,231,197,0.4)] bg-[var(--mint-dim)] px-2.5 py-0.5 text-sm font-semibold text-[var(--mint)]">
                {c.count}
              </span>
            </li>
          ))}
        </ul>
      )}

      {events.length > 0 && (
        <div className="mt-4 border-t border-[var(--border)] pt-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-faint)]">
            Recent log
          </p>
          <ul className="max-h-48 space-y-2 overflow-y-auto">
            {[...events].reverse().map((e) => (
              <li
                key={e.id}
                className="rounded-md border border-[var(--border)] px-2 py-1.5 text-xs text-[var(--text-muted)]"
              >
                <span className="font-medium text-[var(--text)]">
                  {new Date(e.timestamp).toLocaleTimeString()}
                </span>
                {" · "}
                {e.classification}
                {" · "}
                {e.conceptLabel}
                {e.questionText ? ` — “${e.questionText}”` : " — I’m confused"}
              </li>
            ))}
          </ul>
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="mt-3 text-xs text-[var(--text-faint)] underline hover:text-[var(--text)]"
            >
              Clear this mode&apos;s log
            </button>
          )}
        </div>
      )}
    </section>
  );
}
