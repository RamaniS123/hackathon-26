"use client";

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
      <section className="panel p-5 sm:p-6">
        <h2 className="mb-2 text-lg font-bold text-[var(--text)]">
          What it means
        </h2>
        <p className="text-base text-[var(--text-muted)]">
          When the lesson plays, you&apos;ll see a Spanish explanation here.
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
    <section
      className={`panel p-5 sm:p-6 ${mode === "live" ? "panel-live" : ""}`}
    >
      <h2 className="mb-3 text-lg font-bold text-[var(--text)]">What it means</h2>

      <div className="spanish-block mb-4 rounded-2xl p-4 sm:p-5">
        <p className="mb-2 text-sm font-bold text-[var(--mint)]">In Spanish</p>
        {loading && (
          <p className="text-base text-[var(--mint)] motion-safe:animate-[mint-pulse_1.4s_ease-in-out_infinite]">
            Getting your explanation…
          </p>
        )}
        {error && !loading && (
          <p className="text-base text-[var(--danger)]" role="alert">
            Oops — LIVE AI error: {error}
          </p>
        )}
        {!loading && !error && display && (
          <p className="text-xl font-semibold leading-relaxed text-[var(--text)] sm:text-[1.35rem]">
            {display.spanish}
          </p>
        )}
        {!loading && !error && !display && mode === "live" && (
          <p className="text-base text-[var(--text-muted)]">
            Waiting for explanation…
          </p>
        )}
      </div>

      <details className="english-block rounded-2xl p-4">
        <summary className="cursor-pointer text-sm font-bold text-[var(--amber)]">
          Show English (original)
        </summary>
        <p className="mt-2 text-base leading-relaxed text-[var(--text-muted)]">
          {sentence.english}
        </p>
      </details>

      {display && !loading && !error && display.keyTerms.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-sm font-bold text-[var(--text-muted)]">
            Key words
          </p>
          <ul className="space-y-2">
            {display.keyTerms.map((t) => (
              <li key={t.english} className="text-base text-[var(--text)]">
                <span className="font-bold text-[var(--mint)]">{t.english}</span>
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
        <div className="mt-4 rounded-2xl border-2 border-[#ffc94a] bg-[#fff3c4] p-4">
          <p className="mb-1 text-sm font-bold text-[#b36b00]">
            Tricky phrase
          </p>
          <p className="text-base leading-relaxed text-[var(--text)]">
            {display.idiomMeaning}
          </p>
        </div>
      )}

      {display?.backreferenceSentenceId && !loading && !error && (
        <p className="mt-3 text-sm text-[var(--text-muted)]">
          This points back to something earlier in the lesson.
        </p>
      )}
    </section>
  );
}
