/**
 * LOCAL DATA STORAGE
 *
 * The MVP keeps everything in the browser's localStorage — no server, no account.
 * This file is the ONLY place that reads or writes stored data, so if you later
 * add a backend (Supabase, Firebase, a small Express API…), you only need to
 * change these functions.
 *
 * Stored keys:
 *   tha.sessions        → original 25-scenario sessions (Session[], kept for older data)
 *   tha.currentSession  → id of an original session in progress
 *   tha.runs            → Human vs Algorithm game runs (GameRun[])
 *   tha.currentRun      → id of the game run in progress
 */
import type { ChallengeInfo, GameRun } from '../game/types'
import type { Session } from '../types'

const SESSIONS_KEY = 'tha.sessions'
const CURRENT_KEY = 'tha.currentSession'
const RUNS_KEY = 'tha.runs'
const CURRENT_RUN_KEY = 'tha.currentRun'

/** localStorage can throw (private mode, storage full, blocked) — never crash on it. */
function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

/** Anonymous random id, e.g. "HA-7F3K-92QD". Not linked to any personal data. */
export function newSessionId(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  const chars = [...bytes].map((b) => alphabet[b % alphabet.length]).join('')
  return `HA-${chars.slice(0, 4)}-${chars.slice(4)}`
}

export function loadSessions(): Session[] {
  const sessions = read<Session[]>(SESSIONS_KEY, [])
  return Array.isArray(sessions) ? sessions : []
}

export function loadSession(id: string): Session | undefined {
  return loadSessions().find((s) => s.id === id)
}

/** Insert or update a session. Returns false if the browser refused to save. */
export function saveSession(session: Session): boolean {
  const others = loadSessions().filter((s) => s.id !== session.id)
  return write(SESSIONS_KEY, [...others, session])
}

export function getCurrentSessionId(): string | null {
  return read<string | null>(CURRENT_KEY, null)
}

export function setCurrentSessionId(id: string | null): void {
  if (id === null) {
    try {
      localStorage.removeItem(CURRENT_KEY)
    } catch {
      /* ignore */
    }
  } else {
    write(CURRENT_KEY, id)
  }
}

export function getCurrentSession(): Session | undefined {
  const id = getCurrentSessionId()
  return id ? loadSession(id) : undefined
}

/** The most recent session that has at least one answer (for the Results page). */
export function getLatestSession(): Session | undefined {
  const current = getCurrentSession()
  if (current && current.responses.length > 0) return current
  return loadSessions()
    .filter((s) => s.responses.length > 0)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0]
}

export function createSession(): Session {
  const session: Session = { id: newSessionId(), startedAt: new Date().toISOString(), responses: [], predictions: [] }
  saveSession(session)
  setCurrentSessionId(session.id)
  return session
}

/** Removes everything this site stored on this device. */
export function deleteAllData(): void {
  try {
    localStorage.removeItem(SESSIONS_KEY)
    localStorage.removeItem(CURRENT_KEY)
    localStorage.removeItem(RUNS_KEY)
    localStorage.removeItem(CURRENT_RUN_KEY)
  } catch {
    /* ignore */
  }
}

/** Is storage usable at all? Used to show a warning instead of silently losing data. */
export function storageAvailable(): boolean {
  try {
    const probe = '__tha_probe__'
    localStorage.setItem(probe, '1')
    localStorage.removeItem(probe)
    return true
  } catch {
    return false
  }
}

/* ───────────── Human vs Algorithm game runs ───────────── */

export function loadRuns(): GameRun[] {
  const runs = read<GameRun[]>(RUNS_KEY, [])
  return Array.isArray(runs) ? runs.filter((r) => r && r.version === 2) : []
}

export function saveRun(run: GameRun): boolean {
  const others = loadRuns().filter((r) => r.id !== run.id)
  return write(RUNS_KEY, [...others, run])
}

export function getCurrentRun(): GameRun | undefined {
  const id = read<string | null>(CURRENT_RUN_KEY, null)
  return id ? loadRuns().find((r) => r.id === id) : undefined
}

export function setCurrentRunId(id: string | null): void {
  if (id === null) {
    try {
      localStorage.removeItem(CURRENT_RUN_KEY)
    } catch {
      /* ignore */
    }
  } else {
    write(CURRENT_RUN_KEY, id)
  }
}

export function createRun(challenge?: ChallengeInfo): GameRun {
  const run: GameRun = { version: 2, id: newSessionId(), startedAt: new Date().toISOString(), rounds: [], challenge }
  saveRun(run)
  setCurrentRunId(run.id)
  return run
}

/** The run to show on the results page: the current one, else the most recent finished one. */
export function getLatestRun(): GameRun | undefined {
  const current = getCurrentRun()
  if (current && current.rounds.some((r) => r.status !== 'locked')) return current
  return loadRuns()
    .filter((r) => r.completedAt)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0]
}
