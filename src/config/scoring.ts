/**
 * ─────────────────────────────────────────────────────────────
 *  SCORING CONFIGURATION — the one place to tune the behavioral model.
 * ─────────────────────────────────────────────────────────────
 *
 * How scoring works (in plain language):
 *   1. Every scenario option in src/data/scenarios.ts has "effects",
 *      e.g. { patience: +2, longTerm: +1 }.
 *   2. When you choose an option, its effects are added up per dimension.
 *   3. Each total is compared to the lowest and highest total that was
 *      possible given the scenarios you answered, and turned into 0–100.
 *      50 = no lean either way.
 *
 * Change the wording, labels, or thresholds below without touching any UI code.
 */
import type { Dimension } from '../types'

export interface DimensionConfig {
  /** Display name, e.g. on the radar chart. */
  label: string
  /** One-line explanation of what a HIGH score means in this experiment. */
  description: string
  /** Labels for the two ends of the horizontal scale. */
  lowPole: string
  highPole: string
  /**
   * Sentence fragments used by insights.ts. {x} and {y} are replaced
   * with counts, e.g. "chose to wait in 4 of 5 decisions where…".
   */
  insightHigh: string
  insightLow: string
  /** Fragment used by prediction reasoning: "you {verb} in 3 of 4 …" */
  reasonHigh: string
  reasonLow: string
}

export const DIMENSIONS: Record<Dimension, DimensionConfig> = {
  risk: {
    label: 'Risk',
    description: 'Preference for options with a wider range of outcomes over certain ones.',
    lowPole: 'Chose certainty',
    highPole: 'Chose the gamble',
    insightHigh: 'you chose the option with the wider range of outcomes in {x} of {y} decisions that involved uncertainty.',
    insightLow: 'you chose the more certain option in {x} of {y} decisions that involved uncertainty.',
    reasonHigh: 'took the less certain option',
    reasonLow: 'took the more certain option',
  },
  patience: {
    label: 'Patience',
    description: 'Willingness to wait for something better.',
    lowPole: 'Sooner',
    highPole: 'Waited',
    insightHigh: 'you chose to wait in {x} of {y} decisions where waiting was an option.',
    insightLow: 'you chose the sooner option in {x} of {y} decisions where waiting was an option.',
    reasonHigh: 'chose to wait',
    reasonLow: 'chose the sooner option',
  },
  price: {
    label: 'Price Sensitivity',
    description: 'How strongly the lower price pulled your decisions.',
    lowPole: 'Paid more',
    highPole: 'Chose cheaper',
    insightHigh: 'you chose the cheaper option in {x} of {y} decisions where price competed with something else.',
    insightLow: 'you paid more in {x} of {y} decisions where a cheaper alternative existed.',
    reasonHigh: 'chose the cheaper option',
    reasonLow: 'paid more for something else',
  },
  convenience: {
    label: 'Convenience',
    description: 'Preference for saving time and effort.',
    lowPole: 'Took the effort',
    highPole: 'Chose ease',
    insightHigh: 'you chose the more convenient option in {x} of {y} decisions where convenience was at stake.',
    insightLow: 'you accepted extra time or effort in {x} of {y} decisions where a more convenient option existed.',
    reasonHigh: 'chose the more convenient option',
    reasonLow: 'accepted extra effort',
  },
  trust: {
    label: 'Trust',
    description: 'Preference for established, verified or guaranteed options.',
    lowPole: 'Less established',
    highPole: 'Established',
    insightHigh: 'you leaned toward the established or guaranteed option in {x} of {y} decisions.',
    insightLow: 'you were willing to choose the less established option in {x} of {y} decisions.',
    reasonHigh: 'chose the established option',
    reasonLow: 'chose the less established option',
  },
  social: {
    label: 'Social Influence',
    description: 'How much other people’s choices shaped yours.',
    lowPole: 'Ignored the crowd',
    highPole: 'Followed the crowd',
    insightHigh: 'you went with the option other people had chosen in {x} of {y} decisions that showed popularity signals.',
    insightLow: 'you set aside popularity signals in {x} of {y} decisions where they were shown.',
    reasonHigh: 'followed what others chose',
    reasonLow: 'set popularity aside',
  },
  scarcity: {
    label: 'Scarcity Response',
    description: 'How strongly urgency and limited availability moved you.',
    lowPole: 'Unmoved',
    highPole: 'Acted on urgency',
    insightHigh: 'you acted on urgency or limited-availability cues in {x} of {y} decisions where they appeared.',
    insightLow: 'you did not act on urgency cues in {x} of {y} decisions where they appeared.',
    reasonHigh: 'acted on urgency cues',
    reasonLow: 'ignored urgency cues',
  },
  longTerm: {
    label: 'Long-Term Thinking',
    description: 'Preference for payoffs that arrive later but last longer.',
    lowPole: 'Now',
    highPole: 'Later',
    insightHigh: 'you chose the option with the later, longer-lasting payoff in {x} of {y} decisions.',
    insightLow: 'you chose the option with the more immediate payoff in {x} of {y} decisions.',
    reasonHigh: 'chose the later payoff',
    reasonLow: 'chose the immediate payoff',
  },
}

/** Display order for charts. */
export const DIMENSION_ORDER: Dimension[] = [
  'risk',
  'patience',
  'price',
  'convenience',
  'trust',
  'social',
  'scarcity',
  'longTerm',
]

export const SCORING = {
  /** A dimension needs at least this many relevant decisions to get a score. */
  minOpportunitiesForScore: 1,
  /** …and at least this many before insights.ts will comment on it. */
  minOpportunitiesForInsight: 3,
  /** An insight is "strong" if the share of choices is at or beyond this (or 1 − this). */
  strongShare: 0.75,
}

export const PREDICTION = {
  /**
   * How quickly the model trusts a pattern. Higher = it needs more
   * decisions before a lean counts at full strength.
   * leanWeight = n / (n + evidencePrior)
   */
  evidencePrior: 1.5,
  /** How sharply score differences turn into confidence (logistic slope). */
  sharpness: 1.0,
  /** Confidence is capped so the model never claims certainty. */
  maxConfidence: 0.9,
}
