import type { ReadingLayersPlan } from "./types";

export const SAMPLE_ARTICLE = `Opportunity cost is one of the most useful ideas in economics. Every time you choose something, you give up something else.

Imagine you have an hour after school. You could study for a quiz, or you could play a video game. If you play, the opportunity cost is the studying you skipped—and maybe a better quiz score.

People often look only at the price of what they buy. Opportunity cost reminds us to also notice the next-best option we did not take. That “hidden price” helps us make smarter choices.`;

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

export function buildMockReadingLayers(article: string): ReadingLayersPlan {
  const trimmed = article.trim();
  const usingSample =
    !trimmed ||
    trimmed === SAMPLE_ARTICLE.trim() ||
    /opportunity cost/i.test(trimmed);

  if (usingSample) {
    return {
      title: "Opportunity cost (short article)",
      modeOrigin: "mock",
      keyTerms: [
        {
          english: "opportunity cost",
          spanishDefinition:
            "costo de oportunidad — el valor de la mejor opción que no elegiste",
        },
        {
          english: "next-best option",
          spanishDefinition: "la segunda mejor alternativa disponible",
        },
        {
          english: "hidden price",
          spanishDefinition:
            "precio oculto — lo que “pagas” al renunciar a otra cosa",
        },
      ],
      paragraphs: [
        {
          id: "p1",
          original:
            "Opportunity cost is one of the most useful ideas in economics. Every time you choose something, you give up something else.",
          simpler:
            "El opportunity cost es una idea muy útil en economía. Cada vez que eliges algo, dejas de lado otra cosa.",
        },
        {
          id: "p2",
          original:
            "Imagine you have an hour after school. You could study for a quiz, or you could play a video game. If you play, the opportunity cost is the studying you skipped—and maybe a better quiz score.",
          simpler:
            "Imagina que tienes una hora después de la escuela. Puedes estudiar para un quiz o jugar un videojuego. Si juegas, el opportunity cost es el estudio que no hiciste — y quizá una mejor nota.",
        },
        {
          id: "p3",
          original:
            "People often look only at the price of what they buy. Opportunity cost reminds us to also notice the next-best option we did not take. That “hidden price” helps us make smarter choices.",
          simpler:
            "A veces solo miramos el precio de lo que compramos. El opportunity cost nos recuerda mirar también la next-best option que no tomamos. Ese “precio oculto” nos ayuda a decidir mejor.",
        },
      ],
    };
  }

  const paras = splitParagraphs(trimmed).slice(0, 8);
  return {
    title: "Tu artículo",
    modeOrigin: "mock",
    keyTerms: [
      {
        english: "(MOCK)",
        spanishDefinition:
          "En MOCK DEMO, usa el artículo de muestra o LIVE AI para términos reales.",
      },
    ],
    paragraphs: paras.map((original, i) => ({
      id: `p${i + 1}`,
      original,
      simpler: `(Versión simple MOCK) ${original.slice(0, 120)}${original.length > 120 ? "…" : ""}`,
    })),
  };
}

export const MOCK_PARAGRAPH_CONTEXT: Record<string, string> = {
  p1: "Este párrafo presenta la idea principal: elegir siempre significa renunciar a algo. Por eso “opportunity cost” aparece desde el inicio.",
  p2: "Aquí hay un ejemplo concreto (estudiar vs videojuego). Te ayuda a ver el costo de oportunidad en tu vida diaria, no solo en economía.",
  p3: "Cierra con “hidden price” / next-best option: no mires solo el dinero, mira también lo más valioso que dejaste pasar.",
};

export function mockParagraphContext(paragraphId: string, original: string): string {
  return (
    MOCK_PARAGRAPH_CONTEXT[paragraphId] ??
    `En contexto: este párrafo dice — “${original.slice(0, 100)}${original.length > 100 ? "…" : ""}”. Pregunta a tu maestro/a si algo no queda claro.`
  );
}
