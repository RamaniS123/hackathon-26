import { CONCEPT_IDS, CONCEPT_LABELS, SENTENCE_IDS } from "@/lib/lesson";
import type {
  ConfusionClass,
  DiagramContent,
  DiagramLayout,
  ExplanationTab,
  KeyTerm,
  QuizQuestion,
  SavedExplanation,
  SentenceExplanationData,
} from "@/lib/types";

export const CLASS_TO_TAB: Record<ConfusionClass, ExplanationTab> = {
  vocabulary: "simple",
  process: "diagram",
  comparison: "diagram",
  abstract: "example",
};

const CONFUSION_CLASSES: ConfusionClass[] = [
  "vocabulary",
  "process",
  "comparison",
  "abstract",
];

const TABS: ExplanationTab[] = ["simple", "diagram", "example", "myLanguage"];
const LAYOUTS: DiagramLayout[] = ["chain", "split", "beforeAfter"];

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function asString(v: unknown, field: string): string {
  if (typeof v !== "string" || !v.trim()) {
    throw new Error(`Invalid or empty string for ${field}`);
  }
  return v.trim();
}

function asStringArray(v: unknown, field: string, min: number): string[] {
  if (!Array.isArray(v) || v.length < min) {
    throw new Error(`${field} must be an array with at least ${min} items`);
  }
  return v.map((item, i) => asString(item, `${field}[${i}]`));
}

export function parseSentenceExplanation(
  raw: unknown,
): Omit<SentenceExplanationData, "modeOrigin"> {
  if (!isRecord(raw)) throw new Error("Sentence explanation must be an object");

  const spanish = asString(raw.spanish, "spanish");
  if (!Array.isArray(raw.keyTerms)) {
    throw new Error("keyTerms must be an array");
  }
  const keyTerms: KeyTerm[] = raw.keyTerms.map((t, i) => {
    if (!isRecord(t)) throw new Error(`keyTerms[${i}] invalid`);
    return {
      english: asString(t.english, `keyTerms[${i}].english`),
      spanishDefinition: asString(
        t.spanishDefinition,
        `keyTerms[${i}].spanishDefinition`,
      ),
    };
  });

  let idiomMeaning: string | undefined;
  if (raw.idiomMeaning != null && raw.idiomMeaning !== "") {
    idiomMeaning = asString(raw.idiomMeaning, "idiomMeaning");
  }

  let backreferenceSentenceId: string | null = null;
  if (
    raw.backreferenceSentenceId != null &&
    raw.backreferenceSentenceId !== ""
  ) {
    const id = asString(
      raw.backreferenceSentenceId,
      "backreferenceSentenceId",
    );
    if (!SENTENCE_IDS.includes(id)) {
      throw new Error(`Unknown backreferenceSentenceId: ${id}`);
    }
    backreferenceSentenceId = id;
  }

  return { spanish, keyTerms, idiomMeaning, backreferenceSentenceId };
}

function parseDiagram(raw: unknown): DiagramContent {
  if (!isRecord(raw)) throw new Error("diagram must be an object");
  const layout = asString(raw.layout, "diagram.layout") as DiagramLayout;
  if (!LAYOUTS.includes(layout)) {
    throw new Error(`Invalid diagram layout: ${layout}`);
  }
  const title = asString(raw.title, "diagram.title");
  const nodes = asStringArray(raw.nodes, "diagram.nodes", 2);
  let labels: DiagramContent["labels"];
  if (raw.labels != null) {
    if (!isRecord(raw.labels)) throw new Error("diagram.labels invalid");
    const pick = (v: unknown) =>
      typeof v === "string" && v.trim() ? v.trim() : undefined;
    labels = {
      left: pick(raw.labels.left),
      right: pick(raw.labels.right),
      before: pick(raw.labels.before),
      after: pick(raw.labels.after),
    };
  }
  return { layout, title, nodes, labels };
}

export function parseHelpExplanation(raw: unknown): SavedExplanation & {
  conceptId: string;
} {
  if (!isRecord(raw)) throw new Error("Help response must be an object");

  const conceptId = asString(raw.conceptId, "conceptId");
  if (!CONCEPT_IDS.includes(conceptId as (typeof CONCEPT_IDS)[number])) {
    throw new Error(`conceptId must be one of: ${CONCEPT_IDS.join(", ")}`);
  }

  const classification = asString(
    raw.classification,
    "classification",
  ) as ConfusionClass;
  if (!CONFUSION_CLASSES.includes(classification)) {
    throw new Error(`Invalid classification: ${classification}`);
  }

  const conceptLabel =
    typeof raw.conceptLabel === "string" && raw.conceptLabel.trim()
      ? raw.conceptLabel.trim()
      : CONCEPT_LABELS[conceptId];

  if (!isRecord(raw.tabs)) throw new Error("tabs must be an object");
  const tabs = {
    simple: asString(raw.tabs.simple, "tabs.simple"),
    example: asString(raw.tabs.example, "tabs.example"),
    myLanguage: asString(raw.tabs.myLanguage, "tabs.myLanguage"),
    diagram: parseDiagram(raw.tabs.diagram),
  };

  let initialTab = CLASS_TO_TAB[classification];
  if (typeof raw.initialTab === "string" && TABS.includes(raw.initialTab as ExplanationTab)) {
    // Prefer classification mapping for consistency; allow model hint only if matching
    const hinted = raw.initialTab as ExplanationTab;
    if (hinted === initialTab) initialTab = hinted;
  }

  return {
    conceptId,
    conceptLabel,
    classification,
    initialTab,
    tabs,
  };
}

export function parseQuizQuestions(
  raw: unknown,
  allowedEventIds: string[],
  explanationsByEventId: Record<string, SavedExplanation>,
): QuizQuestion[] {
  if (!isRecord(raw) || !Array.isArray(raw.questions)) {
    throw new Error("Quiz response must include questions array");
  }
  if (raw.questions.length !== 3) {
    throw new Error("Quiz must contain exactly 3 questions");
  }

  return raw.questions.map((q, i) => {
    if (!isRecord(q)) throw new Error(`questions[${i}] invalid`);
    const eventId = asString(q.eventId, `questions[${i}].eventId`);
    if (!allowedEventIds.includes(eventId)) {
      throw new Error(`questions[${i}].eventId is not a logged event`);
    }
    const conceptId = asString(q.conceptId, `questions[${i}].conceptId`);
    if (!CONCEPT_IDS.includes(conceptId as (typeof CONCEPT_IDS)[number])) {
      throw new Error(`questions[${i}].conceptId invalid`);
    }
    const prompt = asString(q.prompt, `questions[${i}].prompt`);
    const options = asStringArray(q.options, `questions[${i}].options`, 4);
    if (options.length !== 4) {
      throw new Error(`questions[${i}].options must have exactly 4 items`);
    }
    const correctIndex = q.correctIndex;
    if (
      typeof correctIndex !== "number" ||
      !Number.isInteger(correctIndex) ||
      correctIndex < 0 ||
      correctIndex > 3
    ) {
      throw new Error(`questions[${i}].correctIndex must be 0–3`);
    }
    const saved = explanationsByEventId[eventId];
    if (!saved) {
      throw new Error(`No saved explanation for event ${eventId}`);
    }
    return {
      id: `live-q-${i}-${eventId}`,
      eventId,
      conceptId,
      prompt,
      options,
      correctIndex,
      savedExplanation: saved,
      modeOrigin: "live" as const,
    };
  });
}

export const SENTENCE_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["spanish", "keyTerms", "idiomMeaning", "backreferenceSentenceId"],
  properties: {
    spanish: { type: "string" },
    keyTerms: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["english", "spanishDefinition"],
        properties: {
          english: { type: "string" },
          spanishDefinition: { type: "string" },
        },
      },
    },
    idiomMeaning: { type: ["string", "null"] },
    backreferenceSentenceId: {
      type: ["string", "null"],
      description: `Earlier sentence id if this resolves a backreference, else null. Allowed: ${SENTENCE_IDS.join(", ")}`,
    },
  },
} as const;

export const HELP_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "conceptId",
    "classification",
    "initialTab",
    "conceptLabel",
    "tabs",
  ],
  properties: {
    conceptId: { type: "string", enum: [...CONCEPT_IDS] },
    classification: {
      type: "string",
      enum: ["vocabulary", "process", "comparison", "abstract"],
    },
    initialTab: {
      type: "string",
      enum: ["simple", "diagram", "example", "myLanguage"],
    },
    conceptLabel: { type: "string" },
    tabs: {
      type: "object",
      additionalProperties: false,
      required: ["simple", "example", "myLanguage", "diagram"],
      properties: {
        simple: { type: "string" },
        example: { type: "string" },
        myLanguage: { type: "string" },
        diagram: {
          type: "object",
          additionalProperties: false,
          required: ["layout", "title", "nodes", "labels"],
          properties: {
            layout: {
              type: "string",
              enum: ["chain", "split", "beforeAfter"],
            },
            title: { type: "string" },
            nodes: {
              type: "array",
              minItems: 2,
              items: { type: "string" },
            },
            labels: {
              type: "object",
              additionalProperties: false,
              required: ["left", "right", "before", "after"],
              properties: {
                left: { type: ["string", "null"] },
                right: { type: ["string", "null"] },
                before: { type: ["string", "null"] },
                after: { type: ["string", "null"] },
              },
            },
          },
        },
      },
    },
  },
} as const;

export const QUIZ_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["questions"],
  properties: {
    questions: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "eventId",
          "conceptId",
          "prompt",
          "options",
          "correctIndex",
        ],
        properties: {
          eventId: { type: "string" },
          conceptId: { type: "string", enum: [...CONCEPT_IDS] },
          prompt: { type: "string" },
          options: {
            type: "array",
            minItems: 4,
            maxItems: 4,
            items: { type: "string" },
          },
          correctIndex: { type: "integer", minimum: 0, maximum: 3 },
        },
      },
    },
  },
} as const;

export const GROUP_TASKS_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["activityTitle", "yourRole", "cards"],
  properties: {
    activityTitle: { type: "string" },
    yourRole: { type: "string" },
    cards: {
      type: "array",
      minItems: 2,
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["stepNumber", "title", "youDo", "shareWhen"],
        properties: {
          stepNumber: { type: "integer", minimum: 1 },
          title: { type: "string" },
          youDo: { type: "string" },
          shareWhen: { type: "string" },
        },
      },
    },
  },
} as const;

export function parseGroupTaskPlan(raw: unknown): {
  activityTitle: string;
  yourRole: string;
  cards: {
    stepNumber: number;
    title: string;
    youDo: string;
    shareWhen: string;
  }[];
} {
  if (!isRecord(raw)) throw new Error("Group tasks response must be an object");
  const activityTitle = asString(raw.activityTitle, "activityTitle");
  const yourRole = asString(raw.yourRole, "yourRole");
  if (!Array.isArray(raw.cards) || raw.cards.length < 2) {
    throw new Error("cards must have at least 2 items");
  }
  const cards = raw.cards.map((c, i) => {
    if (!isRecord(c)) throw new Error(`cards[${i}] invalid`);
    const stepNumber = c.stepNumber;
    if (typeof stepNumber !== "number" || !Number.isInteger(stepNumber)) {
      throw new Error(`cards[${i}].stepNumber must be an integer`);
    }
    return {
      stepNumber,
      title: asString(c.title, `cards[${i}].title`),
      youDo: asString(c.youDo, `cards[${i}].youDo`),
      shareWhen: asString(c.shareWhen, `cards[${i}].shareWhen`),
    };
  });
  return { activityTitle, yourRole, cards };
}

export const READING_LAYERS_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "paragraphs", "keyTerms"],
  properties: {
    title: { type: "string" },
    paragraphs: {
      type: "array",
      minItems: 1,
      maxItems: 10,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "original", "simpler"],
        properties: {
          id: { type: "string" },
          original: { type: "string" },
          simpler: { type: "string" },
        },
      },
    },
    keyTerms: {
      type: "array",
      minItems: 1,
      maxItems: 12,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["english", "spanishDefinition"],
        properties: {
          english: { type: "string" },
          spanishDefinition: { type: "string" },
        },
      },
    },
  },
} as const;

export const PARAGRAPH_CONTEXT_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["explanation"],
  properties: {
    explanation: { type: "string" },
  },
} as const;

export function parseReadingLayers(raw: unknown): {
  title: string;
  paragraphs: { id: string; original: string; simpler: string }[];
  keyTerms: { english: string; spanishDefinition: string }[];
} {
  if (!isRecord(raw)) throw new Error("Reading layers must be an object");
  const title = asString(raw.title, "title");
  if (!Array.isArray(raw.paragraphs) || raw.paragraphs.length < 1) {
    throw new Error("paragraphs required");
  }
  if (!Array.isArray(raw.keyTerms) || raw.keyTerms.length < 1) {
    throw new Error("keyTerms required");
  }
  const paragraphs = raw.paragraphs.map((p, i) => {
    if (!isRecord(p)) throw new Error(`paragraphs[${i}] invalid`);
    return {
      id: asString(p.id, `paragraphs[${i}].id`),
      original: asString(p.original, `paragraphs[${i}].original`),
      simpler: asString(p.simpler, `paragraphs[${i}].simpler`),
    };
  });
  const keyTerms = raw.keyTerms.map((t, i) => {
    if (!isRecord(t)) throw new Error(`keyTerms[${i}] invalid`);
    return {
      english: asString(t.english, `keyTerms[${i}].english`),
      spanishDefinition: asString(
        t.spanishDefinition,
        `keyTerms[${i}].spanishDefinition`,
      ),
    };
  });
  return { title, paragraphs, keyTerms };
}

export function parseParagraphContext(raw: unknown): { explanation: string } {
  if (!isRecord(raw)) throw new Error("Paragraph context must be an object");
  return { explanation: asString(raw.explanation, "explanation") };
}
