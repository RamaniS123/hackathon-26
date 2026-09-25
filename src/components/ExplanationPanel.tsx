"use client";

import { ModeBadge } from "@/components/ModeBadge";
import type {
  Mode,
  Sentence,
  SentenceExplanationData,
} from "@/lib/types";

interface ExplanationPanelProps {
  sentence: Sentence | null;
  mode: Mode;
  liveData: SentenceExplanationData | null;
  loading?: boolean;
  error?: string | null;
}

export function ExplanationPanel({
  sentence,
  mode,
  liveData,
  loading,
  error,
}: ExplanationPanelProps) {
  if (!sentence) {
    return (
      <section className="panel p-4">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
          Explanation
        </h2>
        <p className="text-sm text-[var(--text-muted)]">
          Contextual Spanish appears beside each English sentence as the lecture
          advances.
        </p>
      </section>
    );
  }

  const display =
    mode === "live" && liveData
      ? liveData
      : mode === "mock"
        ? {
            spanish: sentence.spanish,
            keyTerms: sentence.keyTerms,
            idiomMeaning: sentence.idiomMeaning,
            backreferenceSentenceId: sentence.backreferenceSentenceId ?? null,
            modeOrigin: "mock" as const,
          }
        : null;

  return (
    <section className={`panel p-4 ${mode === "live" ? "panel-live" : ""}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
          Explanation · {sentence.id}
        </h2>
        <ModeBadge mode={mode} size="sm" />
      </div>

      {/* Spanish first / prominent */}
      <div className="spanish-block mb-3 rounded-lg p-3 sm:p-4">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--mint)]">
          Español · significado
        </p>
        {loading && (
          <p className="text-sm text-[var(--mint)] motion-safe:animate-[mint-pulse_1.4s_ease-in-out_infinite]">
            Generating LIVE AI explanation…
          </p>
        )}
        {error && !loading && (
          <p className="text-sm text-[var(--danger)]" role="alert">
            LIVE AI error: {error}
          </p>
        )}
        {!loading && !error && display && (
          <p className="text-base font-medium leading-relaxed text-[var(--text)] sm:text-lg">
            {display.spanish}
          </p>
        )}
        {!loading && !error && !display && mode === "live" && (
          <p className="text-sm text-[var(--text-muted)]">
            Waiting for LIVE AI explanation…
          </p>
        )}
      </div>

      <div className="english-block rounded-lg p-3">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-faint)]">
          English · original (kept visible)
        </p>
        <p className="text-sm leading-relaxed text-[var(--text-muted)]">
          {sentence.english}
        </p>
      </div>

      {display && !loading && !error && display.keyTerms.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-faint)]">
            Key terms
          </p>
          <ul className="space-y-1.5">
            {display.keyTerms.map((t) => (
              <li key={t.english} className="text-sm text-[var(--text)]">
                <span className="font-semibold text-[var(--mint)]">
                  {t.english}
                </span>
                <span className="text-[var(--text-faint)]"> — </span>
                <span className="text-[var(--text-muted)]">
                  {t.spanishDefinition}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {display?.idiomMeaning && !loading && !error && (
        <div className="mt-3 rounded-lg border border-[rgba(232,184,109,0.35)] bg-[rgba(232,184,109,0.1)] p-3">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--amber)]">
            Idiom meaning
          </p>
          <p className="text-sm leading-relaxed text-[var(--text)]">
            {display.idiomMeaning}
          </p>
        </div>
      )}

      {display?.backreferenceSentenceId && !loading && !error && (
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          Backreference →{" "}
          <span className="font-mono text-[var(--mint)]">
            {display.backreferenceSentenceId}
          </span>
        </p>
      )}
    </section>
  );
}
