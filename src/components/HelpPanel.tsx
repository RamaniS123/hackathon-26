"use client";

import { useState } from "react";
import { DiagramView } from "@/components/DiagramView";
import { ModeBadge } from "@/components/ModeBadge";
import type {
  ExplanationTab,
  Mode,
  SavedExplanation,
  TranscriptSnapshotItem,
} from "@/lib/types";

const TABS: { id: ExplanationTab; label: string }[] = [
  { id: "simple", label: "Simple" },
  { id: "diagram", label: "Diagram" },
  { id: "example", label: "Example" },
  { id: "myLanguage", label: "My Language" },
];

interface HelpPanelProps {
  canRequest: boolean;
  mode: Mode;
  loading?: boolean;
  error?: string | null;
  activeExplanation: SavedExplanation | null;
  frozenSnapshot: TranscriptSnapshotItem[] | null;
  explanationKey: string;
  onConfused: () => void;
  onAsk: (question: string) => void;
  onTabChange?: (tab: ExplanationTab) => void;
}

function HelpTabs({
  activeExplanation,
  mode,
  onTabChange,
}: {
  activeExplanation: SavedExplanation;
  mode: Mode;
  onTabChange?: (tab: ExplanationTab) => void;
}) {
  const [tab, setTab] = useState<ExplanationTab>(
    activeExplanation.initialTab,
  );

  function selectTab(next: ExplanationTab) {
    setTab(next);
    onTabChange?.(next);
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <ModeBadge mode={mode} size="sm" />
        <span className="rounded-full border-2 border-[#ffc94a] bg-[#fff3c4] px-2 py-0.5 text-[10px] font-bold uppercase text-[#b36b00]">
          {activeExplanation.classification}
        </span>
        <span className="text-xs text-[var(--text-muted)]">
          {activeExplanation.conceptLabel}
        </span>
      </div>

      <div
        className="seg-track mb-3 flex flex-wrap gap-1 rounded-lg p-1"
        role="tablist"
        aria-label="Explanation formats"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => selectTab(t.id)}
            className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
              tab === t.id
                ? "seg-active"
                : "text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div
        className="rounded-lg border border-[var(--border)] bg-[var(--bg-inset)] p-3 text-sm leading-relaxed text-[var(--text)]"
        role="tabpanel"
      >
        {tab === "simple" && <p>{activeExplanation.tabs.simple}</p>}
        {tab === "diagram" && (
          <DiagramView content={activeExplanation.tabs.diagram} />
        )}
        {tab === "example" && <p>{activeExplanation.tabs.example}</p>}
        {tab === "myLanguage" && <p>{activeExplanation.tabs.myLanguage}</p>}
      </div>
    </div>
  );
}

export function HelpPanel({
  canRequest,
  mode,
  loading,
  error,
  activeExplanation,
  frozenSnapshot,
  explanationKey,
  onConfused,
  onAsk,
  onTabChange,
}: HelpPanelProps) {
  const [question, setQuestion] = useState("");

  function submitQuestion() {
    const q = question.trim();
    if (!q || !canRequest || loading) return;
    onAsk(q);
    setQuestion("");
  }

  return (
    <section className={`panel p-4 ${mode === "live" ? "panel-live" : ""}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
          Help
        </h2>
        <ModeBadge mode={mode} size="sm" />
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!canRequest || loading}
          onClick={onConfused}
          className="btn-warn rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-40"
        >
          I&apos;m confused
        </button>
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submitQuestion();
          }}
          disabled={!canRequest || loading}
          placeholder="Escribe tu pregunta…"
          className="min-w-0 flex-1 rounded-xl border-2 border-[var(--border-strong)] bg-white px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-faint)] disabled:opacity-40"
        />
        <button
          type="button"
          disabled={!canRequest || loading || !question.trim()}
          onClick={submitQuestion}
          className="btn-primary rounded-md px-3 py-2 text-sm font-medium disabled:opacity-40"
        >
          Ask
        </button>
      </div>

      {loading && (
        <p className="mb-3 text-sm text-[var(--mint)] motion-safe:animate-[mint-pulse_1.4s_ease-in-out_infinite]">
          LIVE AI is generating help…
        </p>
      )}
      {error && !loading && (
        <p
          className="mb-3 rounded-md border border-[rgba(240,160,160,0.4)] bg-[rgba(240,160,160,0.1)] px-3 py-2 text-sm text-[var(--danger)]"
          role="alert"
        >
          LIVE AI error: {error}
        </p>
      )}

      {frozenSnapshot && frozenSnapshot.length > 0 && (
        <div className="mb-3 rounded-lg border border-[var(--border)] bg-[var(--bg-inset)] p-2">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-faint)]">
            Frozen transcript snapshot
          </p>
          <ul className="max-h-24 space-y-1 overflow-y-auto">
            {frozenSnapshot.map((s) => (
              <li key={s.id} className="text-xs text-[var(--text-muted)]">
                <span className="font-mono text-[var(--text-faint)]">{s.id}</span>{" "}
                {s.english}
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeExplanation && !loading ? (
        <HelpTabs
          key={explanationKey}
          activeExplanation={activeExplanation}
          mode={mode}
          onTabChange={onTabChange}
        />
      ) : (
        !loading &&
        !error && (
          <p className="text-sm text-[var(--text-muted)]">
            Tap “I&apos;m confused” or ask a question for Spanish tabs: Simple,
            Diagram, Example, My Language.
          </p>
        )
      )}
    </section>
  );
}
