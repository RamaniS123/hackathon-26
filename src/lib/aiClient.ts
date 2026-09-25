import type {
  ConfusionEvent,
  QuizQuestion,
  SavedExplanation,
  SentenceExplanationData,
  TranscriptSnapshotItem,
} from "@/lib/types";

export class LiveAiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LiveAiError";
  }
}

async function postAi<T>(
  body: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<T> {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  let payload: {
    ok?: boolean;
    error?: string;
    source?: string;
    data?: T;
    configured?: boolean;
  };
  try {
    payload = (await res.json()) as typeof payload;
  } catch {
    throw new LiveAiError(
      `LIVE AI failed (${res.status}): could not parse server response`,
    );
  }

  if (!res.ok || !payload.ok) {
    throw new LiveAiError(
      payload.error ?? `LIVE AI request failed (${res.status})`,
    );
  }

  if (payload.source !== "live") {
    throw new LiveAiError("Server response was not marked as LIVE AI");
  }

  return payload.data as T;
}

export async function fetchLiveStatus(): Promise<{ configured: boolean }> {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "status" }),
  });
  const payload = (await res.json()) as {
    ok?: boolean;
    configured?: boolean;
  };
  return { configured: Boolean(payload.configured) };
}

export async function fetchSentenceExplanation(input: {
  sentenceId: string;
  english: string;
  recentTranscript: { id: string; english: string }[];
  signal?: AbortSignal;
}): Promise<SentenceExplanationData> {
  return postAi<SentenceExplanationData>(
    {
      action: "explainSentence",
      sentenceId: input.sentenceId,
      english: input.english,
      recentTranscript: input.recentTranscript,
      targetLanguage: "Spanish",
    },
    input.signal,
  );
}

export async function fetchHelpExplanation(input: {
  frozenTranscript: TranscriptSnapshotItem[];
  source: "confused" | "question";
  questionText?: string;
  signal?: AbortSignal;
}): Promise<{ conceptId: string; savedExplanation: SavedExplanation }> {
  return postAi(
    {
      action: "help",
      frozenTranscript: input.frozenTranscript,
      source: input.source,
      questionText: input.questionText,
    },
    input.signal,
  );
}

export async function fetchLiveQuiz(
  events: ConfusionEvent[],
  signal?: AbortSignal,
): Promise<QuizQuestion[]> {
  const data = await postAi<{ questions: QuizQuestion[] }>(
    { action: "quiz", events },
    signal,
  );
  return data.questions;
}
