"use client";

import { useEffect, useMemo, useState } from "react";
import { DiagramView } from "@/components/DiagramView";
import { ModeBadge } from "@/components/ModeBadge";
import { fetchLiveQuiz, LiveAiError } from "@/lib/aiClient";
import { buildQuizFromEvents } from "@/lib/mockHelp";
import type {
  ConfusionEvent,
  ExplanationTab,
  Mode,
  QuizQuestion,
} from "@/lib/types";

interface QuizPanelProps {
  events: ConfusionEvent[];
  mode: Mode;
}

function QuizInner({
  questions,
  mode,
}: {
  questions: QuizQuestion[];
  mode: Mode;
}) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [hintTab, setHintTab] = useState<ExplanationTab>("simple");
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const q = questions[index];

  function resetQuiz() {
    setIndex(0);
    setSelected(null);
    setShowHint(false);
    setScore(0);
    setFinished(false);
  }

  function checkAnswer() {
    if (selected === null || !q) return;
    if (selected === q.correctIndex) {
      setScore((s) => s + 1);
      setShowHint(false);
      if (index + 1 >= questions.length) {
        setFinished(true);
      } else {
        setIndex((i) => i + 1);
        setSelected(null);
      }
    } else {
      setShowHint(true);
      setHintTab(q.savedExplanation.initialTab);
    }
  }

  function retryAfterHint() {
    setShowHint(false);
    setSelected(null);
  }

  if (finished) {
    return (
      <section className={`panel p-4 ${mode === "live" ? "panel-live" : ""}`}>
        <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-bold text-[var(--text)]">Practice</h2>
          <ModeBadge mode={mode} size="sm" />
        </div>
        <p className="text-sm text-[var(--text)]">
          Done — {score} / {questions.length} correct.
        </p>
        <button
          type="button"
          onClick={resetQuiz}
          className="btn-primary mt-3 rounded-md px-3 py-1.5 text-sm font-medium"
        >
          Retake
        </button>
      </section>
    );
  }

  return (
    <section className={`panel p-5 sm:p-6 ${mode === "live" ? "panel-live" : ""}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-[var(--text)]">Practice</h2>
        <div className="flex items-center gap-2">
          <ModeBadge mode={mode} size="sm" />
          <span className="rounded-full bg-[#dff0fb] px-3 py-1 text-sm font-semibold text-[var(--sky)]">
            {index + 1} / {questions.length}
          </span>
        </div>
      </div>

      {q && (
        <>
          <p className="mb-3 text-lg font-semibold leading-relaxed text-[var(--text)]">
            {q.prompt}
          </p>
          <ul className="mb-3 space-y-2">
            {q.options.map((opt, i) => (
              <li key={i}>
                <label
                  className={`flex cursor-pointer items-start gap-2 rounded-md border px-2.5 py-2 text-sm ${
                    selected === i
                      ? "border-[rgba(110,231,197,0.5)] bg-[var(--mint-dim)]"
                      : "border-[var(--border)] hover:border-[var(--border-strong)]"
                  }`}
                >
                  <input
                    type="radio"
                    name={`quiz-${q.id}`}
                    checked={selected === i}
                    onChange={() => setSelected(i)}
                    className="mt-0.5 accent-[var(--mint)]"
                  />
                  <span className="text-[var(--text)]">{opt}</span>
                </label>
              </li>
            ))}
          </ul>

          {!showHint ? (
            <button
              type="button"
              disabled={selected === null}
              onClick={checkAnswer}
              className="btn-primary rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-40"
            >
              Check
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-[var(--amber)]">
                Incorrect — review your earlier explanation, then retry.
              </p>
              <div className="rounded-lg border border-[rgba(232,184,109,0.35)] bg-[rgba(232,184,109,0.08)] p-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--amber)]">
                  Saved explanation · {q.savedExplanation.conceptLabel}
                </p>
                <div className="mb-2 flex flex-wrap gap-1">
                  {(
                    [
                      "simple",
                      "diagram",
                      "example",
                      "myLanguage",
                    ] as ExplanationTab[]
                  ).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setHintTab(t)}
                      className={`rounded px-2 py-0.5 text-[10px] font-medium ${
                        hintTab === t
                          ? "seg-active"
                          : "text-[var(--text-muted)]"
                      }`}
                    >
                      {t === "myLanguage"
                        ? "My Language"
                        : t[0].toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
                <div className="text-sm text-[var(--text)]">
                  {hintTab === "simple" && (
                    <p>{q.savedExplanation.tabs.simple}</p>
                  )}
                  {hintTab === "diagram" && (
                    <DiagramView content={q.savedExplanation.tabs.diagram} />
                  )}
                  {hintTab === "example" && (
                    <p>{q.savedExplanation.tabs.example}</p>
                  )}
                  {hintTab === "myLanguage" && (
                    <p>{q.savedExplanation.tabs.myLanguage}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={retryAfterHint}
                className="btn-warn rounded-md px-3 py-1.5 text-sm font-medium"
              >
                Retry question
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export function QuizPanel({ events, mode }: QuizPanelProps) {
  const mockQuestions = useMemo(
    () => (mode === "mock" ? buildQuizFromEvents(events) : []),
    [events, mode],
  );

  const [liveQuestions, setLiveQuestions] = useState<QuizQuestion[] | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSig = events.map((e) => e.id).join(",");

  useEffect(() => {
    if (mode !== "live") {
      const id = window.setTimeout(() => {
        setLiveQuestions(null);
        setError(null);
        setLoading(false);
      }, 0);
      return () => window.clearTimeout(id);
    }
    if (events.length === 0) {
      const id = window.setTimeout(() => {
        setLiveQuestions(null);
        setError(null);
        setLoading(false);
      }, 0);
      return () => window.clearTimeout(id);
    }

    const controller = new AbortController();
    let cancelled = false;

    const startId = window.setTimeout(() => {
      if (cancelled) return;
      setLoading(true);
      setError(null);
      setLiveQuestions(null);
      fetchLiveQuiz(events, controller.signal)
        .then((qs) => {
          if (!cancelled) {
            setLiveQuestions(qs);
            setLoading(false);
          }
        })
        .catch((err: unknown) => {
          if (
            cancelled ||
            (err instanceof DOMException && err.name === "AbortError")
          ) {
            return;
          }
          const msg =
            err instanceof LiveAiError
              ? err.message
              : err instanceof Error
                ? err.message
                : "Quiz generation failed";
          setError(msg);
          setLiveQuestions(null);
          setLoading(false);
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(startId);
      controller.abort();
    };
  }, [mode, eventSig, events]);

  if (events.length === 0) {
    return (
      <section className="panel p-4">
        <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-bold text-[var(--text)]">Practice</h2>
          <ModeBadge mode={mode} size="sm" />
        </div>
        <p className="text-base text-[var(--text-muted)]">
          Ask for help at least once first — practice questions come from what
          confused you.
        </p>
      </section>
    );
  }

  if (mode === "live") {
    if (loading) {
      return (
        <section className="panel panel-live p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--text)]">Practice</h2>
            <ModeBadge mode="live" size="sm" />
          </div>
          <p className="text-base text-[var(--mint)] motion-safe:animate-[mint-pulse_1.4s_ease-in-out_infinite]">
            Building your practice questions…
          </p>
        </section>
      );
    }
    if (error) {
      return (
        <section className="panel border-[rgba(240,160,160,0.4)] p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--text)]">Practice</h2>
            <ModeBadge mode="live" size="sm" />
          </div>
          <p className="text-base text-[var(--danger)]" role="alert">
            Oops — LIVE AI error: {error}
          </p>
          <p className="mt-2 text-xs text-[var(--text-faint)]">
            Mock quiz is not shown while LIVE AI is selected.
          </p>
        </section>
      );
    }
    if (!liveQuestions || liveQuestions.length === 0) {
      return (
        <section className="panel panel-live p-4">
          <ModeBadge mode="live" size="sm" />
          <p className="mt-2 text-sm text-[var(--text-muted)]">No live quiz yet.</p>
        </section>
      );
    }
    return (
      <QuizInner
        key={`live-${eventSig}`}
        questions={liveQuestions}
        mode="live"
      />
    );
  }

  return (
    <QuizInner
      key={`mock-${eventSig}`}
      questions={mockQuestions}
      mode="mock"
    />
  );
}
