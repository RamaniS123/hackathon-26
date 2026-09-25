import { CONCEPT_LABELS, getSentenceById } from "./lesson";
import type {
  ConfusionClass,
  DiagramContent,
  ExplanationTab,
  QuizQuestion,
  SavedExplanation,
  TabExplanations,
  TranscriptSnapshotItem,
} from "./types";

const CLASS_TO_TAB: Record<ConfusionClass, ExplanationTab> = {
  vocabulary: "simple",
  process: "diagram",
  comparison: "diagram",
  abstract: "example",
};

const CONCEPT_CLASS: Record<string, ConfusionClass> = {
  decision_tradeoff: "abstract",
  opportunity_cost_def: "vocabulary",
  movie_vs_study: "comparison",
  territory_idiom: "vocabulary",
  weighing_process: "process",
  that_choice_backref: "abstract",
};

function diagramFor(
  classification: ConfusionClass,
  conceptId: string,
): DiagramContent {
  if (classification === "comparison" || conceptId === "movie_vs_study") {
    return {
      layout: "split",
      title: "Dos caminos",
      nodes: [
        "Estudiar → mejor nota posible",
        "Cine → diversión ahora, menos preparación",
      ],
      labels: { left: "Opción A", right: "Opción B" },
    };
  }
  if (classification === "process" || conceptId === "weighing_process") {
    return {
      layout: "chain",
      title: "Pasos para decidir",
      nodes: [
        "Lista tus opciones",
        "Nombra lo que pierdes en cada una",
        "Compara el valor de lo perdido",
        "Elige la opción con menor costo de oportunidad relativo a tu meta",
      ],
    };
  }
  if (conceptId === "that_choice_backref" || classification === "abstract") {
    return {
      layout: "beforeAfter",
      title: "Antes y después de “that choice”",
      nodes: [
        "Antes: dos horas libres, cine o estudiar",
        "Después: elegiste el cine → el estudio quedó como opportunity cost",
      ],
      labels: { before: "Antes", after: "Después" },
    };
  }
  // vocabulary default → before/after of term meaning
  return {
    layout: "beforeAfter",
    title: "Del inglés al significado",
    nodes: [
      "Oyes: opportunity cost / come with the territory",
      "Entiendes: valor de lo no elegido / es parte normal de decidir",
    ],
    labels: { before: "Palabra o frase", after: "Significado" },
  };
}

function tabsFor(
  conceptId: string,
  classification: ConfusionClass,
  frozen: TranscriptSnapshotItem[],
  questionText?: string,
): TabExplanations {
  const label = CONCEPT_LABELS[conceptId] ?? conceptId;
  const sentence = frozen[frozen.length - 1];
  const englishFocus = sentence?.english ?? "";
  const prior =
    frozen.length > 1
      ? frozen[frozen.length - 2]?.english
      : "(inicio de la lección)";

  const qNote = questionText
    ? ` Tu pregunta fue: “${questionText}”.`
    : "";

  return {
    simple: `En pocas palabras: ${label}. La idea central es que al elegir una cosa, pierdes el valor de la mejor alternativa. Frase actual: “${englishFocus}”.${qNote}`,
    diagram: diagramFor(classification, conceptId),
    example: `Ejemplo concreto: María tiene $10. Puede comprar un almuerzo o ahorrar para un libro. Si compra el almuerzo, su opportunity cost es el libro que no pudo comprar. Igual que en la lección: si eliges el cine, el “precio oculto” es el estudio perdido.`,
    myLanguage: `Explicación en tu idioma (español): “${englishFocus}” se entiende con el contexto reciente. Justo antes se dijo: “${prior}”. Por eso “that choice” o cualquier referencia apunta a cine vs. estudiar, no a una idea nueva. Opportunity cost = costo de oportunidad = lo más valioso que dejaste ir.`,
  };
}

export function classifyConfusion(
  conceptId: string,
  questionText?: string,
): ConfusionClass {
  const q = (questionText ?? "").toLowerCase();
  if (
    /\b(vs|versus|compare|comparison|diferencia|mejor|worse|cine|movie|study)\b/.test(
      q,
    )
  ) {
    return "comparison";
  }
  if (
    /\b(how|paso|steps|process|proceso|cómo|weigh|decidir)\b/.test(q)
  ) {
    return "process";
  }
  if (
    /\b(mean|significa|what is|qué es|word|vocab|idiom|territorio|opportunity cost)\b/.test(
      q,
    )
  ) {
    return "vocabulary";
  }
  if (/\b(why|abstract|idea|concepto|that choice|referencia)\b/.test(q)) {
    return "abstract";
  }
  return CONCEPT_CLASS[conceptId] ?? "abstract";
}

export function buildMockExplanation(
  conceptId: string,
  frozen: TranscriptSnapshotItem[],
  questionText?: string,
): SavedExplanation {
  const classification = classifyConfusion(conceptId, questionText);
  const initialTab = CLASS_TO_TAB[classification];
  return {
    initialTab,
    classification,
    tabs: tabsFor(conceptId, classification, frozen, questionText),
    conceptLabel: CONCEPT_LABELS[conceptId] ?? conceptId,
  };
}

export function freezeTranscript(
  sentences: { id: string; english: string; conceptId: string }[],
): TranscriptSnapshotItem[] {
  return sentences.map((s) => ({
    id: s.id,
    english: s.english,
    conceptId: s.conceptId,
  }));
}

/** Deterministic quiz items from logged concept events (mock only). */
export function buildQuizFromEvents(
  events: {
    id: string;
    conceptId: string;
    savedExplanation: SavedExplanation;
  }[],
): QuizQuestion[] {
  if (events.length === 0) return [];

  const bank: Record<
    string,
    { prompt: string; options: string[]; correctIndex: number }
  > = {
    decision_tradeoff: {
      prompt: "Según la lección, ¿qué implica toda decisión?",
      options: [
        "Renunciar a algo / dar algo a cambio",
        "Siempre ganar dinero",
        "Evitar cualquier sacrificio",
        "Elegir al azar",
      ],
      correctIndex: 0,
    },
    opportunity_cost_def: {
      prompt: "¿Qué es el opportunity cost?",
      options: [
        "El precio en dólares de un producto",
        "El valor de la siguiente mejor opción que no tomaste",
        "Una multa del gobierno",
        "El tiempo que dura una película",
      ],
      correctIndex: 1,
    },
    movie_vs_study: {
      prompt: "En el ejemplo de dos horas libres, ¿cuáles son las opciones?",
      options: [
        "Dormir o cocinar",
        "Estudiar para el quiz o ir al cine con amigos",
        "Trabajar o viajar",
        "Comprar o vender",
      ],
      correctIndex: 1,
    },
    territory_idiom: {
      prompt: "¿Qué significa “trade-offs come with the territory” aquí?",
      options: [
        "Las concesiones son parte normal de decidir",
        "Debes mudarte de territorio",
        "El cine es siempre gratis",
        "No hay costos ocultos",
      ],
      correctIndex: 0,
    },
    weighing_process: {
      prompt: "Si la nota importa más que una noche de salida, ¿qué parece más inteligente?",
      options: [
        "Ir al cine de todos modos",
        "Estudiar",
        "Ignorar ambas opciones",
        "Preguntar a un amigo al azar",
      ],
      correctIndex: 1,
    },
    that_choice_backref: {
      prompt: "“That choice” en la última oración se refiere a…",
      options: [
        "Comprar un libro",
        "La decisión de ir al cine en lugar de estudiar",
        "Mudarse de país",
        "Un impuesto nuevo",
      ],
      correctIndex: 1,
    },
  };

  const uniqueByConcept = new Map<string, (typeof events)[0]>();
  for (const e of events) {
    if (!uniqueByConcept.has(e.conceptId)) {
      uniqueByConcept.set(e.conceptId, e);
    }
  }
  const pool = [...uniqueByConcept.values()];

  const questions = [];
  for (let i = 0; i < 3; i++) {
    const event = pool[i % pool.length];
    const template =
      bank[event.conceptId] ??
      bank.opportunity_cost_def;
    questions.push({
      id: `q-${i}-${event.conceptId}`,
      eventId: event.id,
      conceptId: event.conceptId,
      prompt: template.prompt,
      options: template.options,
      correctIndex: template.correctIndex,
      savedExplanation: event.savedExplanation,
      modeOrigin: "mock" as const,
    });
  }
  return questions;
}

export function resolveConceptId(
  currentSentenceId: string | null,
): string {
  if (!currentSentenceId) return "decision_tradeoff";
  return getSentenceById(currentSentenceId)?.conceptId ?? "decision_tradeoff";
}
