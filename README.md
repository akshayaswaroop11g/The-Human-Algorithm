# The Human Algorithm

**Can an algorithm predict what you'll do next?**

An interactive behavioral experiment played as a game: **Human vs Algorithm**. Over 28 rounds and 4 levels, an algorithm predicts each move *before* you make it, locks the prediction with a SHA-256 code, and then reveals whether it was right, why it guessed that, and what it learned. In the final level you try to beat it.

It is not a personality test and makes no diagnostic claims. Everything is anonymous and stored only in the browser.

Built with React, TypeScript, Tailwind CSS v4, Vite and Recharts. No backend, no external APIs. Deployed to GitHub Pages.

---

## How the game works

Every round follows the same protocol:

1. **Predict.** The algorithm predicts your move using only the rounds you've already played.
2. **Lock.** It shows a *lock code*: the SHA-256 of `prediction + random secret`. The locked round is saved before you can choose.
3. **Choose.** You pick. In `sealed` mode (the default) you can't see the prediction.
4. **Reveal.** The prediction and secret are revealed. Re-hashing them must reproduce the lock code, so the prediction can't have changed after your choice.
5. **Score.** It's either correct, or you fooled it. Timed-out rounds count for neither side.
6. **Learn.** Each signal's trust is updated from its track record.
7. **Repeat.** The next prediction uses the updated history.

| Level | Name | What's different |
|---|---|---|
| 1 | First Impression | No data yet, so the algorithm uses opening guesses |
| 2 | Pattern Detection | Uses your earlier moves; repeats trade-offs from Level 1 |
| 3 | Pressure | 4-second countdown per move |
| 4 | Beat the Algorithm | 10-round Left/Right duel; more than 5 right = algorithm wins |

Mini-games: **Choice** (4 colors), **Number** (1–10), **Direction** (Left/Right), **Pattern** (what comes next?), **Dilemma** (money/time/risk trade-offs from the original 25 scenarios).

At the end, the report compares the algorithm with **random guessing** over exactly the rounds you played (1/k per round with k options). It also shows the exact chance that random guessing would score as high, and says plainly if the algorithm did no better than chance.

---

## How to run

You need [Node.js](https://nodejs.org) 20 or newer (22+ to run the tests).

```bash
npm install
npm run dev
```

Then open the URL it prints, e.g. <http://localhost:5173/The-Human-Algorithm/>.

| Command | What it does |
|---|---|
| `npm run dev` | Development server with live reload |
| `npm test` | Runs the engine tests (no cheating, honest scoring, SHA-256 vectors, learning) |
| `npm run build` | Type-checks, then builds into `dist/` (what GitHub Pages deploys) |
| `npm run preview` | Serves the built `dist/` locally |

Deployment: pushing to `main` triggers `.github/workflows/main.yml`, which builds and publishes to GitHub Pages.

---

## Project structure

```
src/
├── game/                   ★ THE GAME — all logic, no UI
│   ├── levels.ts           Levels, rounds, mini-games, sealed/open setting  ← edit the game here
│   ├── experts.ts          The prediction "signals" (favorite, repeat-or-switch, sequence memory…)
│   ├── engine.ts           Blends signals, locks predictions, scores rounds, learning
│   ├── stats.ts            Accuracy, random baseline, chance-of-luck, duel winner
│   ├── report.ts           "Your human pattern" + observations
│   ├── share.ts            Share text, challenge links, result image
│   ├── sha256.ts           Small SHA-256 used for lock codes
│   ├── types.ts            Data shapes for game runs and rounds
│   └── engine.test.ts      Tests (run with npm test)
│
├── components/game/        Game UI: HUD, prediction panel, boards, reveal, log, result card
├── pages/
│   ├── Experiment.tsx      The game screen (route: /experiment)
│   ├── Results.tsx         The final report (route: /results)
│   ├── Home.tsx, Explore.tsx, ExperimentsLibrary.tsx, ExperimentDetail.tsx, About.tsx
│
├── data/scenarios.ts       The 25 behavioral-economics scenarios (dilemmas reuse these)
├── logic/                  The original trade-off model (used by the Dilemma signal) + aggregation
├── config/scoring.ts       Wording and weights for the trade-off model
└── utils/storage.ts        The ONLY file that reads/writes localStorage
```

---

## Where to change things

- **Rounds, levels, timer length, mini-game options:** `src/game/levels.ts`. The `ROUNDS` list is the whole game in order.
- **Showing predictions before the choice:** set `PREDICTION_VISIBILITY = 'open'` in `src/game/levels.ts`. Note that this makes the Level 4 duel trivial (just pick the other side), which is why `sealed` is the default.
- **Add a new signal:** write an object matching the `Expert` interface in `src/game/experts.ts` and add it to `EXPERTS`. It receives only earlier rounds. Return probabilities and a sentence describing *observable behavior*.
- **How fast the algorithm learns:** `LEARNING_RATE` and `UNCERTAINTY_FLOOR` in `src/game/engine.ts`.
- **Report wording:** `src/game/report.ts`. Every observation checks it has enough data before saying anything.
- **Dilemma scenarios:** `src/data/scenarios.ts`.
- **Colors and fonts:** `src/index.css` (`--color-signal` = algorithm, `--color-human` = player).

---

## How data works

- **Anonymous.** A random ID like `HA-7F3K-92QD` per game. No name, email or account.
- **Local only.** Games are saved in `localStorage` (`tha.runs`). Nothing is sent anywhere. The Results page can copy or delete your data.
- **No fake leaderboard.** A global leaderboard would need a server, so the site shows a ranking of games *on this device* and lets players send a **challenge link** (`#/experiment?vs=4-10-62`). The friend's page shows that score, labelled as not verified.
- **Explore the Data** shows real games from this browser. The dilemma charts can also show a clearly labelled synthetic sample.

To pool results from many players later, replace the functions in `src/utils/storage.ts` with calls to a small backend (e.g. Supabase).

---

## Ideas for what to build next

1. A shared backend for real population results and a real leaderboard.
2. More duel variants (e.g. 3-way choices) and an endless "beat it" mode.
3. A/B variants of scenarios to measure effects like scarcity properly.
4. A second model (e.g. logistic regression) compared side by side with the signal blend.
