"use client";

import { useState } from "react";
import { LiveAiError, fetchGroupTasks } from "@/lib/aiClient";
import {
  SAMPLE_GROUP_INSTRUCTIONS,
  buildMockGroupTasks,
} from "@/lib/mockGroupTasks";
import type { GroupTaskPlan, Mode } from "@/lib/types";

interface GroupTaskCardsProps {
  mode: Mode;
}

export function GroupTaskCards({ mode }: GroupTaskCardsProps) {
  const [instructions, setInstructions] = useState("");
  const [plan, setPlan] = useState<GroupTaskPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function useSample() {
    setInstructions(SAMPLE_GROUP_INSTRUCTIONS);
    setError(null);
  }

  async function makeCards() {
    const text = instructions.trim();
    if (!text) {
      setError("Pega las instrucciones del maestro/a, o usa el ejemplo.");
      return;
    }

    setError(null);

    if (mode === "mock") {
      setPlan(buildMockGroupTasks(text));
      return;
    }

    setLoading(true);
    setPlan(null);
    try {
      const data = await fetchGroupTasks(text);
      setPlan(data);
    } catch (err: unknown) {
      const msg =
        err instanceof LiveAiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Could not build group cards";
      setError(msg);
      setPlan(null);
    } finally {
      setLoading(false);
    }
  }

  function clearCards() {
    setPlan(null);
    setError(null);
  }

  return (
    <section className={`panel p-5 sm:p-6 ${mode === "live" ? "panel-live" : ""}`}>
      <h2 className="mb-3 text-lg font-bold text-[var(--text)]">Group tasks</h2>

      <p className="mb-4 text-base text-[var(--text-muted)]">
        Paste your teacher&apos;s group instructions. We&apos;ll turn them into
        short Spanish cards: what <strong className="text-[var(--text)]">you</strong>{" "}
        do and <strong className="text-[var(--text)]">when</strong> to share.
      </p>

      {!plan && (
        <>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={6}
            disabled={loading}
            placeholder="Paste group instructions here…"
            className="mb-3 w-full rounded-2xl border-2 border-[var(--border-strong)] bg-white px-4 py-3 text-base text-[var(--text)] placeholder:text-[var(--text-faint)] disabled:opacity-40"
          />
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={useSample}
              disabled={loading}
              className="btn-secondary rounded-xl px-4 py-2.5 text-base disabled:opacity-40"
            >
              Try sample
            </button>
            <button
              type="button"
              onClick={() => void makeCards()}
              disabled={loading}
              className="btn-primary rounded-xl px-5 py-2.5 text-base disabled:opacity-40"
            >
              {loading ? "Making cards…" : "Make my cards"}
            </button>
          </div>
        </>
      )}

      {loading && (
        <p className="mt-4 text-base text-[var(--mint)] motion-safe:animate-[mint-pulse_1.4s_ease-in-out_infinite]">
          Turning instructions into Spanish cards…
        </p>
      )}

      {error && !loading && (
        <p
          className="mt-4 rounded-2xl border-2 border-[rgba(224,69,69,0.35)] bg-[rgba(224,69,69,0.08)] px-4 py-3 text-base text-[var(--danger)]"
          role="alert"
        >
          {mode === "live" ? `LIVE AI error: ${error}` : error}
        </p>
      )}

      {plan && !loading && (
        <div className="mt-2 space-y-4">
          <div className="spanish-block rounded-2xl p-4">
            <p className="mb-1 text-sm font-bold text-[var(--mint)]">
              {plan.activityTitle}
            </p>
            <p className="text-base leading-relaxed text-[var(--text)]">
              <span className="font-bold">Tu rol: </span>
              {plan.yourRole}
            </p>
          </div>

          <ul className="space-y-3">
            {plan.cards.map((card) => (
              <li
                key={card.stepNumber}
                className="rounded-2xl border-2 border-[var(--border)] bg-white p-4 shadow-[0_3px_0_rgba(59,157,224,0.12)]"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--mint-dim)] text-sm font-bold text-[var(--mint)]">
                    {card.stepNumber}
                  </span>
                  <h3 className="text-lg font-bold text-[var(--text)]">
                    {card.title}
                  </h3>
                </div>
                <p className="mb-2 text-base leading-relaxed text-[var(--text)]">
                  <span className="font-bold text-[var(--sky)]">Tú haces: </span>
                  {card.youDo}
                </p>
                <p className="text-base leading-relaxed text-[var(--text-muted)]">
                  <span className="font-bold text-[var(--amber)]">
                    Comparte cuando:{" "}
                  </span>
                  {card.shareWhen}
                </p>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={clearCards}
            className="btn-secondary rounded-xl px-5 py-2.5 text-base"
          >
            New instructions
          </button>
        </div>
      )}
    </section>
  );
}
