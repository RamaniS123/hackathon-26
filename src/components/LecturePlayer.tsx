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
    <section className="panel flex h-full min-h-[280px] flex-col p-4 sm:min-h-[320px]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
          Lecture · scripted English
        </h2>
        <span className="font-mono text-xs text-[var(--text-faint)]">
          {formatMs(totalElapsed)} / {formatMs(totalMs)}
        </span>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {!playing ? (
          <button
            type="button"
            onClick={onPlay}
            disabled={done || helpLocked}
            className="btn-primary rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-40"
          >
            Play
          </button>
        ) : (
          <button
            type="button"
            onClick={onPause}
            className="btn-secondary rounded-md px-3 py-1.5 text-sm font-medium"
          >
            Pause
          </button>
        )}
        <button
          type="button"
          onClick={onNext}
          disabled={done || helpLocked}
          className="btn-secondary rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-40"
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
          className="btn-secondary rounded-md px-3 py-1.5 text-sm font-medium"
        >
          Restart
        </button>
      </div>

      {helpLocked && (
        <p className="mb-3 text-xs text-[var(--mint)]">
          Lecture controls paused while help is in flight (frozen snapshot
          protected).
        </p>
      )}

      {current && !done && (
        <div className="english-block mb-3 rounded-lg p-3">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-faint)]">
            Current · {current.id}
          </p>
          <p className="text-sm leading-relaxed text-[var(--text-muted)]">
            {current.english}
          </p>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-[var(--border)]">
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
        <p className="mb-3 rounded-lg border border-[rgba(110,231,197,0.3)] bg-[var(--mint-dim)] px-3 py-2 text-sm text-[var(--mint)]">
          Lecture complete. Use Restart to replay.
        </p>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-faint)]">
          Rolling transcript
        </p>
        <ul className="space-y-2">
          {visible.map((s, i) => {
            const isCurrent = !done && i === activeIndex;
            return (
              <li
                key={s.id}
                className={`rounded-md border px-2.5 py-2 text-sm leading-snug ${
                  isCurrent
                    ? "border-[rgba(110,231,197,0.4)] bg-[var(--mint-dim)] text-[var(--text)]"
                    : "border-[var(--border)] bg-[var(--bg-inset)] text-[var(--text-muted)]"
                }`}
              >
                <span className="mr-2 font-mono text-[10px] text-[var(--text-faint)]">
                  {s.id}
                </span>
                {s.english}
              </li>
            );
          })}
          {visible.length === 0 && (
            <li className="text-sm text-[var(--text-muted)]">
              Press Play or Next to start the scripted lecture.
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}
