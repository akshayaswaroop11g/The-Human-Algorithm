import { Link } from 'react-router-dom'
import { SectionHeader } from '../components/Section'
import { EXPERTS } from '../game/experts'

const FIELDS = [
  { name: 'Behavioral economics', text: 'How real decisions depart from the textbook model of a perfectly rational chooser — present bias, loss aversion, reference points.' },
  { name: 'Consumer behavior', text: 'How prices, reviews, brands, urgency cues and other people shape what we buy.' },
  { name: 'Decision theory', text: 'The formal structure of choices under risk, uncertainty and delay: expected value, discounting, trade-offs.' },
  { name: 'Data analysis', text: 'Turning individual answers into tallies, scores and population-level comparisons — and being honest about sample size.' },
  { name: 'Human-computer interaction', text: 'How the design of a choice — wording, order, defaults, what is shown first — affects the choice itself.' },
  { name: 'Predictive modeling', text: 'Building a model from past behavior, testing it on new behavior, and measuring how often it is right.' },
]

const METHOD = [
  'Before each round, the algorithm makes a prediction using only the rounds you have already played.',
  'The prediction is locked: a SHA-256 fingerprint of the prediction plus a random secret is shown before you choose, and the round is saved.',
  'You choose (or, in a pressure round, time runs out — then the round counts for neither side).',
  'The prediction and secret are revealed. Anyone can re-hash them to confirm they match the code shown earlier.',
  'The round is scored: correct, or you fooled it. Nothing is adjusted afterwards.',
  'Learning: each signal’s trust is updated from its track record — how much probability it gave to what you actually chose, compared with random guessing.',
  'At the end, accuracy is compared with a random guesser over the same rounds, along with the exact probability that random guessing would have done as well.',
]

const LIMITS = [
  'Twenty-eight rounds is a small sample. A high or low score can partly be luck — which is why the report shows the chance of luck explicitly.',
  'The game measures moves in simple games and hypothetical dilemmas, not real-world decisions with real consequences.',
  'Knowing you are playing against an algorithm changes how people choose, especially in the final duel.',
  'The algorithm’s signals are deliberately simple and transparent. A more complex model could predict better — or worse.',
  'Round order is fixed for everyone, so learning and fatigue effects are not controlled for.',
  'Results describe moves in this game. They are not a personality assessment or psychological diagnosis of any kind.',
]

export default function About() {
  return (
    <div className="pb-8">
      <section className="container-page pt-12 pb-16 md:pt-20">
        <p className="eyebrow mb-6">About the project</p>
        <h1 className="display animate-enter text-[3rem] sm:text-7xl lg:text-8xl">
          Why does
          <br />
          this exist?
        </h1>
        <div className="mt-10 grid gap-8 md:grid-cols-12">
          <div className="space-y-5 text-lg leading-relaxed text-ink-2 md:col-span-8 md:col-start-4">
            <p className="text-ink">We make decisions constantly, but rarely stop to examine the patterns behind them.</p>
            <p>
              The Human Algorithm is an interactive experiment exploring whether seemingly individual choices reveal measurable patterns — and
              whether a simple, transparent model can learn those patterns well enough to predict what someone will do next.
            </p>
            <p>
              It is an experimental project, not a diagnostic tool. It doesn’t tell you who you are. It tells you how a particular model, trained on
              a particular set of choices, performed on you.
            </p>
          </div>
        </div>
      </section>

      <section className="container-page pt-12">
        <SectionHeader index="01 · Foundations" title="Where it draws from" />
        <ul className="grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {FIELDS.map((f, i) => (
            <li key={f.name} className="bg-bg p-6 sm:p-8">
              <p className="font-mono text-xs text-muted">{String(i + 1).padStart(2, '0')}</p>
              <p className="mt-6 font-display text-xl font-semibold tracking-tight">{f.name}</p>
              <p className="mt-3 text-sm leading-relaxed text-ink-2">{f.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="container-page pt-24" id="methodology">
        <SectionHeader index="02 · Research methodology" title="How it works">
          Every round follows the same protocol. The prediction logic is rule-based and fully visible in the source code — no hidden model, no
          external AI service, and no access to your choice before it is locked.
        </SectionHeader>
        <ol className="border-t border-line">
          {METHOD.map((m, i) => (
            <li key={m} className="grid gap-2 border-b border-line py-5 md:grid-cols-12 md:gap-8">
              <span className="font-mono text-sm text-muted md:col-span-3">Step {String(i + 1).padStart(2, '0')}</span>
              <span className="leading-relaxed md:col-span-9">{m}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="container-page pt-24" id="signals">
        <SectionHeader index="02b · The signals" title="What the algorithm looks at">
          The prediction is a weighted blend of these simple rules. Rules that have predicted you well get more weight (trust = e^(4 × average
          advantage over random)). After every round, the game shows which rule drove the prediction and how trust changed.
        </SectionHeader>
        <ul className="grid gap-px border border-line bg-line sm:grid-cols-2">
          {EXPERTS.map((e) => (
            <li key={e.id} className="bg-bg p-6">
              <p className="font-display text-lg font-semibold tracking-tight">{e.name}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">{e.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="container-page pt-24" id="limitations">
        <SectionHeader index="03 · Limitations" title="What this can’t tell you" />
        <ul className="grid gap-px border border-line bg-line md:grid-cols-2">
          {LIMITS.map((l) => (
            <li key={l} className="flex gap-4 bg-bg p-6 leading-relaxed text-ink-2">
              <span className="font-mono text-xs text-signal" aria-hidden="true">!</span>
              {l}
            </li>
          ))}
        </ul>
      </section>

      <section className="container-page pt-24" id="privacy">
        <SectionHeader index="04 · Privacy" title="What is collected" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="border border-line p-6 sm:p-8">
            <p className="eyebrow mb-5">Stored, in this browser only</p>
            <ul className="space-y-2 text-ink-2">
              <li>— A random anonymous game ID (e.g. HA-7F3K-92QD)</li>
              <li>— Which option you chose in each round</li>
              <li>— How long each choice took</li>
              <li>— When each answer was given</li>
              <li>— The algorithm’s locked predictions, their lock codes, and whether they were right</li>
            </ul>
          </div>
          <div className="border border-line p-6 sm:p-8">
            <p className="eyebrow mb-5">Never collected</p>
            <ul className="space-y-2 text-ink-2">
              <li>— Name, email, phone number or address</li>
              <li>— Health information</li>
              <li>— Financial account details</li>
              <li>— Location, contacts or device identifiers</li>
            </ul>
            <p className="mt-6 text-sm leading-relaxed text-muted">
              Nothing is sent to a server. You can copy or delete your data from the{' '}
              <Link to="/results" className="underline underline-offset-2 hover:text-ink">results page</Link>.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
