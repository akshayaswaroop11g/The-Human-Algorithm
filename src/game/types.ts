/**
 * Data shapes for the Human vs Algorithm game.
 * (The original 25-scenario types still live in src/types/index.ts and are reused for dilemmas.)
 */

/** The five mini-games. */
export type GameKind = 'color' | 'number' | 'direction' | 'pattern' | 'dilemma'

export interface GameOption {
  id: string
  label: string
  /** Extra lines under the label (dilemmas). */
  facts?: string[]
  /** Color swatch (color game) — always shown together with a shape + label. */
  swatch?: string
  shape?: 'circle' | 'square' | 'triangle' | 'diamond'
}

export type Level = 1 | 2 | 3 | 4

export interface RoundSpec {
  id: string
  level: Level
  kind: GameKind
  /** One line telling the player what to do. */
  prompt: string
  options: GameOption[]
  /** Shuffle the on-screen order of options (seeded, so it is the same on reload). */
  shuffle: boolean
  /** Pressure rounds only: seconds to answer once the prediction is locked. */
  timerSeconds?: number
  /** Dilemma rounds: which scenario from src/data/scenarios.ts. */
  scenarioId?: string
  /** Pattern rounds: the sequence shown before the "?". */
  sequence?: string[]
  /** Pattern rounds: the most obvious continuation. */
  obviousOptionId?: string
  /** Pattern rounds: shown after the reveal. */
  explanation?: string
}

/** One signal's opinion for one round. */
export interface ExpertVote {
  expertId: string
  /** Probability for every option id. Sums to 1. */
  probs: Record<string, number>
  /** Plain-language justification, built only from earlier rounds. */
  reason: string
  /** How much the engine trusted this signal when it made the prediction. */
  weight: number
}

/** The prediction, fixed BEFORE the player is allowed to choose. */
export interface LockedPrediction {
  optionId: string
  /** Probability the engine gave its pick (0–1). */
  confidence: number
  probs: Record<string, number>
  reason: string
  leadExpertId: string
  votes: ExpertVote[]
  /** Full SHA-256 of `commitmentText` — shown (shortened) before the choice. */
  commitment: string
  /** Random secret mixed into the lock so the prediction can't be guessed from the code. */
  salt: string
  lockedAt: string
  modelId: string
}

export type RoundStatus = 'locked' | 'answered' | 'timeout'

export interface RoundRecord {
  roundId: string
  level: Level
  kind: GameKind
  /** Option ids in the order they were shown on screen. */
  displayOrder: string[]
  prediction: LockedPrediction
  status: RoundStatus
  /** The player's choice; null while locked or after a timeout. */
  choice: string | null
  chosenAt?: string
  /** Milliseconds from the options becoming available to the click. */
  responseMs?: number
  /** null = not scored (still locked, or timed out). */
  correct: boolean | null
}

/** A friend's score carried in a challenge link. Not verifiable — shown as "shared by your friend". */
export interface ChallengeInfo {
  /** Times the friend fooled the algorithm in the final duel. */
  fooled: number
  /** Scored duel rounds the friend played. */
  duel: number
  /** The algorithm's overall accuracy against the friend, 0–100. */
  accuracy: number
}

export interface GameRun {
  version: 2
  id: string
  startedAt: string
  completedAt?: string
  rounds: RoundRecord[]
  challenge?: ChallengeInfo
}
