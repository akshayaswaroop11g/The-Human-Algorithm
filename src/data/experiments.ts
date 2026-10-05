/**
 * The Experiment Library. Each "experiment" is a research question that
 * groups a few scenarios together. Add a new object to EXPERIMENTS to
 * create a new card + detail page automatically.
 */
export interface Experiment {
  slug: string
  index: string
  title: string
  question: string
  summary: string
  scenarioIds: string[]
  methodology: string[]
  limitations: string[]
}

export const EXPERIMENTS: Experiment[] = [
  {
    slug: 'value-of-waiting',
    index: 'E-01',
    title: 'The Value of Waiting',
    question: 'How much more must someone receive to justify waiting?',
    summary:
      'Pairs of guaranteed rewards — smaller and sooner versus larger and later — with different delays and premiums. If people discounted the future consistently, a 50% premium over a month and a 20% premium over a week would be treated alike.',
    scenarioIds: ['s01', 's13', 's08', 's23'],
    methodology: [
      'Participants choose between an immediate reward and a larger delayed reward.',
      'Delays (one week, one month, several weeks) and premiums (+20%, +50%) vary between scenarios.',
      'We compare the share of participants who wait across scenarios with different implied rates of return.',
    ],
    limitations: [
      'The rewards are hypothetical; real money in a real account may change the answer.',
      'Only a few delay/premium combinations are tested, so no precise discount rate can be estimated.',
      'Delivery and gadget scenarios also involve convenience and uncertainty, not only time.',
    ],
  },
  {
    slug: 'trust-premium',
    index: 'E-02',
    title: 'The Trust Premium',
    question: 'How much more are people willing to pay when they trust something?',
    summary:
      'Choices between an established, verified or guaranteed option and a cheaper, less established one. The question is how large a price gap people accept in exchange for reassurance.',
    scenarioIds: ['s03', 's11', 's18', 's15'],
    methodology: [
      'Each scenario pairs a reassuring option (more reviews, known brand, warranty, refundability) with a cheaper or less-proven option.',
      'Price premiums for the reassuring option range from 0% (sellers) to roughly 80% (repair).',
      'We record the share choosing the reassuring option at each premium.',
    ],
    limitations: [
      'Brand familiarity differs between participants and is not measured.',
      'Prices are fixed per scenario; a proper willingness-to-pay curve would need varied prices.',
    ],
  },
  {
    slug: 'price-of-convenience',
    index: 'E-03',
    title: 'The Price of Convenience',
    question: 'How much is saving time worth?',
    summary:
      'Small fees or price differences set against travel, waiting and effort. Implied value of time ranges from about ₹40 for 20 minutes to ₹200 for 35 minutes.',
    scenarioIds: ['s02', 's14', 's21', 's08'],
    methodology: [
      'Each scenario offers a cheaper option that costs time or effort and a more expensive option that saves it.',
      'We compute the implied value of time where possible (rupees saved per minute spent).',
      'Results are compared across fee sizes to see whether small fees are treated differently from large ones.',
    ],
    limitations: [
      'Participants’ actual travel times, income and schedules are unknown.',
      'The scenarios assume both options are otherwise equal, which is rarely true in practice.',
    ],
  },
  {
    slug: 'scarcity-effect',
    index: 'E-04',
    title: 'The Scarcity Effect',
    question: 'Does limited availability change decisions?',
    summary:
      'Urgency signals — "only 3 left", "price rises in 2 hours", "only 500 made" — paired with a reason to wait. Do these cues move people, and does the type of cue matter?',
    scenarioIds: ['s05', 's16', 's22'],
    methodology: [
      'Each scenario introduces a scarcity or urgency cue alongside a reasonable alternative (comparing, confirming plans, a regular model).',
      'We record how often participants act on the cue.',
      'A future version could show the same scenario with and without the cue to different participants (an A/B design).',
    ],
    limitations: [
      'Without a no-cue control group, we can describe choices but cannot isolate the effect of the cue itself.',
      'Participants may recognise urgency cues as a marketing device in an experiment and discount them.',
    ],
  },
  {
    slug: 'social-proof',
    index: 'E-05',
    title: 'The Power of Social Proof',
    question: 'How strongly do other people’s choices influence ours?',
    summary:
      'Popularity — purchase counts, queues, friends’ recommendations — set against better specifications, convenience or a lower price.',
    scenarioIds: ['s06', 's12', 's17', 's24'],
    methodology: [
      'Each scenario pairs a popular option with one that is better on another attribute.',
      'Popularity signals vary: anonymous counts, a visible crowd, and friends.',
      'We compare the share choosing the popular option by type of signal.',
    ],
    limitations: [
      'Popularity can be a rational signal of quality, so following it is not necessarily a bias.',
      'Real social influence involves relationships and context that a text scenario cannot reproduce.',
    ],
  },
]

export function getExperiment(slug: string): Experiment | undefined {
  return EXPERIMENTS.find((e) => e.slug === slug)
}
