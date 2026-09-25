export type CompanionState = "idle" | "listening" | "reacting" | "charged";

export type ConfusionClass =
  | "vocabulary"
  | "process"
  | "comparison"
  | "abstract";

export type ExplanationTab = "simple" | "diagram" | "example" | "myLanguage";

export type DiagramLayout = "chain" | "split" | "beforeAfter";

export type Mode = "mock" | "live";
export type AppView = "student" | "teacher";

export interface KeyTerm {
  english: string;
  spanishDefinition: string;
}

export interface Sentence {
  id: string;
  conceptId: string;
  english: string;
  spanish: string;
  keyTerms: KeyTerm[];
  idiomMeaning?: string;
  /** Earlier sentence this line refers to, if any */
  backreferenceSentenceId?: string;
  durationMs: number;
}

export interface TranscriptSnapshotItem {
  id: string;
  english: string;
  conceptId: string;
}

export interface DiagramContent {
  layout: DiagramLayout;
  title: string;
  /** chain: ordered steps; split: left/right; beforeAfter: before/after */
  nodes: string[];
  labels?: { left?: string; right?: string; before?: string; after?: string };
}

export interface TabExplanations {
  simple: string;
  diagram: DiagramContent;
  example: string;
  myLanguage: string;
}

export interface SavedExplanation {
  initialTab: ExplanationTab;
  classification: ConfusionClass;
  tabs: TabExplanations;
  conceptLabel: string;
}

export interface ConfusionEvent {
  id: string;
  timestamp: string;
  conceptId: string;
  conceptLabel: string;
  classification: ConfusionClass;
  source: "confused" | "question";
  /** Distinguishes mock fixtures from genuine LIVE AI responses */
  modeOrigin: Mode;
  questionText?: string;
  frozenTranscript: TranscriptSnapshotItem[];
  currentSentenceId: string;
  savedExplanation: SavedExplanation;
}

export interface QuizQuestion {
  id: string;
  eventId: string;
  conceptId: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  savedExplanation: SavedExplanation;
  modeOrigin: Mode;
}

/** Live (or display) sentence-level contextual explanation */
export interface SentenceExplanationData {
  spanish: string;
  keyTerms: KeyTerm[];
  idiomMeaning?: string;
  backreferenceSentenceId?: string | null;
  modeOrigin: Mode;
}
