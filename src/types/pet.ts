export type PetMood =
  | 'CURIOUS'
  | 'FOCUSED'
  | 'PLAYFUL'
  | 'SLEEPY'
  | 'CONCERNED'
  | 'AFFECTIONATE'
  | 'ZEN';

export type PetAction =
  | 'idle'
  | 'walk'
  | 'roll'
  | 'hop'
  | 'wave'
  | 'eat'
  | 'sleep_corner';

export type CircadianPhase = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT';

export type ActivityContext =
  | 'IDLE'
  | 'STEADY_TYPING'
  | 'RAPID_BURST'
  | 'ERRATIC_MOUSE'
  | 'FOCUS_SESSION'
  | 'PLAYING'
  | 'RESTING';

export type WorkStrain = 'RELAXED' | 'STEADY' | 'WORKING_HARD';

export type PetSpecies = 'red_panda' | 'panda' | 'shiba' | 'cat';

export type AccessoryId = 'glasses' | 'scarf' | 'headphones' | 'teacup' | 'star_pin';

export type SnackType = 'berry' | 'matcha' | 'ramen' | 'cookie';

export interface PetVitals {
  energy: number;
  bond: number;
  focusSync: number;
  calm: number;
}

export interface PersonalityTraits {
  curiosity: number;
  calmness: number;
  playfulness: number;
  empathy: number;
}

export interface UserTelemetry {
  typingWpm: number;
  mouseVelocity: number;
  idleSeconds: number;
  clicksPerMin: number;
  activeContext: ActivityContext;
  circadian: CircadianPhase;
  focusTimerRunning: boolean;
  focusSecondsRemaining: number;
  petActive: boolean;
  energyModeActive: boolean;
  reliefSecondsRemaining: number;
  activeAppName: string;
  appWorkSeconds: number;
  laptopWorkSeconds: number;
  workStrain: WorkStrain;
}

export interface HabitMemory {
  totalInteractions: number;
  pettingCount: number;
  snacksFed: number;
  ballThrows: number;
  focusSessionsCompleted: number;
  peakWpmRecorded: number;
  secondsByContext: Record<'focus' | 'explore' | 'rest' | 'play', number>;
  secondsByPhase: Record<CircadianPhase, number>;
  appUsageSeconds: Record<string, number>;
  unlockedAccessories: AccessoryId[];
  equippedAccessories: AccessoryId[];
}

export interface BehaviorEvent {
  id: string;
  timestamp: string;
  trigger: string;
  adaptation: string;
  moodResult: PetMood;
}

export interface DesktopWindowState {
  id: 'notes' | 'timer' | 'ambient' | 'code';
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  open: boolean;
  zIndex: number;
}

export interface FloatingParticle {
  id: string;
  kind: 'heart' | 'zzz' | 'spark' | 'note' | 'sweat';
  x: number;
  y: number;
}

export interface ToyBall {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface TreatDrop {
  id: string;
  snack: SnackType;
  x: number;
  y: number;
}

export interface PetProfile {
  name: string;
  species: PetSpecies;
  mood: PetMood;
  moodReason: string;
  thoughtBubble: string | null;
  vitals: PetVitals;
  personality: PersonalityTraits;
  habits: HabitMemory;
}
