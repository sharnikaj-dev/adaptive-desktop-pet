import {
  AccessoryId,
  BehaviorEvent,
  CircadianPhase,
  PetMood,
  PetProfile,
  UserTelemetry,
  WorkStrain,
} from '../types/pet';

export const MOOD_META: Record<
  PetMood,
  {
    label: string;
    description: string;
    accentColor: string;
    bgTint: string;
    textColor: string;
  }
> = {
  CURIOUS: {
    label: 'Curious',
    description: 'Roaming the screen and observing your active workspace.',
    accentColor: '#0284C7',
    bgTint: 'bg-sky-50',
    textColor: 'text-sky-700',
  },
  FOCUSED: {
    label: 'Focused',
    description: 'Synchronized with your steady work and app session.',
    accentColor: '#4F46E5',
    bgTint: 'bg-indigo-50',
    textColor: 'text-indigo-700',
  },
  PLAYFUL: {
    label: 'Energy Mode',
    description: 'Rolling, hopping, and playing for a refreshing 5-min break.',
    accentColor: '#D97706',
    bgTint: 'bg-amber-50',
    textColor: 'text-amber-700',
  },
  SLEEPY: {
    label: 'Corner Nap',
    description: 'Curled up on its corner cushion until activated.',
    accentColor: '#64748B',
    bgTint: 'bg-slate-100',
    textColor: 'text-slate-700',
  },
  CONCERNED: {
    label: 'Caring Check-In',
    description: 'Noticing intense hard work; offering calming quotes and love.',
    accentColor: '#DC2626',
    bgTint: 'bg-rose-50',
    textColor: 'text-rose-700',
  },
  AFFECTIONATE: {
    label: 'Affectionate',
    description: 'Warm and bonded from recent care and gentle interactions.',
    accentColor: '#059669',
    bgTint: 'bg-emerald-50',
    textColor: 'text-emerald-700',
  },
  ZEN: {
    label: 'Zen',
    description: 'Calmly resting in balanced rhythm with your workspace.',
    accentColor: '#0D9488',
    bgTint: 'bg-teal-50',
    textColor: 'text-teal-700',
  },
};

export const ACCESSORY_META: Record<
  AccessoryId,
  { label: string; unlockHint: string }
> = {
  glasses: {
    label: 'Focus Specs',
    unlockHint: 'Reach 60s of steady focus or 45+ WPM typing',
  },
  scarf: {
    label: 'Cozy Knit Scarf',
    unlockHint: 'Pet your red panda 5 times to build warmth and bond',
  },
  headphones: {
    label: 'Studio Cans',
    unlockHint: 'Play calming chords in Lo-Fi Chimes',
  },
  teacup: {
    label: 'Matcha Break Mug',
    unlockHint: 'Feed 3 snacks during work breaks',
  },
  star_pin: {
    label: 'Flow Star Pin',
    unlockHint: 'Complete 1 Focus cycle or reach 15 interactions',
  },
};

export function clamp(val: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, val));
}

export function getCurrentCircadianPhase(hour = new Date().getHours()): CircadianPhase {
  if (hour >= 5 && hour < 12) return 'MORNING';
  if (hour >= 12 && hour < 17) return 'AFTERNOON';
  if (hour >= 17 && hour < 22) return 'EVENING';
  return 'NIGHT';
}

export function getVitalStatusLabel(key: keyof PetProfile['vitals'], val: number): string {
  if (key === 'energy') {
    if (val >= 75) return 'Energized';
    if (val >= 40) return 'Steady';
    return 'Needs Break';
  }
  if (key === 'bond') {
    if (val >= 80) return 'Devoted';
    if (val >= 50) return 'Warming Up';
    return 'Shy';
  }
  if (key === 'focusSync') {
    if (val >= 75) return 'In Flow';
    if (val >= 45) return 'Attentive';
    return 'Wandering';
  }
  if (val >= 75) return 'Grounded';
  if (val >= 45) return 'Balanced';
  return 'Tense';
}

export function computeWorkStrain(telemetry: UserTelemetry): WorkStrain {
  if (
    telemetry.activeContext === 'RAPID_BURST' ||
    telemetry.typingWpm >= 75 ||
    telemetry.appWorkSeconds >= 45 ||
    (telemetry.circadian === 'NIGHT' && telemetry.typingWpm >= 35)
  ) {
    return 'WORKING_HARD';
  }
  if (
    telemetry.typingWpm >= 18 ||
    telemetry.focusTimerRunning ||
    telemetry.activeContext === 'STEADY_TYPING'
  ) {
    return 'STEADY';
  }
  return 'RELAXED';
}

export function evaluateAdaptiveState(
  profile: PetProfile,
  telemetry: UserTelemetry,
  hasActiveBall: boolean
): {
  nextMood: PetMood;
  reason: string;
  thought: string | null;
  vitalsDelta: Partial<PetProfile['vitals']>;
  personalityDelta: Partial<PetProfile['personality']>;
  newUnlock?: AccessoryId;
} {
  if (!telemetry.petActive) {
    return {
      nextMood: 'SLEEPY',
      reason: 'Curled up in the desktop corner — click Activate to wake',
      thought: null,
      vitalsDelta: { energy: 0.4, calm: 0.25 },
      personalityDelta: {},
    };
  }

  const { typingWpm, mouseVelocity, idleSeconds, focusTimerRunning, circadian, energyModeActive } =
    telemetry;
  let nextMood: PetMood = profile.mood;
  let reason = profile.moodReason;
  let thought: string | null = null;
  const vitalsDelta: Partial<PetProfile['vitals']> = {};
  const personalityDelta: Partial<PetProfile['personality']> = {};
  const strain = computeWorkStrain(telemetry);

  if (energyModeActive || hasActiveBall) {
    nextMood = 'PLAYFUL';
    reason = energyModeActive
      ? '5-Min Energy Relief Mode — rolling, waving, and recharging'
      : 'Chasing active desktop ball physics';
    thought = hasActiveBall ? 'Got it!' : null;
    vitalsDelta.energy = 0.25;
    vitalsDelta.bond = 0.25;
    vitalsDelta.calm = 0.25;
    personalityDelta.playfulness = 0.25;
  } else if (strain === 'WORKING_HARD') {
    nextMood = 'CONCERNED';
    reason = `Working hard on ${telemetry.activeAppName} — sharing calming thoughts & love`;
    vitalsDelta.calm = -0.35;
    vitalsDelta.energy = -0.25;
    personalityDelta.empathy = 0.28;
  } else if (telemetry.activeContext === 'ERRATIC_MOUSE' || mouseVelocity > 950) {
    nextMood = profile.personality.playfulness > 60 ? 'PLAYFUL' : 'CURIOUS';
    reason = `Tracking quick cursor movement (${Math.round(mouseVelocity)} px/s)`;
    thought = profile.personality.playfulness > 60 ? 'Zoomies!' : 'What are we opening?';
    vitalsDelta.calm = -0.25;
    personalityDelta.curiosity = 0.22;
  } else if (focusTimerRunning || typingWpm >= 20 || telemetry.activeContext === 'STEADY_TYPING') {
    nextMood = 'FOCUSED';
    reason = focusTimerRunning
      ? `Observing Focus Timer on ${telemetry.activeAppName}`
      : `Observing steady work on ${telemetry.activeAppName} (${Math.round(typingWpm)} WPM)`;
    vitalsDelta.focusSync = 0.5;
    vitalsDelta.calm = 0.12;
    vitalsDelta.energy = -0.12;
    personalityDelta.calmness = 0.18;
  } else if (idleSeconds >= 30 || profile.vitals.energy < 22 || circadian === 'NIGHT') {
    nextMood = 'SLEEPY';
    reason =
      circadian === 'NIGHT'
        ? 'Nighttime wind-down — keeping you gentle company'
        : `Screen quiet for ${Math.round(idleSeconds)}s`;
    vitalsDelta.energy = 0.6;
    vitalsDelta.calm = 0.35;
    personalityDelta.calmness = 0.12;
  } else if (idleSeconds >= 12) {
    nextMood = 'ZEN';
    reason = `Calm pause while watching ${telemetry.activeAppName}`;
    vitalsDelta.calm = 0.3;
    vitalsDelta.energy = 0.25;
  } else if (profile.vitals.bond >= 80 && mouseVelocity > 80) {
    nextMood = 'AFFECTIONATE';
    reason = 'High bond warmth while roaming your workspace';
    vitalsDelta.calm = 0.15;
  } else {
    nextMood = 'CURIOUS';
    reason = `Roaming screen & monitoring ${telemetry.activeAppName}`;
    personalityDelta.curiosity = 0.08;
  }

  let newUnlock: AccessoryId | undefined;
  const unlocked = profile.habits.unlockedAccessories;
  if (!unlocked.includes('glasses') && (typingWpm >= 45 || profile.habits.secondsByContext.focus >= 60)) {
    newUnlock = 'glasses';
  } else if (!unlocked.includes('scarf') && profile.habits.pettingCount >= 5) {
    newUnlock = 'scarf';
  } else if (!unlocked.includes('teacup') && profile.habits.snacksFed >= 3) {
    newUnlock = 'teacup';
  } else if (
    !unlocked.includes('star_pin') &&
    (profile.habits.focusSessionsCompleted >= 1 || profile.habits.totalInteractions >= 15)
  ) {
    newUnlock = 'star_pin';
  }

  return {
    nextMood,
    reason,
    thought,
    vitalsDelta,
    personalityDelta,
    newUnlock,
  };
}

export function createBehaviorEvent(
  trigger: string,
  adaptation: string,
  moodResult: PetMood
): BehaviorEvent {
  const now = new Date();
  const timestamp = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp,
    trigger,
    adaptation,
    moodResult,
  };
}

export const INITIAL_PROFILE: PetProfile = {
  name: 'Poko',
  species: 'red_panda',
  mood: 'SLEEPY',
  moodReason: 'Curled up in the desktop corner — click Activate to wake',
  thoughtBubble: null,
  vitals: {
    energy: 86,
    bond: 54,
    focusSync: 68,
    calm: 74,
  },
  personality: {
    curiosity: 62,
    calmness: 55,
    playfulness: 58,
    empathy: 52,
  },
  habits: {
    totalInteractions: 0,
    pettingCount: 0,
    snacksFed: 0,
    ballThrows: 0,
    focusSessionsCompleted: 0,
    peakWpmRecorded: 0,
    secondsByContext: {
      focus: 0,
      explore: 0,
      rest: 0,
      play: 0,
    },
    secondsByPhase: {
      MORNING: 0,
      AFTERNOON: 0,
      EVENING: 0,
      NIGHT: 0,
    },
    appUsageSeconds: {
      Scratchpad: 0,
      'Code Editor': 0,
      'Focus Timer': 0,
    },
    unlockedAccessories: [],
    equippedAccessories: [],
  },
};
