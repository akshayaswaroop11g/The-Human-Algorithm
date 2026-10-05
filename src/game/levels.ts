/**
 * ─────────────────────────────────────────────────────────────
 *  GAME CONFIGURATION — levels, rounds and mini-games.
 * ─────────────────────────────────────────────────────────────
 *
 * The game is a fixed sequence of rounds grouped into four levels.
 * To change the game, edit LEVELS or ROUNDS below; the UI adapts automatically.
 *
 * Every round follows the same protocol (see src/game/engine.ts):
 *   predict → lock → player chooses → reveal → learn → next prediction
 */
import { getScenario } from '../data/scenarios'
import type { GameKind, GameOption, Level, RoundSpec } from './types'

/**
 * Should the prediction be visible before the player chooses?
 *   'sealed' (default) — the prediction is locked and proven with a code, then revealed.
 *   'open'             — the predicted option is shown before choosing.
 * 'open' makes Level 4 trivial (just pick the other option), so 'sealed' is recommended.
 */
export const PREDICTION_VISIBILITY: 'sealed' | 'open' = 'sealed'

export interface LevelInfo {
  level: Level
  name: string
  tagline: string
  description: string
}

export const LEVELS: LevelInfo[] = [
  {
    level: 1,
    name: 'First Impression',
    tagline: 'It knows nothing about you yet.',
    description:
      'Simple decisions. With no history to go on, the algorithm starts from opening guesses — and starts watching.',
  },
  {
    level: 2,
    name: 'Pattern Detection',
    tagline: 'Now it uses everything you’ve done so far.',
    description:
      'Some of these situations will look familiar. Every prediction is built only from your earlier moves, and the algorithm tells you which pattern it used.',
  },
  {
    level: 3,
    name: 'Pressure',
    tagline: 'Four seconds per move.',
    description:
      'A countdown starts the moment the prediction locks. If time runs out, the round simply doesn’t count for either side.',
  },
  {
    level: 4,
    name: 'Beat the Algorithm',
    tagline: 'I’ve learned your patterns. Now try to beat me.',
    description:
      'Ten rounds of LEFT or RIGHT. The prediction is locked before every move. Random guessing would get 5 of 10. If it gets more than half right, the algorithm wins. Fewer, you win.',
  },
]

/* ───────────── Option catalogs ───────────── */

const COLORS: GameOption[] = [
  { id: 'red', label: 'Red', swatch: '#e5484d', shape: 'circle' },
  { id: 'blue', label: 'Blue', swatch: '#3e7bfa', shape: 'square' },
  { id: 'green', label: 'Green', swatch: '#2fb67c', shape: 'triangle' },
  { id: 'yellow', label: 'Yellow', swatch: '#f5c542', shape: 'diamond' },
]

const NUMBERS: GameOption[] = Array.from({ length: 10 }, (_, i) => ({ id: String(i + 1), label: String(i + 1) }))

const DIRECTIONS: GameOption[] = [
  { id: 'left', label: 'Left' },
  { id: 'right', label: 'Right' },
]

/** Builds the two options of a dilemma from the original scenario data. */
function dilemmaOptions(scenarioId: string): GameOption[] {
  const scenario = getScenario(scenarioId)
  if (!scenario) throw new Error(`Unknown scenario ${scenarioId}`)
  return scenario.options.map((o) => ({ id: o.id, label: o.label, facts: o.facts }))
}

/* ───────────── Round builders (keep the list below readable) ───────────── */

let counter = 0
const nextId = () => `r${String(++counter).padStart(2, '0')}`

const color = (level: Level, timerSeconds?: number): RoundSpec => ({
  id: nextId(), level, kind: 'color', prompt: 'Pick a color.', options: COLORS, shuffle: true, timerSeconds,
})
const number = (level: Level, timerSeconds?: number): RoundSpec => ({
  id: nextId(), level, kind: 'number', prompt: 'Pick a number from 1 to 10.', options: NUMBERS, shuffle: false, timerSeconds,
})
const direction = (level: Level, timerSeconds?: number, prompt = 'Left or right?'): RoundSpec => ({
  id: nextId(), level, kind: 'direction', prompt, options: DIRECTIONS, shuffle: false, timerSeconds,
})
const dilemma = (level: Level, scenarioId: string): RoundSpec => ({
  id: nextId(), level, kind: 'dilemma', prompt: getScenario(scenarioId)!.prompt, options: dilemmaOptions(scenarioId), shuffle: false, scenarioId,
})
const pattern = (
  level: Level,
  sequence: string[],
  options: GameOption[],
  obviousOptionId: string,
  explanation: string,
  timerSeconds?: number,
): RoundSpec => ({
  id: nextId(), level, kind: 'pattern', prompt: 'What comes next?', options, shuffle: true, sequence, obviousOptionId, explanation, timerSeconds,
})

const PRESSURE_SECONDS = 4

/* ───────────── THE ROUNDS ───────────── */

export const ROUNDS: RoundSpec[] = [
  // LEVEL 1 · First Impression
  color(1),
  number(1),
  direction(1),
  dilemma(1, 's01'), // ₹1,000 today vs ₹1,500 in a month
  pattern(
    1,
    ['2', '4', '8', '?'],
    [
      { id: '16', label: '16' },
      { id: '14', label: '14' },
      { id: '10', label: '10' },
    ],
    '16',
    '16 continues the doubling. 14 continues the growing gaps (+2, +4, +6). 10 breaks the pattern. None is “wrong” — the question is which kind of answer you reach for.',
  ),

  // LEVEL 2 · Pattern Detection
  direction(2),
  color(2),
  dilemma(2, 's13'), // ₹500 today vs ₹600 next week — the same trade-off as s01
  direction(2),
  dilemma(2, 's04'), // guaranteed ₹5,000 vs a coin flip for ₹12,000
  pattern(
    2,
    ['Red', 'Red', 'Blue', 'Red', 'Red', '?'],
    [
      { id: 'blue', label: 'Blue', swatch: '#3e7bfa', shape: 'square' },
      { id: 'red', label: 'Red', swatch: '#e5484d', shape: 'circle' },
      { id: 'green', label: 'Green', swatch: '#2fb67c', shape: 'triangle' },
    ],
    'blue',
    'Blue repeats the Red–Red–Blue cycle. Red reads it as “mostly red”. Green breaks the pattern entirely.',
  ),
  number(2),
  dilemma(2, 's25'), // keep ₹10,000 vs a box — the same trade-off as s04

  // LEVEL 3 · Pressure
  direction(3, PRESSURE_SECONDS),
  color(3, PRESSURE_SECONDS),
  pattern(
    3,
    ['▲', '●', '▲', '●', '▲', '?'],
    [
      { id: 'circle', label: '●  Circle' },
      { id: 'triangle', label: '▲  Triangle' },
      { id: 'square', label: '■  Square' },
    ],
    'circle',
    'Circle continues the alternation. Triangle repeats the last shape. Square breaks the pattern.',
    PRESSURE_SECONDS,
  ),
  number(3, PRESSURE_SECONDS),
  direction(3, PRESSURE_SECONDS),

  // LEVEL 4 · Beat the Algorithm — the duel
  ...Array.from({ length: 10 }, (_, i) => direction(4, undefined, i === 0 ? 'Make your first move. Left or right?' : 'Left or right?')),
]

export const TOTAL_ROUNDS = ROUNDS.length

export function getRound(id: string): RoundSpec | undefined {
  return ROUNDS.find((r) => r.id === id)
}

export function levelInfo(level: Level): LevelInfo {
  return LEVELS[level - 1]
}

export function roundsInLevel(level: Level): RoundSpec[] {
  return ROUNDS.filter((r) => r.level === level)
}

/** Human-readable name of each mini-game. */
export const KIND_NAMES: Record<GameKind, string> = {
  color: 'Choice',
  number: 'Number',
  direction: 'Direction',
  pattern: 'Pattern',
  dilemma: 'Dilemma',
}

/** Noun used in sentences: "your previous color". */
export const KIND_NOUN: Record<GameKind, string> = {
  color: 'color',
  number: 'number',
  direction: 'direction',
  pattern: 'answer',
  dilemma: 'decision',
}
