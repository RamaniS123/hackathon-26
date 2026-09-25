import OpenAI from "openai";
import { NextResponse } from "next/server";
import {
  CONCEPT_IDS,
  CONCEPT_LABELS,
  LESSON,
  LESSON_TITLE,
  SENTENCE_IDS,
} from "@/lib/lesson";
import {
  CLASS_TO_TAB,
  GROUP_TASKS_JSON_SCHEMA,
  HELP_JSON_SCHEMA,
  PARAGRAPH_CONTEXT_JSON_SCHEMA,
  QUIZ_JSON_SCHEMA,
  READING_LAYERS_JSON_SCHEMA,
  SENTENCE_JSON_SCHEMA,
  parseGroupTaskPlan,
  parseHelpExplanation,
  parseParagraphContext,
  parseQuizQuestions,
  parseReadingLayers,
  parseSentenceExplanation,
} from "@/lib/aiValidate";
import type { ConfusionEvent, SavedExplanation } from "@/lib/types";

export const runtime = "nodejs";

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const TIMEOUT_MS = 45_000;

function getClient(): OpenAI {
  const key = process.env.OPENAI_API_KEY;
  if (!key || !key.trim()) {
    throw new Error(
      "OPENAI_API_KEY is not configured on the server (.env.local).",
    );
  }
  return new OpenAI({ apiKey: key });
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`OpenAI request timed out after ${ms}ms`)),
          ms,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function structuredCompletion(
  client: OpenAI,
  args: {
    system: string;
    user: string;
    schemaName: string;
    schema: Record<string, unknown>;
  },
): Promise<unknown> {
  const completion = await withTimeout(
    client.chat.completions.create({
      model: MODEL,
      temperature: 0.4,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: args.schemaName,
          strict: true,
          schema: args.schema,
        },
      },
      messages: [
        { role: "system", content: args.system },
        { role: "user", content: args.user },
      ],
    }),
    TIMEOUT_MS,
  );

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty model response");
  }
  try {
    return JSON.parse(content) as unknown;
  } catch {
    throw new Error("Malformed JSON from model");
  }
}

function errorResponse(message: string, status = 500) {
  return NextResponse.json(
    { ok: false as const, error: message, source: "live" as const },
    { status },
  );
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  if (!body || typeof body !== "object") {
    return errorResponse("Body must be an object", 400);
  }

  const action = (body as { action?: string }).action;
  if (
    action !== "explainSentence" &&
    action !== "help" &&
    action !== "quiz" &&
    action !== "groupTasks" &&
    action !== "readingLayers" &&
    action !== "paragraphContext" &&
    action !== "status"
  ) {
    return errorResponse("Unknown action", 400);
  }

  if (action === "status") {
    const configured = Boolean(process.env.OPENAI_API_KEY?.trim());
    return NextResponse.json({
      ok: true,
      source: "live",
      configured,
      model: configured ? MODEL : null,
    });
  }

  let client: OpenAI;
  try {
    client = getClient();
  } catch (e) {
    return errorResponse(
      e instanceof Error ? e.message : "API key missing",
      503,
    );
  }

  try {
    if (action === "explainSentence") {
      const {
        sentenceId,
        english,
        recentTranscript,
        targetLanguage,
      } = body as {
        sentenceId?: string;
        english?: string;
        recentTranscript?: { id: string; english: string }[];
        targetLanguage?: string;
      };

      if (!sentenceId || !english || !Array.isArray(recentTranscript)) {
        return errorResponse("Missing sentence fields", 400);
      }

      const raw = await structuredCompletion(client, {
        schemaName: "sentence_explanation",
        schema: SENTENCE_JSON_SCHEMA as unknown as Record<string, unknown>,
        system: `You help multilingual students follow an English economics mini-lecture (${LESSON_TITLE}).
Return contextual explanation in ${targetLanguage ?? "Spanish"}.
Keep English jargon terms in English inside the Spanish text when useful, with Spanish definitions in keyTerms.
If the sentence uses a backreference (e.g. "that choice"), set backreferenceSentenceId to the earlier sentence id it refers to; otherwise null.
Allowed sentence ids: ${SENTENCE_IDS.join(", ")}.
idiomMeaning: Spanish explanation of any idiom, or null if none.`,
        user: JSON.stringify({
          currentSentenceId: sentenceId,
          currentEnglish: english,
          recentTranscript,
          targetLanguage: targetLanguage ?? "Spanish",
          lessonOutline: LESSON.map((s) => ({
            id: s.id,
            conceptId: s.conceptId,
            english: s.english,
          })),
        }),
      });

      const parsed = parseSentenceExplanation(raw);
      return NextResponse.json({
        ok: true,
        source: "live" as const,
        data: { ...parsed, modeOrigin: "live" as const },
      });
    }

    if (action === "help") {
      const { frozenTranscript, questionText, source } = body as {
        frozenTranscript?: { id: string; english: string; conceptId: string }[];
        questionText?: string;
        source?: "confused" | "question";
      };
      if (!Array.isArray(frozenTranscript) || frozenTranscript.length === 0) {
        return errorResponse("frozenTranscript required", 400);
      }

      const raw = await structuredCompletion(client, {
        schemaName: "help_explanation",
        schema: HELP_JSON_SCHEMA as unknown as Record<string, unknown>,
        system: `You are BridgeIt LIVE AI help for Spanish-speaking students.
Given a frozen recent transcript snapshot, classify the confusion and produce Spanish help for four tabs: simple, diagram, example, myLanguage.
conceptId MUST be one of: ${CONCEPT_IDS.join(", ")}.
classification MUST be one of: vocabulary, process, comparison, abstract.
initialTab should match: vocabulary→simple, process→diagram, comparison→diagram, abstract→example.
diagram.layout MUST be one of: chain, split, beforeAfter — pick the best fit (process→chain, comparison→split, abstract/vocabulary→beforeAfter often work).
diagram.nodes: at least 2 Spanish strings. For labels unused fields may be null.
All tab text in Spanish. Do not invent English-only answers.`,
        user: JSON.stringify({
          source: source ?? "confused",
          questionText: questionText ?? null,
          frozenTranscript,
          conceptCatalog: CONCEPT_IDS.map((id) => ({
            id,
            label: CONCEPT_LABELS[id],
          })),
        }),
      });

      const parsed = parseHelpExplanation(raw);
      const saved: SavedExplanation = {
        ...parsed,
        initialTab: CLASS_TO_TAB[parsed.classification],
      };

      return NextResponse.json({
        ok: true,
        source: "live" as const,
        data: {
          conceptId: parsed.conceptId,
          savedExplanation: saved,
        },
      });
    }

    if (action === "groupTasks") {
      const { instructions, targetLanguage } = body as {
        instructions?: string;
        targetLanguage?: string;
      };
      if (!instructions || !instructions.trim()) {
        return errorResponse("instructions required", 400);
      }

      const raw = await structuredCompletion(client, {
        schemaName: "group_task_cards",
        schema: GROUP_TASKS_JSON_SCHEMA as unknown as Record<string, unknown>,
        system: `You help middle-school multilingual students understand teacher group-work instructions.
Rewrite the teacher's English instructions into short ${targetLanguage ?? "Spanish"} task cards.
Each card needs: stepNumber, title (short), youDo (what THIS student is responsible for), shareWhen (when to share with partner/group/class).
Also provide activityTitle and yourRole summarizing the student's role.
Use clear, friendly Spanish suitable for about ages 11–14. Keep 2–6 cards. Do not invent extra tasks that contradict the teacher.`,
        user: JSON.stringify({
          teacherInstructions: instructions,
          targetLanguage: targetLanguage ?? "Spanish",
        }),
      });

      const parsed = parseGroupTaskPlan(raw);
      return NextResponse.json({
        ok: true,
        source: "live" as const,
        data: { ...parsed, modeOrigin: "live" as const },
      });
    }

    if (action === "readingLayers") {
      const { article, targetLanguage } = body as {
        article?: string;
        targetLanguage?: string;
      };
      if (!article || !article.trim()) {
        return errorResponse("article required", 400);
      }

      const raw = await structuredCompletion(client, {
        schemaName: "reading_layers",
        schema: READING_LAYERS_JSON_SCHEMA as unknown as Record<string, unknown>,
        system: `You help middle-school Spanish-speaking students read an English article.
Split into clear paragraphs (ids p1, p2, ...). Keep original English text faithful.
For each paragraph provide simpler: a clearer version in ${targetLanguage ?? "Spanish"} that preserves meaning (may keep key English jargon with context).
Also list keyTerms: important English words/phrases with Spanish definitions.
Friendly tone for ages ~11–14. Do not answer quiz questions or invent facts beyond the article.`,
        user: JSON.stringify({
          article,
          targetLanguage: targetLanguage ?? "Spanish",
        }),
      });

      const parsed = parseReadingLayers(raw);
      return NextResponse.json({
        ok: true,
        source: "live" as const,
        data: { ...parsed, modeOrigin: "live" as const },
      });
    }

    if (action === "paragraphContext") {
      const {
        paragraphId,
        paragraph,
        articleTitle,
        surrounding,
        targetLanguage,
      } = body as {
        paragraphId?: string;
        paragraph?: string;
        articleTitle?: string;
        surrounding?: { id: string; original: string }[];
        targetLanguage?: string;
      };
      if (!paragraph || !paragraph.trim()) {
        return errorResponse("paragraph required", 400);
      }

      const raw = await structuredCompletion(client, {
        schemaName: "paragraph_context",
        schema:
          PARAGRAPH_CONTEXT_JSON_SCHEMA as unknown as Record<string, unknown>,
        system: `Explain what this paragraph means in context for a Spanish-speaking middle schooler.
Reply in ${targetLanguage ?? "Spanish"} only (field: explanation). Be clear and short. Do not translate word-by-word only—explain the idea using nearby paragraphs when helpful.`,
        user: JSON.stringify({
          paragraphId: paragraphId ?? null,
          paragraph,
          articleTitle: articleTitle ?? null,
          surrounding: surrounding ?? [],
        }),
      });

      const parsed = parseParagraphContext(raw);
      return NextResponse.json({
        ok: true,
        source: "live" as const,
        data: parsed,
      });
    }

    // quiz
    const { events } = body as { events?: ConfusionEvent[] };
    if (!Array.isArray(events) || events.length === 0) {
      return errorResponse("events required for quiz generation", 400);
    }

    const liveEvents = events.filter((e) => e.modeOrigin === "live");
    const pool = liveEvents.length > 0 ? liveEvents : events;
    const allowedEventIds = pool.map((e) => e.id);
    const explanationsByEventId: Record<string, SavedExplanation> = {};
    for (const e of pool) {
      explanationsByEventId[e.id] = e.savedExplanation;
    }

    const raw = await structuredCompletion(client, {
      schemaName: "confusion_quiz",
      schema: QUIZ_JSON_SCHEMA as unknown as Record<string, unknown>,
      system: `Generate 1–3 Spanish multiple-choice quiz questions based ONLY on the student's logged confusion events.
Create ONE question per distinct concept/event — never repeat the same question.
If there is only one logged concept, return exactly 1 question.
Each question MUST set eventId to one of the provided event ids (link to that source event).
Questions and options in Spanish. correctIndex is 0–3.
conceptId must match the linked event's concept when possible.
Allowed conceptIds: ${CONCEPT_IDS.join(", ")}.`,
      user: JSON.stringify({
        events: pool.map((e) => ({
          id: e.id,
          conceptId: e.conceptId,
          conceptLabel: e.conceptLabel,
          classification: e.classification,
          questionText: e.questionText ?? null,
          currentSentenceId: e.currentSentenceId,
          frozenTranscript: e.frozenTranscript,
          simpleExplanation: e.savedExplanation.tabs.simple,
        })),
      }),
    });

    const questions = parseQuizQuestions(
      raw,
      allowedEventIds,
      explanationsByEventId,
    );

    return NextResponse.json({
      ok: true,
      source: "live" as const,
      data: { questions },
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "LIVE AI request failed";
    const status = /API key|not configured/i.test(message)
      ? 503
      : /timed out/i.test(message)
        ? 504
        : /Invalid|Malformed|must|Unknown/i.test(message)
          ? 502
          : 500;
    return errorResponse(message, status);
  }
}
