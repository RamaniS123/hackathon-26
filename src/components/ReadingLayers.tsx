"use client";

import { useState } from "react";
import {
  LiveAiError,
  fetchParagraphContext,
  fetchReadingLayers,
} from "@/lib/aiClient";
import {
  SAMPLE_ARTICLE,
  buildMockReadingLayers,
  mockParagraphContext,
} from "@/lib/mockReading";
import type { Mode, ReadingLayersPlan } from "@/lib/types";

type LayerTab = "original" | "simpler" | "terms";

interface ReadingLayersProps {
  mode: Mode;
}

export function ReadingLayers({ mode }: ReadingLayersProps) {
  const [article, setArticle] = useState("");
  const [plan, setPlan] = useState<ReadingLayersPlan | null>(null);
  const [tab, setTab] = useState<LayerTab>("simpler");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [contextText, setContextText] = useState<string | null>(null);
  const [contextLoading, setContextLoading] = useState(false);
  const [contextError, setContextError] = useState<string | null>(null);

  function useSample() {
    setArticle(SAMPLE_ARTICLE);
    setError(null);
  }

  async function makeLayers() {
    const text = article.trim();
    if (!text) {
      setError("Pega un artículo, o usa el ejemplo.");
      return;
    }

    setError(null);
    setSelectedId(null);
    setContextText(null);
    setContextError(null);

    if (mode === "mock") {
      setPlan(buildMockReadingLayers(text));
      setTab("simpler");
      return;
    }

    setLoading(true);
    setPlan(null);
    try {
      const data = await fetchReadingLayers(text);
      setPlan(data);
      setTab("simpler");
    } catch (err: unknown) {
      const msg =
        err instanceof LiveAiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Could not build reading layers";
      setError(msg);
      setPlan(null);
    } finally {
      setLoading(false);
    }
  }

  async function onTapParagraph(id: string, original: string) {
    setSelectedId(id);
    setContextError(null);

    if (mode === "mock") {
      setContextText(mockParagraphContext(id, original));
      return;
    }

    if (!plan) return;
    setContextLoading(true);
    setContextText(null);
    try {
      const result = await fetchParagraphContext({
        paragraphId: id,
        paragraph: original,
        articleTitle: plan.title,
        surrounding: plan.paragraphs.map((p) => ({
          id: p.id,
          original: p.original,
        })),
      });
      setContextText(result.explanation);
    } catch (err: unknown) {
      const msg =
        err instanceof LiveAiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Could not explain paragraph";
      setContextError(msg);
      setContextText(null);
    } finally {
      setContextLoading(false);
    }
  }

  function clearPlan() {
    setPlan(null);
    setError(null);
    setSelectedId(null);
    setContextText(null);
    setContextError(null);
  }

  return (
    <section
      className={`panel p-5 sm:p-6 ${mode === "live" ? "panel-live" : ""}`}
    >
      <h2 className="mb-3 text-lg font-bold text-[var(--text)]">Reading layers</h2>

      <p className="mb-4 text-base text-[var(--text-muted)]">
        Paste an article. Switch layers: original English, a simpler Spanish
        version, or key words. Tap a paragraph to ask what it means.
      </p>

      {!plan && (
        <>
          <textarea
            value={article}
            onChange={(e) => setArticle(e.target.value)}
            rows={7}
            disabled={loading}
            placeholder="Paste an article here…"
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
              onClick={() => void makeLayers()}
              disabled={loading}
              className="btn-primary rounded-xl px-5 py-2.5 text-base disabled:opacity-40"
            >
              {loading ? "Building layers…" : "Make layers"}
            </button>
          </div>
        </>
      )}

      {loading && (
        <p className="mt-4 text-base text-[var(--mint)] motion-safe:animate-[mint-pulse_1.4s_ease-in-out_infinite]">
          Making simpler Spanish and key words…
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
          <p className="font-display text-xl font-bold text-[var(--sky)]">
            {plan.title}
          </p>

          <div
            className="seg-track grid grid-cols-3 gap-1 rounded-2xl p-1.5"
            role="tablist"
            aria-label="Reading layers"
          >
            {(
              [
                { id: "original" as const, label: "Original" },
                { id: "simpler" as const, label: "Simpler" },
                { id: "terms" as const, label: "Key words" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`rounded-xl px-2 py-2.5 text-sm font-bold transition sm:text-base ${
                  tab === t.id
                    ? "seg-active"
                    : "text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "terms" ? (
            <ul className="space-y-2">
              {plan.keyTerms.map((t) => (
                <li
                  key={t.english}
                  className="rounded-2xl border-2 border-[var(--border)] bg-white px-4 py-3 text-base"
                >
                  <span className="font-bold text-[var(--mint)]">{t.english}</span>
                  <span className="text-[var(--text-faint)]"> — </span>
                  <span className="text-[var(--text-muted)]">
                    {t.spanishDefinition}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="space-y-3">
              {plan.paragraphs.map((p) => {
                const selected = selectedId === p.id;
                const body = tab === "original" ? p.original : p.simpler;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => void onTapParagraph(p.id, p.original)}
                      className={`w-full rounded-2xl border-2 px-4 py-3 text-left text-base leading-relaxed transition ${
                        selected
                          ? "border-[rgba(31,170,122,0.5)] bg-[var(--mint-dim)]"
                          : "border-[var(--border)] bg-white hover:border-[var(--border-strong)]"
                      }`}
                    >
                      <span className="mb-1 block text-xs font-bold text-[var(--text-faint)]">
                        Tap for meaning
                      </span>
                      {body}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {(contextLoading || contextText || contextError) && tab !== "terms" && (
            <div className="spanish-block rounded-2xl p-4">
              <p className="mb-1 text-sm font-bold text-[var(--mint)]">
                What this paragraph means
              </p>
              {contextLoading && (
                <p className="text-base text-[var(--mint)]">Thinking…</p>
              )}
              {contextError && !contextLoading && (
                <p className="text-base text-[var(--danger)]" role="alert">
                  LIVE AI error: {contextError}
                </p>
              )}
              {contextText && !contextLoading && (
                <p className="text-base leading-relaxed text-[var(--text)]">
                  {contextText}
                </p>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={clearPlan}
            className="btn-secondary rounded-xl px-5 py-2.5 text-base"
          >
            New article
          </button>
        </div>
      )}
    </section>
  );
}
