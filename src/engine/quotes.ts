export interface PetQuote {
  text: string;
  category: 'calm' | 'love' | 'energy';
}

export const CALM_QUOTES: PetQuote[] = [
  {
    text: 'Unclench your jaw, drop your shoulders, and take one slow breath with me.',
    category: 'calm',
  },
  {
    text: 'You do not have to finish everything in this minute. Steady steps are enough.',
    category: 'calm',
  },
  {
    text: 'Your mind deserves quiet too. Rest your eyes away from the screen for 20 seconds.',
    category: 'calm',
  },
  {
    text: 'Even the busiest river pauses in calm pools. Sip some water and breathe.',
    category: 'calm',
  },
  {
    text: 'Progress happens in calm focus, not exhaustion. Be gentle with your pace.',
    category: 'calm',
  },
];

export const LOVE_QUOTES: PetQuote[] = [
  {
    text: 'You are doing wonderfully, even on the days that feel heavy. I am proud of you.',
    category: 'love',
  },
  {
    text: 'Your effort matters, and you are deeply appreciated just as you are.',
    category: 'love',
  },
  {
    text: 'Remember to treat yourself with the same kindness you give to everyone else.',
    category: 'love',
  },
  {
    text: 'No matter how tough the task is, you are capable, resilient, and loved.',
    category: 'love',
  },
  {
    text: 'Here is a warm virtual hug from the corner of your screen. You have got this.',
    category: 'love',
  },
];

export const ENERGY_QUOTES: PetQuote[] = [
  {
    text: 'Five-minute Energy Mode! Let us roll around, toss the ball, and recharge your mind.',
    category: 'energy',
  },
  {
    text: 'Break time! Stretch your wrists, grab a snack, and play with me for 5 minutes.',
    category: 'energy',
  },
  {
    text: 'Your brain works better after a joyful pause. Let us boost that energy bar!',
    category: 'energy',
  },
];

export function pickQuote(
  category: 'calm' | 'love' | 'energy' | 'any' = 'any',
  previousText?: string
): PetQuote {
  const pool =
    category === 'calm'
      ? CALM_QUOTES
      : category === 'love'
      ? LOVE_QUOTES
      : category === 'energy'
      ? ENERGY_QUOTES
      : [...CALM_QUOTES, ...LOVE_QUOTES];

  const filtered = pool.filter((q) => q.text !== previousText);
  const source = filtered.length > 0 ? filtered : pool;
  return source[Math.floor(Math.random() * source.length)];
}
