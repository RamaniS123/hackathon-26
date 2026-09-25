import type { GroupTaskPlan } from "./types";

/** Sample teacher group instructions (English) for MOCK DEMO */
export const SAMPLE_GROUP_INSTRUCTIONS = `Group activity (15 minutes): Opportunity cost in real life.

1) With your partner, pick ONE decision you made this week (example: sports practice vs homework, or buying a snack vs saving money).
2) Each person writes what they chose and what they gave up.
3) Together, decide which choice had the higher opportunity cost and why. Use the vocabulary from today's lesson.
4) Be ready to share your example with the class in 2 minutes when I call on your group.
5) One partner will speak; the other will hold up your written notes.`;

export function buildMockGroupTasks(
  instructions: string,
): GroupTaskPlan {
  const trimmed = instructions.trim();
  const usingSample =
    !trimmed ||
    trimmed === SAMPLE_GROUP_INSTRUCTIONS.trim() ||
    /opportunity cost/i.test(trimmed);

  if (usingSample) {
    return {
      activityTitle: "Costo de oportunidad en la vida real",
      yourRole:
        "Trabajas en pareja. Tú ayudas a elegir un ejemplo, escribes tu parte y estás listo/a para compartir con la clase.",
      modeOrigin: "mock",
      cards: [
        {
          stepNumber: 1,
          title: "Elige un ejemplo",
          youDo:
            "Con tu pareja, elijan UNA decisión de esta semana (deporte vs tarea, merienda vs ahorrar, etc.).",
          shareWhen:
            "Solo entre ustedes por ahora — todavía no hablen con la clase.",
        },
        {
          stepNumber: 2,
          title: "Escribe lo que elegiste",
          youDo:
            "Cada persona escribe qué eligió y qué dejó de hacer (lo que “pagó” al elegir).",
          shareWhen: "Comparte tu papelito solo con tu pareja.",
        },
        {
          stepNumber: 3,
          title: "Comparen el costo",
          youDo:
            "Juntos decidan cuál opción tuvo el opportunity cost más alto y por qué. Usen palabras de la lección.",
          shareWhen: "Quédense en el grupo hasta que el maestro/a los llame.",
        },
        {
          stepNumber: 4,
          title: "Prepárense para la clase",
          youDo:
            "Un compañero hablará (2 minutos). El otro sostiene las notas. Practiquen una frase corta.",
          shareWhen:
            "Cuando el maestro/a llame a su grupo — ahí sí comparten con toda la clase.",
        },
      ],
    };
  }

  // Generic fallback for custom pasted text in mock mode
  const lines = trimmed
    .split(/\n+/)
    .map((l) => l.replace(/^\s*\d+[.)]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 5);

  const cards =
    lines.length > 0
      ? lines.map((line, i) => ({
          stepNumber: i + 1,
          title: `Paso ${i + 1}`,
          youDo: `(MOCK) ${line}`,
          shareWhen:
            i === lines.length - 1
              ? "Cuando el maestro/a lo indique — comparte con el grupo o la clase."
              : "Con tu grupo primero; espera instrucciones para compartir en voz alta.",
        }))
      : [
          {
            stepNumber: 1,
            title: "Lee las instrucciones",
            youDo: "Pide a tu maestro/a instrucciones más claras, o usa el ejemplo de muestra.",
            shareWhen: "Cuando entiendas tu rol.",
          },
        ];

  return {
    activityTitle: "Tu trabajo en grupo",
    yourRole:
      "Sigue cada tarjeta. Haz tu parte y mira cuándo compartir con el grupo.",
    modeOrigin: "mock",
    cards,
  };
}
