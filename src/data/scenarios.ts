/**
 * ─────────────────────────────────────────────────────────────
 *  THE SCENARIOS — edit, add or reorder decisions here.
 * ─────────────────────────────────────────────────────────────
 *
 * Rules of thumb when writing a scenario:
 *   • There should be no obviously "correct" answer.
 *   • Each option's `effects` says which dimensions it signals (−2 … +2).
 *     The two options usually mirror each other (e.g. +2 / −2).
 *   • phase 'observe' = the model only watches.
 *     phase 'predict' = the model guesses before you choose.
 *     Keep the 'observe' ones first so the model has something to learn from.
 *
 * Dimensions: risk, patience, price, convenience, trust, social, scarcity, longTerm
 * (meanings are in src/config/scoring.ts)
 */
import type { Scenario } from '../types'

export const SCENARIOS: Scenario[] = [
  // ───────────── PHASE 1 · OBSERVATION (12) ─────────────
  {
    id: 's01',
    category: 'Patience',
    title: 'Certainty',
    prompt: 'You can receive a payment today, or a larger payment exactly one month from now. Both are guaranteed.',
    question: 'Which do you choose?',
    tradeoff: 'Immediate vs delayed reward',
    complexity: 1,
    phase: 'observe',
    options: [
      { id: 'A', label: 'Take ₹1,000 today', facts: ['Paid now'], effects: { patience: -2, longTerm: -1 } },
      { id: 'B', label: 'Wait for ₹1,500', facts: ['Paid in 30 days', '+50%'], effects: { patience: 2, longTerm: 1 } },
    ],
  },
  {
    id: 's02',
    category: 'Convenience',
    title: 'Distance',
    prompt: 'You need a specific product today. Two stores have it in stock.',
    question: 'Where do you buy it?',
    tradeoff: 'Convenience vs savings',
    complexity: 1,
    phase: 'observe',
    options: [
      { id: 'A', label: 'Nearby store', facts: ['₹900', '5 minutes away'], effects: { convenience: 2, price: -1 } },
      { id: 'B', label: 'Distant store', facts: ['₹700', '40 minutes away'], effects: { convenience: -2, price: 2 } },
    ],
  },
  {
    id: 's03',
    category: 'Trust',
    title: 'Two Sellers',
    prompt: 'Two sellers offer the same product at the same price with the same delivery date.',
    question: 'Which seller do you choose?',
    tradeoff: 'Higher rating vs more evidence',
    complexity: 2,
    phase: 'observe',
    options: [
      { id: 'A', label: 'Seller A', facts: ['4.8 ★', '120 reviews'], effects: { trust: -1, risk: 1, social: -1 } },
      { id: 'B', label: 'Seller B', facts: ['4.5 ★', '4,800 reviews'], effects: { trust: 2, risk: -1, social: 1 } },
    ],
  },
  {
    id: 's04',
    category: 'Risk',
    title: 'The Coin',
    prompt: 'You have won a prize. You can take a guaranteed amount, or flip a fair coin for a larger one.',
    question: 'Which do you take?',
    tradeoff: 'Certainty vs potential reward',
    complexity: 1,
    phase: 'observe',
    options: [
      { id: 'A', label: 'Guaranteed ₹5,000', facts: ['100% chance'], effects: { risk: -2 } },
      { id: 'B', label: 'Flip for ₹12,000', facts: ['50% chance of ₹12,000', '50% chance of nothing'], effects: { risk: 2 } },
    ],
  },
  {
    id: 's05',
    category: 'Scarcity',
    title: 'Only 3 Left',
    prompt:
      'You have been considering a pair of headphones that normally cost ₹2,000. You were planning to compare other models this weekend. The product page now says: ONLY 3 LEFT · 14 people are viewing this.',
    question: 'What do you do?',
    tradeoff: 'Limited availability vs normal availability',
    complexity: 2,
    phase: 'observe',
    options: [
      { id: 'A', label: 'Buy it now', facts: ['Secure one of the last 3'], effects: { scarcity: 2, patience: -1 } },
      { id: 'B', label: 'Compare first', facts: ['Decide this weekend', 'It may sell out'], effects: { scarcity: -2, patience: 1, risk: 1 } },
    ],
  },
  {
    id: 's06',
    category: 'Social Proof',
    title: 'The Crowd',
    prompt: 'Two insulated water bottles cost the same. One shows how many people bought it. The other shows only its specifications.',
    question: 'Which would you buy?',
    tradeoff: 'Popularity vs specifications',
    complexity: 2,
    phase: 'observe',
    options: [
      { id: 'A', label: 'The popular one', facts: ['9,000 bought this month', 'Keeps cold 18 hours'], effects: { social: 2 } },
      { id: 'B', label: 'The better-specified one', facts: ['No purchase information', 'Keeps cold 24 hours'], effects: { social: -2, risk: 1 } },
    ],
  },
  {
    id: 's07',
    category: 'Price Sensitivity',
    title: 'Durability',
    prompt: 'You need a new everyday bag. Both look good to you.',
    question: 'Which do you buy?',
    tradeoff: 'Price vs quality',
    complexity: 1,
    phase: 'observe',
    options: [
      { id: 'A', label: 'The ₹1,200 bag', facts: ['Typically lasts about a year'], effects: { price: 2, longTerm: -1 } },
      { id: 'B', label: 'The ₹3,500 bag', facts: ['5-year warranty'], effects: { price: -1, longTerm: 2, trust: 1 } },
    ],
  },
  {
    id: 's08',
    category: 'Time',
    title: 'Delivery',
    prompt: 'You are ordering something you will use, but you do not need it urgently.',
    question: 'Which delivery do you pick?',
    tradeoff: 'Money vs time',
    complexity: 1,
    phase: 'observe',
    options: [
      { id: 'A', label: 'Express', facts: ['₹150', 'Arrives in 1 hour'], effects: { convenience: 2, patience: -2, price: -1 } },
      { id: 'B', label: 'Standard', facts: ['Free', 'Arrives in 4 days'], effects: { convenience: -1, patience: 2, price: 1 } },
    ],
  },
  {
    id: 's09',
    category: 'Uncertainty',
    title: 'Two Offers',
    prompt: 'You receive two job offers for similar roles.',
    question: 'Which offer do you accept?',
    tradeoff: 'Stability vs upside',
    complexity: 3,
    phase: 'observe',
    options: [
      { id: 'A', label: 'Established company', facts: ['₹8 lakh / year', 'Stable, predictable'], effects: { risk: -2, trust: 1 } },
      { id: 'B', label: 'Early-stage startup', facts: ['₹6 lakh / year + equity', 'Equity could be worth a lot — or nothing'], effects: { risk: 2, longTerm: 1, trust: -1 } },
    ],
  },
  {
    id: 's10',
    category: 'Long-Term Thinking',
    title: 'The Bonus',
    prompt: 'You receive an unexpected ₹20,000 bonus.',
    question: 'What do you do with it?',
    tradeoff: 'Immediate experience vs future value',
    complexity: 2,
    phase: 'observe',
    options: [
      { id: 'A', label: 'Take a trip', facts: ['A weekend away, next month'], effects: { longTerm: -2, patience: -1 } },
      { id: 'B', label: 'Invest it', facts: ['Index fund, left for 5 years', 'Value can go up or down'], effects: { longTerm: 2, patience: 1, risk: 1 } },
    ],
  },
  {
    id: 's11',
    category: 'Status',
    title: 'The Brand',
    prompt: 'You are buying a phone. Two models have nearly identical specifications and reviews.',
    question: 'Which do you buy?',
    tradeoff: 'Known brand vs unknown brand',
    complexity: 2,
    phase: 'observe',
    options: [
      { id: 'A', label: 'Well-known brand', facts: ['₹32,000', 'Widely recognised'], effects: { trust: 2, price: -2, social: 1 } },
      { id: 'B', label: 'Lesser-known brand', facts: ['₹24,000', 'Strong reviews'], effects: { trust: -1, price: 2, risk: 1 } },
    ],
  },
  {
    id: 's12',
    category: 'Social Proof',
    title: 'The Queue',
    prompt: 'You are hungry and choosing between two restaurants side by side with similar menus and prices.',
    question: 'Where do you eat?',
    tradeoff: 'Popularity vs convenience',
    complexity: 2,
    phase: 'observe',
    options: [
      { id: 'A', label: 'The busy one', facts: ['30-minute queue', 'Packed with people'], effects: { social: 2, patience: 1, convenience: -1 } },
      { id: 'B', label: 'The empty one', facts: ['Seated immediately', 'Nobody inside'], effects: { social: -2, convenience: 2 } },
    ],
  },

  // ───────────── PHASE 2 · PREDICTION (13) ─────────────
  {
    id: 's13',
    category: 'Patience',
    title: 'One Week',
    prompt: 'You can receive a payment today, or a slightly larger one in a week. Both are guaranteed.',
    question: 'Which do you choose?',
    tradeoff: 'Immediate vs delayed reward',
    complexity: 1,
    phase: 'predict',
    options: [
      { id: 'A', label: '₹500 today', facts: ['Paid now'], effects: { patience: -2, longTerm: -1 } },
      { id: 'B', label: '₹600 next week', facts: ['Paid in 7 days', '+20%'], effects: { patience: 2, longTerm: 1 } },
    ],
  },
  {
    id: 's14',
    category: 'Convenience',
    title: 'Groceries',
    prompt: 'You need groceries for the week. The store is a 30-minute round trip.',
    question: 'How do you get them?',
    tradeoff: 'Convenience vs savings',
    complexity: 1,
    phase: 'predict',
    options: [
      { id: 'A', label: 'Order online', facts: ['₹80 delivery fee', 'No travel'], effects: { convenience: 2, price: -1 } },
      { id: 'B', label: 'Go yourself', facts: ['No fee', '30 minutes of your time'], effects: { convenience: -2, price: 1 } },
    ],
  },
  {
    id: 's15',
    category: 'Uncertainty',
    title: 'The Flight',
    prompt: 'You are booking a flight for a trip two months away. Your plans are probably — but not certainly — fixed.',
    question: 'Which fare do you book?',
    tradeoff: 'Paying for flexibility',
    complexity: 2,
    phase: 'predict',
    options: [
      { id: 'A', label: 'Non-refundable', facts: ['₹4,800', 'No refund if plans change'], effects: { risk: 1, price: 2 } },
      { id: 'B', label: 'Refundable', facts: ['₹6,300', 'Full refund until 24h before'], effects: { risk: -2, price: -1, trust: 1 } },
    ],
  },
  {
    id: 's16',
    category: 'Scarcity',
    title: 'Selling Fast',
    prompt:
      'Tickets for a concert you would enjoy are ₹2,500. The site says: SELLING FAST — PRICE RISES IN 2 HOURS. You are not yet sure you are free that evening.',
    question: 'What do you do?',
    tradeoff: 'Urgency vs certainty of plans',
    complexity: 3,
    phase: 'predict',
    options: [
      { id: 'A', label: 'Buy now', facts: ['₹2,500', 'Plans not confirmed'], effects: { scarcity: 2, patience: -1 } },
      { id: 'B', label: 'Confirm plans first', facts: ['Maybe ₹3,000 later', 'Might sell out'], effects: { scarcity: -2, patience: 1, risk: 1 } },
    ],
  },
  {
    id: 's17',
    category: 'Social Proof',
    title: 'Recommended',
    prompt: 'You want a budgeting app. Both options do what you need.',
    question: 'Which do you subscribe to?',
    tradeoff: 'Popularity vs price',
    complexity: 2,
    phase: 'predict',
    options: [
      { id: 'A', label: 'What your friends use', facts: ['₹199 / month', 'Recommended by 3 friends'], effects: { social: 2, price: -1 } },
      { id: 'B', label: 'The cheaper alternative', facts: ['₹149 / month', 'Good reviews from strangers'], effects: { social: -1, price: 1 } },
    ],
  },
  {
    id: 's18',
    category: 'Trust',
    title: 'The Repair',
    prompt: 'Your laptop screen needs replacing.',
    question: 'Where do you get it repaired?',
    tradeoff: 'Paying for reassurance',
    complexity: 2,
    phase: 'predict',
    options: [
      { id: 'A', label: 'Authorised service centre', facts: ['₹4,000', '6-month warranty'], effects: { trust: 2, price: -2, risk: -1 } },
      { id: 'B', label: 'Local repair shop', facts: ['₹2,200', 'No warranty', 'A friend says they are decent'], effects: { trust: -1, price: 2, risk: 1 } },
    ],
  },
  {
    id: 's19',
    category: 'Long-Term Thinking',
    title: 'Upgrade',
    prompt: 'You have ₹15,000 set aside. Your current phone works, but it is slow.',
    question: 'What do you spend it on?',
    tradeoff: 'Present comfort vs future payoff',
    complexity: 2,
    phase: 'predict',
    options: [
      { id: 'A', label: 'A new phone', facts: ['Used every day, starting now'], effects: { longTerm: -2 } },
      { id: 'B', label: 'A certification course', facts: ['Likely to help your career in 2–3 years'], effects: { longTerm: 2, patience: 1 } },
    ],
  },
  {
    id: 's20',
    category: 'Money',
    title: 'Savings',
    prompt: 'You are putting money aside for five years.',
    question: 'Where do you keep it?',
    tradeoff: 'Certainty vs potential reward',
    complexity: 2,
    phase: 'predict',
    options: [
      { id: 'A', label: 'Fixed deposit', facts: ['7% a year, guaranteed'], effects: { risk: -2, trust: 1 } },
      { id: 'B', label: 'Market fund', facts: ['Averaged 12% a year', 'Lost 15% in its worst year'], effects: { risk: 2, longTerm: 1 } },
    ],
  },
  {
    id: 's21',
    category: 'Price Sensitivity',
    title: 'The Fee',
    prompt: 'You are going to a film this evening. Seats are not likely to sell out.',
    question: 'How do you get your ticket?',
    tradeoff: 'Small fee vs small effort',
    complexity: 1,
    phase: 'predict',
    options: [
      { id: 'A', label: 'Book in the app', facts: ['₹40 convenience fee'], effects: { convenience: 2, price: -1 } },
      { id: 'B', label: 'Buy at the counter', facts: ['No fee', 'Arrive 20 minutes early'], effects: { convenience: -1, price: 1, patience: 1 } },
    ],
  },
  {
    id: 's22',
    category: 'Scarcity',
    title: 'Limited Edition',
    prompt: 'You are buying sneakers. You like two designs equally.',
    question: 'Which pair do you buy?',
    tradeoff: 'Limited availability vs normal availability',
    complexity: 2,
    phase: 'predict',
    options: [
      { id: 'A', label: 'Limited edition', facts: ['₹7,000', 'Only 500 pairs made'], effects: { scarcity: 2, price: -1, social: 1 } },
      { id: 'B', label: 'Regular model', facts: ['₹5,500', 'Always in stock'], effects: { scarcity: -2, price: 1 } },
    ],
  },
  {
    id: 's23',
    category: 'Time',
    title: 'Launch Day',
    prompt: 'A gadget you want has just launched. Prices for this kind of product usually drop within two months — but not always.',
    question: 'When do you buy?',
    tradeoff: 'Immediate reward vs expected savings',
    complexity: 3,
    phase: 'predict',
    options: [
      { id: 'A', label: 'Buy today', facts: ['₹18,000', 'Yours now'], effects: { patience: -2, risk: -1 } },
      { id: 'B', label: 'Wait six weeks', facts: ['Expected ₹14,500', 'Not guaranteed'], effects: { patience: 2, price: 1, risk: 1 } },
    ],
  },
  {
    id: 's24',
    category: 'Status',
    title: 'The Gym',
    prompt: 'You are joining a gym. Both have the equipment you need.',
    question: 'Which do you join?',
    tradeoff: 'Reputation vs price',
    complexity: 2,
    phase: 'predict',
    options: [
      { id: 'A', label: 'Premium gym', facts: ['₹4,500 / month', 'Well known; people you know go there'], effects: { social: 1, trust: 1, price: -2 } },
      { id: 'B', label: 'Basic gym', facts: ['₹1,500 / month', 'Closer to home'], effects: { social: -1, price: 2, convenience: 1 } },
    ],
  },
  {
    id: 's25',
    category: 'Risk',
    title: 'The Box',
    prompt: 'You are offered a choice at the end of a game. On average, the box pays more — but usually it pays less.',
    question: 'What do you do?',
    tradeoff: 'Certainty vs expected value',
    complexity: 2,
    phase: 'predict',
    options: [
      { id: 'A', label: 'Keep ₹10,000', facts: ['Guaranteed'], effects: { risk: -2 } },
      { id: 'B', label: 'Open the box', facts: ['1 in 3: ₹40,000', '2 in 3: ₹2,000'], effects: { risk: 2 } },
    ],
  },
]

/** Quick lookup: getScenario('s07') */
export const SCENARIOS_BY_ID: Record<string, Scenario> = Object.fromEntries(SCENARIOS.map((s) => [s.id, s]))

export function getScenario(id: string): Scenario | undefined {
  return SCENARIOS_BY_ID[id]
}

/** 1-based display number, e.g. "Scenario #17". */
export function scenarioNumber(id: string): number {
  return SCENARIOS.findIndex((s) => s.id === id) + 1
}

export const OBSERVE_COUNT = SCENARIOS.filter((s) => s.phase === 'observe').length
