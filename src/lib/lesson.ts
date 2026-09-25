import type { Sentence } from "./types";

/** Six-sentence opportunity-cost mini-lecture with jargon, idiom, and backreference. */
export const LESSON_TITLE = "Opportunity Cost";

export const LESSON: Sentence[] = [
  {
    id: "s1",
    conceptId: "decision_tradeoff",
    english:
      "Today we will explore how every decision forces us to give something up.",
    spanish:
      "Hoy exploraremos cómo cada decisión nos obliga a renunciar a algo.",
    keyTerms: [
      {
        english: "decision",
        spanishDefinition: "elección entre opciones (decisión)",
      },
    ],
    durationMs: 4500,
  },
  {
    id: "s2",
    conceptId: "opportunity_cost_def",
    english:
      "Economists call this sacrifice the opportunity cost—the value of the next-best option you did not take.",
    spanish:
      "Los economistas llaman a este sacrificio el opportunity cost (costo de oportunidad): el valor de la siguiente mejor opción que no elegiste.",
    keyTerms: [
      {
        english: "opportunity cost",
        spanishDefinition:
          "costo de oportunidad — el valor de lo que dejas de hacer al elegir otra cosa",
      },
      {
        english: "next-best option",
        spanishDefinition: "la segunda mejor alternativa disponible",
      },
    ],
    durationMs: 6500,
  },
  {
    id: "s3",
    conceptId: "movie_vs_study",
    english:
      "Imagine you have two free hours: you could study for tomorrow's quiz, or you could join friends at the movies.",
    spanish:
      "Imagina que tienes dos horas libres: podrías estudiar para el examen de mañana, o podrías ir al cine con amigos.",
    keyTerms: [
      {
        english: "free hours",
        spanishDefinition: "tiempo disponible sin otras obligaciones",
      },
    ],
    durationMs: 5500,
  },
  {
    id: "s4",
    conceptId: "territory_idiom",
    english:
      "Choosing the movie is not free; you also give up the grade boost studying would have bought—trade-offs come with the territory.",
    spanish:
      "Elegir el cine no es gratis; también renuncias a la mejora de nota que el estudio habría dado—las concesiones (trade-offs) vienen con el territorio.",
    keyTerms: [
      {
        english: "trade-offs",
        spanishDefinition: "concesiones — lo que sacrificas al elegir",
      },
    ],
    idiomMeaning:
      "“Come with the territory” significa que algo es una parte normal e inevitable de una situación (aquí: toda decisión trae concesiones).",
    durationMs: 7000,
  },
  {
    id: "s5",
    conceptId: "weighing_process",
    english:
      "If your quiz score matters more than one evening out, studying looks smarter even before you open a book.",
    spanish:
      "Si tu nota del examen importa más que una noche de salida, estudiar parece más inteligente incluso antes de abrir un libro.",
    keyTerms: [
      {
        english: "quiz score",
        spanishDefinition: "calificación del examen corto",
      },
    ],
    durationMs: 5500,
  },
  {
    id: "s6",
    conceptId: "that_choice_backref",
    english:
      "Remember that choice from earlier: picking the movie meant your opportunity cost was the studying you skipped.",
    spanish:
      "Recuerda esa elección de antes: escoger el cine significó que tu opportunity cost fue el estudio que dejaste de lado.",
    keyTerms: [
      {
        english: "that choice",
        spanishDefinition:
          "se refiere a la decisión cine vs. estudiar mencionada antes (referencia al contexto)",
      },
      {
        english: "opportunity cost",
        spanishDefinition: "costo de oportunidad (mismo término del inicio)",
      },
    ],
    backreferenceSentenceId: "s3",
    durationMs: 6500,
  },
];

export const CONCEPT_LABELS: Record<string, string> = {
  decision_tradeoff: "Toda decisión implica renunciar",
  opportunity_cost_def: "Definición de opportunity cost",
  movie_vs_study: "Cine vs. estudiar",
  territory_idiom: "Idioma: come with the territory",
  weighing_process: "Cómo sopesar opciones",
  that_choice_backref: "Referencia a “that choice”",
};

export const CONCEPT_IDS = [
  "decision_tradeoff",
  "opportunity_cost_def",
  "movie_vs_study",
  "territory_idiom",
  "weighing_process",
  "that_choice_backref",
] as const;

export type ConceptId = (typeof CONCEPT_IDS)[number];

export const SENTENCE_IDS = LESSON.map((s) => s.id);

export function getSentenceById(id: string): Sentence | undefined {
  return LESSON.find((s) => s.id === id);
}

export function getRollingTranscript(upToIndex: number): Sentence[] {
  if (upToIndex < 0) return [];
  return LESSON.slice(0, upToIndex + 1);
}
