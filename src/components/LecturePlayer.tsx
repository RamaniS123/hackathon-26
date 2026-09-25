"use client";

import { LESSON } from "@/lib/lesson";
import type { Sentence } from "@/lib/types";

interface LecturePlayerProps {
  currentIndex: number;
  playing: boolean;
  elapsedInSentence: number;
  helpLocked?: boolean;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onRestart: () => void;
}

function formatMs(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function LecturePlayer({
  currentIndex,
  playing,
  elapsedInSentence,
  helpLocked,
  onPlay,
  onPause,
  onNext,
  onRestart,
}: LecturePlayerProps) {
  const done = currentIndex >= LESSON.length;
  const activeIndex =
    currentIndex < 0 ? -1 : Math.min(currentIndex, LESSON.length - 1);
  const current: Sentence | undefined =
    !done && activeIndex >= 0 ? LESSON[activeIndex] : undefined;
  const totalMs = LESSON.reduce((a, s) => a + s.durationMs, 0);
  const elapsedBefore =
    activeIndex < 0
      ? 0
      : LESSON.slice(0, done ? LESSON.length : activeIndex).reduce(
          (a, s) => a + s.durationMs,
          0,
        );
  const totalElapsed = done
    ? totalMs
    : activeIndex < 0
      ? 0
      : elapsedBefore + elapsedInSentence;

  const visible =
    currentIndex < 0 ? [] : done ? LESSON : LESSON.slice(0, activeIndex + 1);

  return (
    <section className="panel flex h-full min-h-[300px] flex-col p-5 sm:min-h-[340px] sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-[var(--text)]">
          Listen to the lesson
        </h2>
        <span className="rounded-full bg-[#dff0fb] px-3 py-1 text-sm font-semibold text-[var(--sky)]">
          {formatMs(totalElapsed)} / {formatMs(totalMs)}
        </span>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        {!playing ? (
          <button
            type="button"
            onClick={onPlay}
            disabled={done || helpLocked}
            className="btn-primary rounded-xl px-5 py-2.5 text-base disabled:opacity-40"
          >
            Play
          </button>
        ) : (
          <button
            type="button"
            onClick={onPause}
            className="btn-secondary rounded-xl px-5 py-2.5 text-base"
          >
            Pause
          </button>
        )}
        <button
          type="button"
          onClick={onNext}
          disabled={done || helpLocked}
          className="btn-secondary rounded-xl px-5 py-2.5 text-base disabled:opacity-40"
          title={
            helpLocked
              ? "Paused while help is generating — snapshot stays frozen"
              : undefined
          }
        >
          Next
        </button>
        <button
          type="button"
          onClick={onRestart}
          className="btn-secondary rounded-xl px-5 py-2.5 text-base"
        >
          Restart
        </button>
      </div>

      {helpLocked && (
        <p className="mb-3 text-sm text-[var(--mint)]">
          Holding the lesson while we get your help ready…
        </p>
      )}

      {current && !done && (
        <div className="english-block mb-4 rounded-2xl p-4">
          <p className="mb-1 text-sm font-bold text-[var(--amber)]">
            Teacher says
          </p>
          <p className="text-lg font-medium leading-relaxed text-[var(--text)]">
            {current.english}
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--border)]">
            <div
              className="h-full rounded-full bg-[var(--mint)] transition-[width] duration-100 motion-reduce:transition-none"
              style={{
                width: `${Math.min(100, (elapsedInSentence / current.durationMs) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {done && (
        <p className="mb-4 rounded-2xl border-2 border-[#3ecf8e] bg-[#d8f8e8] px-4 py-3 text-base text-[#0d7a52]">
          Lesson finished! Restart anytime, or jump to Help / Practice.
        </p>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        <p className="mb-2 text-sm font-bold text-[var(--text-muted)]">
          What you&apos;ve heard so far
        </p>
        <ul className="space-y-2">
          {visible.map((s, i) => {
            const isCurrent = !done && i === activeIndex;
            return (
              <li
                key={s.id}
                className={`rounded-xl border-2 px-3 py-2.5 text-base leading-snug ${
                  isCurrent
                    ? "border-[rgba(31,170,122,0.45)] bg-[var(--mint-dim)] text-[var(--text)]"
                    : "border-[var(--border)] bg-white text-[var(--text-muted)]"
                }`}
              >
                {s.english}
              </li>
            );
          })}
          {visible.length === 0 && (
            <li className="text-base text-[var(--text-muted)]">
              Press Play or Next to start.
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}
