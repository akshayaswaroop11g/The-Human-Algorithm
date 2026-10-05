/**
 * The player's side: one board per mini-game. All boards are big, tappable buttons
 * with keyboard shortcuts, and all report the choice through onChoose(optionId).
 */
import { useEffect } from 'react'
import { getScenario } from '../../data/scenarios'
import type { GameOption, RoundSpec } from '../../game/types'
import { Swatch } from './Agents'

interface Props {
  round: RoundSpec
  displayOrder: string[]
  disabled: boolean
  onChoose: (optionId: string) => void
}

const base =
  'group relative flex border border-line-strong bg-bg text-left transition-[border-color,background-color,transform] duration-150 hover:border-human hover:bg-surface active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45'

function KeyHint({ k }: { k: string }) {
  return (
    <span className="hidden h-6 min-w-6 items-center justify-center border border-line-strong px-1 font-mono text-[0.65rem] text-muted group-hover:border-human group-hover:text-human md:inline-flex" aria-hidden="true">
      {k}
    </span>
  )
}

/** Keyboard shortcuts → option ids. */
function useKeys(map: Record<string, string>, disabled: boolean, onChoose: (id: string) => void) {
  useEffect(() => {
    if (disabled) return
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return
      const id = map[e.key.toLowerCase()]
      if (id) {
        e.preventDefault()
        onChoose(id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [map, disabled, onChoose])
}

export default function ChoiceBoard({ round, displayOrder, disabled, onChoose }: Props) {
  const options = displayOrder.map((id) => round.options.find((o) => o.id === id)!) as GameOption[]

  const keyMap: Record<string, string> = {}
  if (round.kind === 'direction') Object.assign(keyMap, { arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right' })
  else if (round.kind === 'dilemma') Object.assign(keyMap, { a: 'A', '1': 'A', b: 'B', '2': 'B' })
  else if (round.kind === 'number') options.forEach((o) => (keyMap[o.id === '10' ? '0' : o.id] = o.id))
  else options.forEach((o, i) => (keyMap[String(i + 1)] = o.id))
  useKeys(keyMap, disabled, onChoose)

  const choose = (id: string) => !disabled && onChoose(id)

  if (round.kind === 'direction') {
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-4" role="group" aria-label="Your move">
        {options.map((o) => (
          <button key={o.id} type="button" disabled={disabled} onClick={() => choose(o.id)} className={`${base} min-h-40 flex-col items-center justify-center gap-3 sm:min-h-48`}>
            <span className="font-display text-6xl leading-none text-ink transition-transform group-hover:scale-110 sm:text-7xl" aria-hidden="true">
              {o.id === 'left' ? '←' : '→'}
            </span>
            <span className="font-mono text-sm uppercase tracking-[0.2em]">{o.label}</span>
            <span className="absolute right-3 top-3"><KeyHint k={o.id === 'left' ? '←' : '→'} /></span>
          </button>
        ))}
      </div>
    )
  }

  if (round.kind === 'number') {
    return (
      <div className="grid grid-cols-5 gap-2 sm:gap-3" role="group" aria-label="Pick a number">
        {options.map((o) => (
          <button key={o.id} type="button" disabled={disabled} onClick={() => choose(o.id)} className={`${base} aspect-square items-center justify-center font-display text-3xl font-semibold tabular sm:text-4xl`}>
            {o.label}
          </button>
        ))}
      </div>
    )
  }

  if (round.kind === 'dilemma') {
    const scenario = getScenario(round.scenarioId!)
    return (
      <div>
        {scenario && <p className="mb-5 font-display text-xl tracking-tight text-ink">{scenario.question}</p>}
        <div className="grid gap-3 md:grid-cols-2 md:gap-4" role="group" aria-label="Your options">
          {options.map((o) => (
            <button key={o.id} type="button" disabled={disabled} onClick={() => choose(o.id)} className={`${base} min-h-36 flex-col items-start p-5 sm:p-6`}>
              <span className="mb-4 flex w-full items-center justify-between">
                <KeyHint k={o.id} />
              </span>
              <span className="font-display text-2xl font-semibold tracking-tight">{o.label}</span>
              {o.facts && (
                <span className="mt-2 flex flex-col gap-0.5">
                  {o.facts.map((f) => <span key={f} className="text-[0.95rem] text-ink-2">{f}</span>)}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (round.kind === 'pattern') {
    return (
      <div>
        <div className="mb-6 flex flex-wrap items-center gap-2 sm:gap-3" aria-label={`Sequence: ${round.sequence!.join(', ')}`}>
          {round.sequence!.map((token, i) => {
            const swatchOption = round.options.find((o) => o.label === token && o.swatch)
            const isQuestion = token === '?'
            return (
              <span
                key={i}
                className={`flex h-14 min-w-14 items-center justify-center border px-3 font-display text-2xl font-semibold sm:h-16 sm:min-w-16 ${
                  isQuestion ? 'animate-pulse border-human text-human' : 'border-line text-ink'
                }`}
              >
                {swatchOption ? <Swatch option={swatchOption} size={26} /> : token}
                {swatchOption && <span className="sr-only">{token}</span>}
              </span>
            )
          })}
        </div>
        <div className="grid grid-cols-3 gap-3 sm:gap-4" role="group" aria-label="What comes next">
          {options.map((o, i) => (
            <button key={o.id} type="button" disabled={disabled} onClick={() => choose(o.id)} className={`${base} min-h-24 flex-col items-center justify-center gap-2 p-3`}>
              {o.swatch ? <Swatch option={o} size={28} /> : null}
              <span className="font-display text-xl font-semibold tracking-tight sm:text-2xl">{o.label}</span>
              <span className="absolute right-2 top-2"><KeyHint k={String(i + 1)} /></span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // color
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4" role="group" aria-label="Pick a color">
      {options.map((o, i) => (
        <button key={o.id} type="button" disabled={disabled} onClick={() => choose(o.id)} className={`${base} min-h-28 items-center gap-4 p-5 sm:min-h-32`}>
          <span className="transition-transform group-hover:scale-110">
            <Swatch option={o} size={36} />
          </span>
          <span className="font-display text-2xl font-semibold tracking-tight">{o.label}</span>
          <span className="absolute right-3 top-3"><KeyHint k={String(i + 1)} /></span>
        </button>
      ))}
    </div>
  )
}
