/**
 * Shared data shapes for the whole app.
 * If you add a field to a scenario or a response, add it here first —
 * TypeScript will then point you to every place that needs updating.
 */

/** The eight behavioral dimensions the experiment measures. */
export type Dimension =
  | 'risk'
  | 'patience'
  | 'price'
  | 'convenience'
  | 'trust'
  | 'social'
  | 'scarcity'
  | 'longTerm'

/** Scenario categories (used for filtering and grouping). */
export type Category =
  | 'Money'
  | 'Risk'
  | 'Time'
  | 'Convenience'
  | 'Trust'
  | 'Scarcity'
  | 'Social Proof'
  | 'Patience'
  | 'Price Sensitivity'
  | 'Uncertainty'
  | 'Status'
  | 'Long-Term Thinking'

/**
 * How much choosing an option pushes each dimension.
 * Range is -2 … +2. Dimensions not listed count as 0.
 * Example: { patience: +2, longTerm: +1 } = "this is the waiting option".
 */
export type Effects = Partial<Record<Dimension, number>>

export type OptionId = 'A' | 'B'

export interface ScenarioOption {
  id: OptionId
  /** Short name shown on the button and in prediction reveals. */
  label: string
  /** Optional facts listed under the label (price, rating, distance…). */
  facts?: string[]
  /** Scoring: see src/config/scoring.ts for what each dimension means. */
  effects: Effects
}

/**
 * 'observe' scenarios are used only to learn your pattern.
 * 'predict' scenarios are preceded by a prediction from the model.
 */
export type Phase = 'observe' | 'predict'

export interface Scenario {
  id: string
  category: Category
  /** Short uppercase-style title, e.g. "Certainty". */
  title: string
  /** The situation, in one or two sentences. */
  prompt: string
  /** The question asked at the end. */
  question: string
  options: [ScenarioOption, ScenarioOption]
  phase: Phase
  /** The trade-off being tested, e.g. "Immediate vs delayed reward". */
  tradeoff: string
  /** 1 = simple, 3 = several competing factors. */
  complexity: 1 | 2 | 3
}

/** One recorded answer. */
export interface ResponseRecord {
  sessionId: string
  scenarioId: string
  category: Category
  selectedOption: OptionId
  /** Milliseconds from when the options appeared to the click. */
  responseTimeMs: number
  /** ISO timestamp. */
  timestamp: string
  /** Copy of the chosen option's effects at the time of answering. */
  signals: Effects
}

/** A prediction made before a 'predict' scenario. */
export interface PredictionRecord {
  scenarioId: string
  predictedOption: OptionId
  actualOption: OptionId
  correct: boolean
  /** 0.5 – 1: how sure the model was. */
  confidence: number
  /** Was the prediction shown before choosing ('open') or hidden ('sealed')? */
  mode: PredictionMode
  modelId: string
}

export type PredictionMode = 'sealed' | 'open'

/** Everything stored for one anonymous run of the experiment. */
export interface Session {
  id: string
  startedAt: string
  completedAt?: string
  predictionMode?: PredictionMode
  responses: ResponseRecord[]
  predictions: PredictionRecord[]
  /** true only for generated sample data — never for real participants. */
  synthetic?: boolean
}

/** The model's output for one scenario. */
export interface Prediction {
  optionId: OptionId
  /** Probability the model assigns to its chosen option (0.5 – 1). */
  confidence: number
  /** Plain-language explanation of what drove the guess. */
  reasoning: string
  modelId: string
}

/** Per-dimension tallies used by scoring, prediction and insights. */
export interface DimensionTally {
  dimension: Dimension
  /** Scenarios answered where the two options differed on this dimension. */
  opportunities: number
  /** How many times the option scoring HIGHER on this dimension was chosen. */
  choseHigher: number
}

export interface Insight {
  id: string
  text: string
  /** Used to rank insights; 0 – 1. */
  strength: number
  /** Short label shown above the insight. */
  tag: string
}

export interface UserProfile {
  /** 0 – 100 for each dimension, or null when there is not enough evidence. */
  scores: Record<Dimension, number | null>
  tallies: Record<Dimension, DimensionTally>
  predictionAccuracy: number | null
  completedCount: number
  insights: Insight[]
}
