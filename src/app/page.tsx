"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Companion } from "@/components/Companion";
import { ExplanationPanel } from "@/components/ExplanationPanel";
import { HelpPanel } from "@/components/HelpPanel";
import { LecturePlayer } from "@/components/LecturePlayer";
import { ModeBadge } from "@/components/ModeBadge";
import { QuizPanel } from "@/components/QuizPanel";
import { TeacherSummary } from "@/components/TeacherSummary";
import {
  fetchHelpExplanation,
  fetchLiveStatus,
  fetchSentenceExplanation,
  LiveAiError,
} from "@/lib/aiClient";
import { LESSON, LESSON_TITLE, getRollingTranscript } from "@/lib/lesson";
import {
  buildMockExplanation,
  freezeTranscript,
  resolveConceptId,
} from "@/lib/mockHelp";
import { clearEvents, loadEvents, saveEvents } from "@/lib/storage";
import type {
  AppView,
  CompanionState,
  ConfusionEvent,
  Mode,
  SavedExplanation,
  SentenceExplanationData,
  TranscriptSnapshotItem,
} from "@/lib/types";

export default function Home() {
  const [view, setView] = useState<AppView>("student");
  const [mode, setMode] = useState<Mode>("mock");
  const [liveConfigured, setLiveConfigured] = useState<boolean | null>(null);
  const [studentStep, setStudentStep] = useState<
    "listen" | "help" | "quiz"
  >("listen");
  const [demoOpen, setDemoOpen] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [elapsedInSentence, setElapsedInSentence] = useState(0);

  const [eventsByMode, setEventsByMode] = useState<
    Record<Mode, ConfusionEvent[]>
  >({ mock: [], live: [] });
  const [hydrated, setHydrated] = useState(false);

  const [activeExplanation, setActiveExplanation] =
    useState<SavedExplanation | null>(null);
  const [frozenSnapshot, setFrozenSnapshot] = useState<
    TranscriptSnapshotItem[] | null
  >(null);
  const [helpLoading, setHelpLoading] = useState(false);
  const [helpBusy, setHelpBusy] = useState(false);
  const [helpError, setHelpError] = useState<string | null>(null);

  const [liveExplainCache, setLiveExplainCache] = useState<
    Record<string, SentenceExplanationData>
  >({});
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainError, setExplainError] = useState<string | null>(null);

  const [companionOverride, setCompanionOverride] =
    useState<CompanionState | null>(null);

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const explainAbortRef = useRef<AbortController | null>(null);
  const helpBusyRef = useRef(false);

  const events = eventsByMode[mode];
  const helpLocked = helpLoading || helpBusy;

  useEffect(() => {
    const id = window.setTimeout(() => {
      setEventsByMode({
        mock: loadEvents("mock"),
        live: loadEvents("live"),
      });
      setHydrated(true);
      fetchLiveStatus()
        .then((s) => setLiveConfigured(s.configured))
        .catch(() => setLiveConfigured(false));
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveEvents(mode, eventsByMode[mode]);
  }, [eventsByMode, mode, hydrated]);

  const done = currentIndex >= LESSON.length;
  const displayIndex = done
    ? LESSON.length - 1
    : currentIndex < 0
      ? -1
      : currentIndex;
  const currentSentence =
    displayIndex >= 0 && displayIndex < LESSON.length
      ? LESSON[displayIndex]
      : null;

  const advance = useCallback(() => {
    setElapsedInSentence(0);
    setCurrentIndex((i) => {
      const next = i < 0 ? 0 : i + 1;
      if (next >= LESSON.length) {
        setPlaying(false);
        return LESSON.length;
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if (!playing || done || currentIndex < 0 || helpLocked) return;

    const sentence = LESSON[currentIndex];
    if (!sentence) return;

    tickRef.current = setInterval(() => {
      setElapsedInSentence((e) => {
        const next = e + 100;
        if (next >= sentence.durationMs) {
          advance();
          return 0;
        }
        return next;
      });
    }, 100);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [playing, currentIndex, done, advance, helpLocked]);

  useEffect(() => {
    if (mode !== "live" || !currentSentence || currentIndex < 0) {
      const clearId = window.setTimeout(() => {
        setExplainLoading(false);
        setExplainError(null);
      }, 0);
      return () => window.clearTimeout(clearId);
    }

    const sid = currentSentence.id;
    if (liveExplainCache[sid]) {
      const clearId = window.setTimeout(() => {
        setExplainLoading(false);
        setExplainError(null);
      }, 0);
      return () => window.clearTimeout(clearId);
    }

    explainAbortRef.current?.abort();
    const controller = new AbortController();
    explainAbortRef.current = controller;

    const rolling = getRollingTranscript(
      Math.min(currentIndex, LESSON.length - 1),
    );
    const recentTranscript = rolling.map((s) => ({
      id: s.id,
      english: s.english,
    }));
    const english = currentSentence.english;

    let cancelled = false;
    const startId = window.setTimeout(() => {
      if (cancelled) return;
      setExplainLoading(true);
      setExplainError(null);
      fetchSentenceExplanation({
        sentenceId: sid,
        english,
        recentTranscript,
        signal: controller.signal,
      })
        .then((data) => {
          if (cancelled) return;
          setLiveExplainCache((prev) => ({ ...prev, [sid]: data }));
          setExplainLoading(false);
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
                : "Explanation failed";
          setExplainError(msg);
          setExplainLoading(false);
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(startId);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cache keyed by sentence id
  }, [mode, currentSentence?.id, currentIndex]);

  function handlePlay() {
    if (done || helpLocked) return;
    if (currentIndex < 0) {
      setCurrentIndex(0);
      setElapsedInSentence(0);
    }
    setPlaying(true);
    setCompanionOverride(null);
  }

  function handlePause() {
    setPlaying(false);
  }

  function handleNext() {
    if (done || helpLocked) return;
    if (currentIndex < 0) {
      setCurrentIndex(0);
      setElapsedInSentence(0);
      return;
    }
    advance();
  }

  function handleRestart() {
    setPlaying(false);
    setCurrentIndex(-1);
    setElapsedInSentence(0);
    setActiveExplanation(null);
    setFrozenSnapshot(null);
    setCompanionOverride(null);
    setHelpError(null);
    setExplainError(null);
    helpBusyRef.current = false;
    setHelpBusy(false);
    setHelpLoading(false);
  }

  function presenterReset() {
    clearEvents("mock");
    clearEvents("live");
    setEventsByMode({ mock: [], live: [] });
    setMode("mock");
    setView("student");
    setStudentStep("listen");
    setDemoOpen(false);
    setPlaying(false);
    setCurrentIndex(-1);
    setElapsedInSentence(0);
    setActiveExplanation(null);
    setFrozenSnapshot(null);
    setCompanionOverride(null);
    setHelpError(null);
    setExplainError(null);
    setHelpLoading(false);
    setHelpBusy(false);
    setLiveExplainCache({});
    setExplainLoading(false);
    helpBusyRef.current = false;
  }

  function appendEvent(event: ConfusionEvent) {
    setEventsByMode((prev) => ({
      ...prev,
      [mode]: [...prev[mode], event],
    }));
  }

  function submitHelpMock(
    source: "confused" | "question",
    questionText?: string,
  ) {
    const idx =
      currentIndex < 0 ? 0 : Math.min(currentIndex, LESSON.length - 1);
    const rolling = getRollingTranscript(idx);
    if (rolling.length === 0) return;

    const frozen = freezeTranscript(rolling);
    const sentenceId = rolling[rolling.length - 1].id;
    const conceptId = resolveConceptId(sentenceId);
    const saved = buildMockExplanation(conceptId, frozen, questionText);

    const event: ConfusionEvent = {
      id: `evt-mock-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      conceptId,
      conceptLabel: saved.conceptLabel,
      classification: saved.classification,
      source,
      modeOrigin: "mock",
      questionText,
      frozenTranscript: frozen,
      currentSentenceId: sentenceId,
      savedExplanation: saved,
    };

    appendEvent(event);
    setActiveExplanation(saved);
    setFrozenSnapshot(frozen);
    setHelpError(null);
    setCompanionOverride("reacting");
    setPlaying(false);
    setStudentStep("help");
    window.setTimeout(() => {
      setCompanionOverride((s) => (s === "reacting" ? "listening" : s));
      helpBusyRef.current = false;
      setHelpBusy(false);
    }, 400);
  }

  async function submitHelpLive(
    source: "confused" | "question",
    questionText?: string,
  ) {
    const idx =
      currentIndex < 0 ? 0 : Math.min(currentIndex, LESSON.length - 1);
    const rolling = getRollingTranscript(idx);
    if (rolling.length === 0) {
      helpBusyRef.current = false;
      setHelpBusy(false);
      return;
    }

    const frozen = freezeTranscript(rolling);
    const sentenceId = rolling[rolling.length - 1].id;

    setFrozenSnapshot(frozen);
    setActiveExplanation(null);
    setHelpLoading(true);
    setHelpError(null);
    setCompanionOverride("listening");
    setPlaying(false);

    try {
      const { conceptId, savedExplanation } = await fetchHelpExplanation({
        frozenTranscript: frozen,
        source,
        questionText,
      });

      const event: ConfusionEvent = {
        id: `evt-live-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: new Date().toISOString(),
        conceptId,
        conceptLabel: savedExplanation.conceptLabel,
        classification: savedExplanation.classification,
        source,
        modeOrigin: "live",
        questionText,
        frozenTranscript: frozen,
        currentSentenceId: sentenceId,
        savedExplanation,
      };

      appendEvent(event);
      setActiveExplanation(savedExplanation);
      setCompanionOverride("reacting");
      setStudentStep("help");
      window.setTimeout(() => {
        setCompanionOverride((s) => (s === "reacting" ? "charged" : s));
      }, 1200);
    } catch (err: unknown) {
      const msg =
        err instanceof LiveAiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Help request failed";
      setHelpError(msg);
      setActiveExplanation(null);
      setCompanionOverride("idle");
    } finally {
      setHelpLoading(false);
      helpBusyRef.current = false;
      setHelpBusy(false);
    }
  }

  function submitHelp(source: "confused" | "question", questionText?: string) {
    if (helpBusyRef.current || helpLoading || helpBusy) return;
    if (currentIndex < 0) return;
    helpBusyRef.current = true;
    setHelpBusy(true);
    if (mode === "mock") {
      submitHelpMock(source, questionText);
    } else {
      void submitHelpLive(source, questionText);
    }
  }

  function switchMode(next: Mode) {
    setMode(next);
    setActiveExplanation(null);
    setFrozenSnapshot(null);
    setHelpError(null);
    setExplainError(null);
    setHelpLoading(false);
    setHelpBusy(false);
    setCompanionOverride(null);
    helpBusyRef.current = false;
  }

  const companionState: CompanionState = (() => {
    if (companionOverride) return companionOverride;
    if (helpLoading || explainLoading) return "listening";
    if (events.length >= 1 && activeExplanation) return "charged";
    if (frozenSnapshot) return "listening";
    return "idle";
  })();

  const liveSentenceData =
    mode === "live" && currentSentence
      ? liveExplainCache[currentSentence.id] ?? null
      : null;

  return (
    <div className="relative flex min-h-full flex-1 flex-col text-[var(--text)]">
      <Companion state={companionState} corner />

      <header className="border-b-2 border-[var(--border)] bg-white/90 px-3 py-4 backdrop-blur-sm sm:px-4">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">
              BridgeIt
            </h1>
            <p className="text-base font-medium text-[var(--text-muted)]">
              {LESSON_TITLE}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border-2 border-[var(--border-strong)] bg-[#dff0fb] px-3 py-1.5 text-sm font-bold text-[var(--sky)]">
              Spanish
            </span>
            <ModeBadge mode={mode} size="sm" />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-3 py-4 pb-28 sm:px-4 sm:pb-24">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav
            className="seg-track flex gap-1 rounded-full p-1.5"
            aria-label="Who is using this"
          >
            <button
              type="button"
              onClick={() => setView("student")}
              className={`rounded-full px-4 py-2 text-base font-bold transition ${
                view === "student"
                  ? "seg-active"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => setView("teacher")}
              className={`rounded-full px-4 py-2 text-base font-bold transition ${
                view === "teacher"
                  ? "seg-active"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              Teacher
            </button>
          </nav>

          <button
            type="button"
            onClick={() => setDemoOpen((o) => !o)}
            className="text-sm font-semibold text-[var(--text-faint)] underline decoration-dotted underline-offset-2 hover:text-[var(--text-muted)]"
            aria-expanded={demoOpen}
          >
            {demoOpen ? "Hide demo settings" : "Demo settings"}
          </button>
        </div>

        {demoOpen && (
          <div className="panel space-y-3 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <ModeBadge mode={mode} />
              <div className="seg-track flex gap-1 rounded-full p-1" aria-label="Mode">
                <button
                  type="button"
                  onClick={() => switchMode("mock")}
                  className={`rounded-full px-3 py-1.5 text-sm font-bold transition ${
                    mode === "mock"
                      ? "seg-active"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                >
                  Mock Demo
                </button>
                <button
                  type="button"
                  onClick={() => switchMode("live")}
                  className={`rounded-full px-3 py-1.5 text-sm font-bold transition ${
                    mode === "live"
                      ? "seg-active"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                >
                  Live AI
                </button>
              </div>
              <button
                type="button"
                onClick={presenterReset}
                className="btn-secondary rounded-xl px-3 py-1.5 text-sm font-bold"
              >
                Presenter reset
              </button>
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              Scripted practice lesson (not a live classroom). Mode:{" "}
              <strong className="text-[var(--text)]">
                {mode === "mock" ? "MOCK DEMO" : "LIVE AI"}
              </strong>
              .
            </p>
            {mode === "live" && liveConfigured === false && (
              <p className="rounded-xl border-2 border-[#ffc94a] bg-[#fff3c4] px-3 py-2 text-sm text-[#b36b00]">
                LIVE AI needs <code className="font-mono">OPENAI_API_KEY</code>{" "}
                in .env.local. Errors never silently use mock.
              </p>
            )}
            {mode === "live" && liveConfigured === true && (
              <p className="rounded-xl border-2 border-[#3ecf8e] bg-[#d8f8e8] px-3 py-2 text-sm text-[#0d7a52]">
                LIVE AI is connected.
              </p>
            )}
          </div>
        )}

        {view === "student" ? (
          <>
            <nav
              className="seg-track grid grid-cols-3 gap-1 rounded-2xl p-1.5"
              aria-label="Student steps"
            >
              {(
                [
                  { id: "listen" as const, label: "1. Listen" },
                  { id: "help" as const, label: "2. Help" },
                  { id: "quiz" as const, label: "3. Practice" },
                ] as const
              ).map((step) => (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setStudentStep(step.id)}
                  className={`rounded-xl px-2 py-2.5 text-sm font-bold transition sm:text-base ${
                    studentStep === step.id
                      ? "seg-active"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                >
                  {step.label}
                </button>
              ))}
            </nav>

            {studentStep === "listen" && (
              <div className="flex flex-col gap-4">
                <LecturePlayer
                  currentIndex={currentIndex}
                  playing={playing}
                  elapsedInSentence={elapsedInSentence}
                  helpLocked={helpLocked}
                  onPlay={handlePlay}
                  onPause={handlePause}
                  onNext={handleNext}
                  onRestart={handleRestart}
                />
                <ExplanationPanel
                  sentence={currentIndex < 0 ? null : currentSentence}
                  mode={mode}
                  liveData={liveSentenceData}
                  loading={mode === "live" && explainLoading}
                  error={mode === "live" ? explainError : null}
                />
                <button
                  type="button"
                  onClick={() => setStudentStep("help")}
                  className="btn-primary rounded-xl px-5 py-3 text-base"
                >
                  Need help? Continue →
                </button>
              </div>
            )}

            {studentStep === "help" && (
              <div className="flex flex-col gap-4">
                <HelpPanel
                  mode={mode}
                  canRequest={currentIndex >= 0 && !helpLoading && !helpBusy}
                  loading={helpLoading}
                  error={helpError}
                  activeExplanation={activeExplanation}
                  frozenSnapshot={frozenSnapshot}
                  explanationKey={
                    events.length > 0 ? events[events.length - 1].id : "none"
                  }
                  onConfused={() => {
                    setCompanionOverride("listening");
                    submitHelp("confused");
                  }}
                  onAsk={(q) => {
                    setCompanionOverride("listening");
                    submitHelp("question", q);
                  }}
                  onTabChange={() => setCompanionOverride("reacting")}
                />
                {currentIndex < 0 && (
                  <p className="rounded-2xl border-2 border-[#ffc94a] bg-[#fff3c4] px-4 py-3 text-base text-[#b36b00]">
                    Start on <strong>Listen</strong> first, then come back here
                    if something is confusing.
                  </p>
                )}
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setStudentStep("listen")}
                    className="btn-secondary rounded-xl px-5 py-3 text-base"
                  >
                    ← Back to Listen
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudentStep("quiz")}
                    className="btn-primary rounded-xl px-5 py-3 text-base"
                  >
                    Practice what you learned →
                  </button>
                </div>
              </div>
            )}

            {studentStep === "quiz" && (
              <div className="flex flex-col gap-4">
                <QuizPanel events={events} mode={mode} />
                <button
                  type="button"
                  onClick={() => setStudentStep("help")}
                  className="btn-secondary rounded-xl px-5 py-3 text-base"
                >
                  ← Back to Help
                </button>
              </div>
            )}
          </>
        ) : (
          <TeacherSummary
            events={events}
            mode={mode}
            onClear={() => {
              clearEvents(mode);
              setEventsByMode((prev) => ({ ...prev, [mode]: [] }));
              setActiveExplanation(null);
              setFrozenSnapshot(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
