import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessoryId,
  ActivityContext,
  BehaviorEvent,
  CircadianPhase,
  PetProfile,
  PetSpecies,
  SnackType,
  UserTelemetry,
} from './types/pet';
import {
  ACCESSORY_META,
  clamp,
  computeWorkStrain,
  createBehaviorEvent,
  evaluateAdaptiveState,
  getCurrentCircadianPhase,
  INITIAL_PROFILE,
  MOOD_META,
} from './engine/behaviorEngine';
import { PetQuote, pickQuote } from './engine/quotes';
import { DesktopStage } from './components/DesktopStage';
import { BehaviorDeck } from './components/BehaviorDeck';
import { HabitMemoryView } from './components/HabitMemoryView';
import { PersonalityView } from './components/PersonalityView';
import { PythonExportView } from './components/PythonExportView';
import { soundEngine } from './utils/sound';
import { Volume2, VolumeX } from 'lucide-react';

type ActiveTab = 'stage' | 'habits' | 'personality' | 'python';

const STORAGE_KEY = 'adaptive_desktop_pet_profile_v3';

function loadSavedProfile(): PetProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_PROFILE;
    const parsed = JSON.parse(raw) as PetProfile;
    if (parsed && parsed.vitals && parsed.personality && parsed.habits) {
      return {
        ...INITIAL_PROFILE,
        ...parsed,
        habits: {
          ...INITIAL_PROFILE.habits,
          ...parsed.habits,
          appUsageSeconds: {
            ...INITIAL_PROFILE.habits.appUsageSeconds,
            ...(parsed.habits.appUsageSeconds || {}),
          },
        },
      };
    }
  } catch {
    // Ignore malformed storage
  }
  return INITIAL_PROFILE;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('stage');
  const [profile, setProfile] = useState<PetProfile>(loadSavedProfile);
  const [soundOn, setSoundOn] = useState(true);
  const [ballActiveSignal, setBallActiveSignal] = useState(0);
  const [ballWindowUntil, setBallWindowUntil] = useState(0);
  const [activeQuote, setActiveQuote] = useState<PetQuote | null>(null);

  const [telemetry, setTelemetry] = useState<UserTelemetry>(() => ({
    typingWpm: 0,
    mouseVelocity: 0,
    idleSeconds: 0,
    clicksPerMin: 0,
    activeContext: 'IDLE',
    circadian: getCurrentCircadianPhase(),
    focusTimerRunning: false,
    focusSecondsRemaining: 25 * 60,
    petActive: false,
    energyModeActive: false,
    reliefSecondsRemaining: 5 * 60,
    activeAppName: 'Code Editor',
    appWorkSeconds: 0,
    laptopWorkSeconds: 0,
    workStrain: 'RELAXED',
  }));

  const [events, setEvents] = useState<BehaviorEvent[]>(() => [
    createBehaviorEvent(
      'Corner Standby',
      'Komo is resting in the bottom-right corner. Click Activate to begin.',
      'SLEEPY'
    ),
  ]);

  const keyTimestampsRef = useRef<number[]>([]);
  const lastActivityRef = useRef<number>(Date.now());
  const scenarioUntilRef = useRef<number>(0);
  const lastAutoQuoteAtRef = useRef<number>(0);
  const thoughtTimeoutRef = useRef<number | null>(null);
  const telemetryRef = useRef(telemetry);
  telemetryRef.current = telemetry;
  const profileRef = useRef(profile);
  profileRef.current = profile;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // Ignore quota errors
    }
  }, [profile]);

  useEffect(() => {
    soundEngine.enabled = soundOn;
  }, [soundOn]);

  const pushEvent = useCallback(
    (trigger: string, adaptation: string, moodResult: PetProfile['mood']) => {
      setEvents((prev) => [
        createBehaviorEvent(trigger, adaptation, moodResult),
        ...prev.slice(0, 24),
      ]);
    },
    []
  );

  const showThought = useCallback((text: string | null, durationMs = 3600) => {
    if (thoughtTimeoutRef.current) {
      window.clearTimeout(thoughtTimeoutRef.current);
      thoughtTimeoutRef.current = null;
    }
    setProfile((prev) => ({ ...prev, thoughtBubble: text }));
    if (text) {
      thoughtTimeoutRef.current = window.setTimeout(() => {
        setProfile((prev) => ({ ...prev, thoughtBubble: null }));
      }, durationMs);
    }
  }, []);

  const handleRequestQuote = useCallback(
    (kind: 'calm' | 'love' | 'energy' = 'calm') => {
      const next = pickQuote(kind, activeQuote?.text);
      setActiveQuote(next);
      soundEngine.playChirp();
      setTelemetry((prev) => (prev.petActive ? prev : { ...prev, petActive: true }));
      pushEvent(
        kind === 'love'
          ? 'Love Note Shared'
          : kind === 'energy'
          ? 'Energy Relief Prompt'
          : 'Calming Mind Quote',
        next.text,
        kind === 'love' ? 'AFFECTIONATE' : 'CONCERNED'
      );
    },
    [activeQuote?.text, pushEvent]
  );

  const handleTogglePetActive = useCallback(() => {
    lastActivityRef.current = Date.now();
    setTelemetry((prev) => {
      const nextActive = !prev.petActive;
      if (nextActive) {
        soundEngine.playChirp();
        showThought(`Awake! Watching ${prev.activeAppName}`);
        pushEvent(
          'Pet Activated',
          `Woke up from corner standby to observe ${prev.activeAppName} and roam.`,
          'CURIOUS'
        );
      } else {
        setActiveQuote(null);
        showThought(null);
        pushEvent(
          'Corner Standby',
          'Curled back up in the bottom-right desktop corner.',
          'SLEEPY'
        );
      }
      return {
        ...prev,
        petActive: nextActive,
        energyModeActive: nextActive ? prev.energyModeActive : false,
      };
    });
  }, [pushEvent, showThought]);

  const handleToggleEnergyMode = useCallback(() => {
    lastActivityRef.current = Date.now();
    setTelemetry((prev) => {
      const nextEnergy = !prev.energyModeActive;
      if (nextEnergy) {
        soundEngine.playFocusChime();
        const q = pickQuote('energy');
        setActiveQuote(q);
        pushEvent(
          '5-Min Energy Mode',
          'Started 5-minute relief break with playful rolling & ball games.',
          'PLAYFUL'
        );
      } else {
        setActiveQuote(null);
        pushEvent(
          'Break Complete',
          'Returned from Energy Mode back to calm work observation.',
          'ZEN'
        );
      }
      return {
        ...prev,
        petActive: true,
        energyModeActive: nextEnergy,
        reliefSecondsRemaining: 5 * 60,
        activeContext: nextEnergy ? 'PLAYING' : 'IDLE',
      };
    });
  }, [pushEvent]);

  const handleFocusApp = useCallback(
    (appName: string) => {
      lastActivityRef.current = Date.now();
      setTelemetry((prev) => {
        if (prev.activeAppName === appName) return prev;
        if (prev.petActive) {
          pushEvent(
            'App Switch Observed',
            `Now monitoring active work in ${appName}.`,
            profileRef.current.mood
          );
        }
        return {
          ...prev,
          activeAppName: appName,
          appWorkSeconds: 0,
        };
      });
    },
    [pushEvent]
  );

  const handleTypingSample = useCallback((charCount: number, appName: string) => {
    const now = Date.now();
    lastActivityRef.current = now;
    for (let i = 0; i < Math.min(charCount, 6); i++) {
      keyTimestampsRef.current.push(now);
    }
    keyTimestampsRef.current = keyTimestampsRef.current.filter(
      (t) => now - t <= 10000
    );
    const wpm = (keyTimestampsRef.current.length / 5) * 6;
    setTelemetry((prev) => ({
      ...prev,
      activeAppName: appName,
      appWorkSeconds: prev.activeAppName === appName ? prev.appWorkSeconds : 0,
      typingWpm: Math.round(wpm),
      idleSeconds: 0,
      activeContext: wpm >= 75 ? 'RAPID_BURST' : 'STEADY_TYPING',
    }));
  }, []);

  const handleMouseMoveSample = useCallback((velocityPxPerSec: number) => {
    lastActivityRef.current = Date.now();
    setTelemetry((prev) => {
      const smoothed = prev.mouseVelocity * 0.72 + velocityPxPerSec * 0.28;
      const isScenarioLocked = Date.now() < scenarioUntilRef.current;
      return {
        ...prev,
        mouseVelocity: Math.min(2400, smoothed),
        idleSeconds: 0,
        activeContext: isScenarioLocked
          ? prev.activeContext
          : smoothed > 950
          ? 'ERRATIC_MOUSE'
          : prev.typingWpm >= 20
          ? prev.activeContext
          : 'IDLE',
      };
    });
  }, []);

  const handleClickSample = useCallback(() => {
    lastActivityRef.current = Date.now();
    setTelemetry((prev) => ({
      ...prev,
      idleSeconds: 0,
      clicksPerMin: Math.min(120, prev.clicksPerMin + 3),
    }));
  }, []);

  // 1-second adaptive observation & work-monitoring loop
  useEffect(() => {
    const interval = window.setInterval(() => {
      const now = Date.now();
      const idleSec = (now - lastActivityRef.current) / 1000;
      const isScenarioLocked = now < scenarioUntilRef.current;

      keyTimestampsRef.current = keyTimestampsRef.current.filter(
        (t) => now - t <= 10000
      );
      const liveWpm = (keyTimestampsRef.current.length / 5) * 6;

      let completedFocusNow = false;
      let completedReliefNow = false;
      let observedAppForTick: string | null = null;

      setTelemetry((prev) => {
        const nextWpm = isScenarioLocked ? prev.typingWpm : Math.round(liveWpm);
        const nextVel = isScenarioLocked
          ? prev.mouseVelocity
          : Math.round(prev.mouseVelocity * 0.65);
        const nextIdle = isScenarioLocked ? prev.idleSeconds : Math.round(idleSec);

        let focusRunning = prev.focusTimerRunning;
        let focusRemaining = prev.focusSecondsRemaining;
        if (focusRunning) {
          if (focusRemaining > 1) focusRemaining -= 1;
          else {
            focusRunning = false;
            focusRemaining = 25 * 60;
            completedFocusNow = true;
          }
        }

        let energyActive = prev.energyModeActive;
        let reliefRemaining = prev.reliefSecondsRemaining;
        if (energyActive) {
          if (reliefRemaining > 1) reliefRemaining -= 1;
          else {
            energyActive = false;
            reliefRemaining = 5 * 60;
            completedReliefNow = true;
          }
        }

        let nextContext: ActivityContext = prev.activeContext;
        if (!isScenarioLocked) {
          if (energyActive || now < ballWindowUntil) nextContext = 'PLAYING';
          else if (focusRunning) nextContext = 'FOCUS_SESSION';
          else if (nextWpm >= 75) nextContext = 'RAPID_BURST';
          else if (nextWpm >= 20) nextContext = 'STEADY_TYPING';
          else if (nextVel > 950) nextContext = 'ERRATIC_MOUSE';
          else if (nextIdle >= 18) nextContext = 'RESTING';
          else nextContext = 'IDLE';
        }

        // Increment observed app & laptop work duration when pet is active and user isn't long-idle
        const isActivelyWorking =
          prev.petActive && !energyActive && (nextIdle < 20 || focusRunning || nextWpm > 0);
        const nextAppSec = isActivelyWorking ? prev.appWorkSeconds + 1 : prev.appWorkSeconds;
        const nextLaptopSec = isActivelyWorking
          ? prev.laptopWorkSeconds + 1
          : prev.laptopWorkSeconds;

        if (isActivelyWorking) {
          observedAppForTick = prev.activeAppName;
        }

        const nextTelemetry: UserTelemetry = {
          ...prev,
          typingWpm: nextWpm,
          mouseVelocity: nextVel,
          idleSeconds: nextIdle,
          clicksPerMin: Math.max(0, prev.clicksPerMin - 1),
          activeContext: nextContext,
          focusTimerRunning: focusRunning,
          focusSecondsRemaining: focusRemaining,
          energyModeActive: energyActive,
          reliefSecondsRemaining: reliefRemaining,
          appWorkSeconds: nextAppSec,
          laptopWorkSeconds: nextLaptopSec,
          workStrain: 'RELAXED',
        };
        nextTelemetry.workStrain = computeWorkStrain(nextTelemetry);
        return nextTelemetry;
      });

      const currentTelemetry = telemetryRef.current;
      const currentProfile = profileRef.current;
      const hasActiveBall = now < ballWindowUntil;

      // Auto-offer a calming/love quote when working hard (throttled every 25s)
      if (
        currentTelemetry.petActive &&
        currentTelemetry.workStrain === 'WORKING_HARD' &&
        !currentTelemetry.energyModeActive &&
        now - lastAutoQuoteAtRef.current > 25000
      ) {
        lastAutoQuoteAtRef.current = now;
        const autoQuote = pickQuote(Math.random() > 0.5 ? 'calm' : 'love');
        setActiveQuote(autoQuote);
        soundEngine.playChirp();
        pushEvent(
          'Hard Work Detected',
          `Shared calming note while working in ${currentTelemetry.activeAppName}.`,
          'CONCERNED'
        );
      }

      const evalResult = evaluateAdaptiveState(
        currentProfile,
        currentTelemetry,
        hasActiveBall
      );

      if (completedFocusNow) {
        soundEngine.playFocusChime();
        showThought('Focus cycle complete!');
        pushEvent(
          'Focus Timer Complete',
          'Awarded +8 Focus Sync and logged completed focus session.',
          'ZEN'
        );
      } else if (completedReliefNow) {
        soundEngine.playFocusChime();
        setActiveQuote(null);
        showThought('5-min Energy break complete!');
        pushEvent(
          'Energy Break Complete',
          'Recharged energy and calm from 5-minute play break.',
          'ZEN'
        );
      } else if (evalResult.nextMood !== currentProfile.mood) {
        pushEvent(
          `${MOOD_META[evalResult.nextMood].label}`,
          evalResult.reason,
          evalResult.nextMood
        );
        if (evalResult.thought) {
          showThought(evalResult.thought);
        }
      }

      if (evalResult.newUnlock) {
        const unlockedMeta = ACCESSORY_META[evalResult.newUnlock];
        soundEngine.playFocusChime();
        showThought(`Unlocked ${unlockedMeta.label}!`);
        pushEvent(
          'Accessory Unlocked',
          `Earned ${unlockedMeta.label} from sustained habit consistency.`,
          evalResult.nextMood
        );
      }

      setProfile((prev) => {
        const ctxBucket: keyof PetProfile['habits']['secondsByContext'] =
          currentTelemetry.energyModeActive ||
          hasActiveBall ||
          currentTelemetry.activeContext === 'PLAYING'
            ? 'play'
            : currentTelemetry.activeContext === 'STEADY_TYPING' ||
              currentTelemetry.activeContext === 'RAPID_BURST' ||
              currentTelemetry.activeContext === 'FOCUS_SESSION' ||
              currentTelemetry.focusTimerRunning
            ? 'focus'
            : !currentTelemetry.petActive ||
              currentTelemetry.idleSeconds >= 15 ||
              currentTelemetry.activeContext === 'RESTING'
            ? 'rest'
            : 'explore';

        const nextUnlocked = evalResult.newUnlock
          ? [...prev.habits.unlockedAccessories, evalResult.newUnlock]
          : prev.habits.unlockedAccessories;

        const nextEquipped = evalResult.newUnlock
          ? [...prev.habits.equippedAccessories, evalResult.newUnlock]
          : prev.habits.equippedAccessories;

        const nextAppUsage = { ...prev.habits.appUsageSeconds };
        if (observedAppForTick) {
          nextAppUsage[observedAppForTick] = (nextAppUsage[observedAppForTick] || 0) + 1;
        }

        return {
          ...prev,
          mood: completedFocusNow ? 'ZEN' : evalResult.nextMood,
          moodReason: evalResult.reason,
          vitals: {
            energy: clamp(prev.vitals.energy + (evalResult.vitalsDelta.energy ?? 0)),
            bond: clamp(
              prev.vitals.bond +
                (evalResult.vitalsDelta.bond ?? 0) +
                (completedFocusNow ? 4 : 0)
            ),
            focusSync: clamp(
              prev.vitals.focusSync +
                (evalResult.vitalsDelta.focusSync ?? 0) +
                (completedFocusNow ? 8 : 0)
            ),
            calm: clamp(prev.vitals.calm + (evalResult.vitalsDelta.calm ?? 0)),
          },
          personality: {
            curiosity: clamp(
              prev.personality.curiosity + (evalResult.personalityDelta.curiosity ?? 0)
            ),
            calmness: clamp(
              prev.personality.calmness + (evalResult.personalityDelta.calmness ?? 0)
            ),
            playfulness: clamp(
              prev.personality.playfulness +
                (evalResult.personalityDelta.playfulness ?? 0)
            ),
            empathy: clamp(
              prev.personality.empathy + (evalResult.personalityDelta.empathy ?? 0)
            ),
          },
          habits: {
            ...prev.habits,
            focusSessionsCompleted:
              prev.habits.focusSessionsCompleted + (completedFocusNow ? 1 : 0),
            peakWpmRecorded: Math.max(
              prev.habits.peakWpmRecorded,
              currentTelemetry.typingWpm
            ),
            secondsByContext: {
              ...prev.habits.secondsByContext,
              [ctxBucket]: prev.habits.secondsByContext[ctxBucket] + 1,
            },
            secondsByPhase: {
              ...prev.habits.secondsByPhase,
              [currentTelemetry.circadian]:
                prev.habits.secondsByPhase[currentTelemetry.circadian] + 1,
            },
            appUsageSeconds: nextAppUsage,
            unlockedAccessories: nextUnlocked,
            equippedAccessories: nextEquipped,
          },
        };
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [ballWindowUntil, pushEvent, showThought]);

  const handlePetKomo = () => {
    lastActivityRef.current = Date.now();
    showThought('Purr~ thank you!');
    setProfile((prev) => ({
      ...prev,
      mood: 'AFFECTIONATE',
      moodReason: 'Enjoying gentle petting interaction',
      vitals: {
        ...prev.vitals,
        bond: clamp(prev.vitals.bond + 5),
        calm: clamp(prev.vitals.calm + 4),
      },
      personality: {
        ...prev.personality,
        empathy: clamp(prev.personality.empathy + 1.2),
      },
      habits: {
        ...prev.habits,
        totalInteractions: prev.habits.totalInteractions + 1,
        pettingCount: prev.habits.pettingCount + 1,
      },
    }));
    pushEvent('Petted Companion', '+5 Bond and +4 Calm from gentle care.', 'AFFECTIONATE');
  };

  const handleFeedSnack = (snack: SnackType) => {
    lastActivityRef.current = Date.now();
    const names: Record<SnackType, string> = {
      berry: 'Berry Tart',
      matcha: 'Matcha Cake',
      ramen: 'Mini Ramen',
      cookie: 'Honey Cookie',
    };
    showThought(`Yum! ${names[snack]}!`);
    setProfile((prev) => ({
      ...prev,
      mood: 'PLAYFUL',
      moodReason: `Heading over to eat ${names[snack]}`,
      vitals: {
        ...prev.vitals,
        energy: clamp(prev.vitals.energy + 12),
        bond: clamp(prev.vitals.bond + 3),
      },
      personality: {
        ...prev.personality,
        playfulness: clamp(prev.personality.playfulness + 0.8),
      },
      habits: {
        ...prev.habits,
        totalInteractions: prev.habits.totalInteractions + 1,
        snacksFed: prev.habits.snacksFed + 1,
      },
    }));
    pushEvent('Fed Snack', `Dropped ${names[snack]} (+12 Energy, +3 Bond).`, 'PLAYFUL');
  };

  const handleTossBall = () => {
    lastActivityRef.current = Date.now();
    setBallActiveSignal((s) => s + 1);
    setBallWindowUntil(Date.now() + 5500);
    showThought('Catching it!');
    setProfile((prev) => ({
      ...prev,
      mood: 'PLAYFUL',
      moodReason: 'Chasing desktop ball physics',
      habits: {
        ...prev.habits,
        totalInteractions: prev.habits.totalInteractions + 1,
        ballThrows: prev.habits.ballThrows + 1,
      },
    }));
    pushEvent('Tossed Ball', 'Entered playful ball chase.', 'PLAYFUL');
  };

  const handleTriggerScenario = (ctx: ActivityContext) => {
    lastActivityRef.current = Date.now();
    scenarioUntilRef.current = Date.now() + 8000;
    soundEngine.playChirp();

    if (ctx === 'STEADY_TYPING') {
      setTelemetry((prev) => ({
        ...prev,
        petActive: true,
        energyModeActive: false,
        typingWpm: 54,
        mouseVelocity: 40,
        idleSeconds: 0,
        activeContext: 'STEADY_TYPING',
        workStrain: 'STEADY',
      }));
      showThought('Steady focus right beside you.');
      pushEvent('Work Mode: Steady', 'Observing 54 WPM steady work flow.', 'FOCUSED');
    } else if (ctx === 'RAPID_BURST') {
      const q = pickQuote(Math.random() > 0.5 ? 'calm' : 'love');
      setActiveQuote(q);
      setTelemetry((prev) => ({
        ...prev,
        petActive: true,
        energyModeActive: false,
        typingWpm: 94,
        mouseVelocity: 240,
        idleSeconds: 0,
        appWorkSeconds: Math.max(prev.appWorkSeconds, 1500),
        activeContext: 'RAPID_BURST',
        workStrain: 'WORKING_HARD',
      }));
      pushEvent(
        'Work Mode: Hard Work',
        'Detected intense sprint; popped up calming mind & love message.',
        'CONCERNED'
      );
    } else if (ctx === 'RESTING') {
      setActiveQuote(null);
      setTelemetry((prev) => ({
        ...prev,
        petActive: true,
        energyModeActive: false,
        typingWpm: 0,
        mouseVelocity: 0,
        idleSeconds: 32,
        activeContext: 'RESTING',
        workStrain: 'RELAXED',
      }));
      showThought('Peaceful pause...');
      pushEvent('Work Mode: Rest', 'Detected quiet pause; restoring Energy and Calm.', 'SLEEPY');
    }
  };

  const handleToggleFocusTimer = () => {
    lastActivityRef.current = Date.now();
    setTelemetry((prev) => {
      const nextRunning = !prev.focusTimerRunning;
      if (nextRunning) {
        soundEngine.playChirp();
        showThought('Focus timer started!');
        pushEvent('Focus Timer', 'Observing timed focus session.', 'FOCUSED');
      }
      return {
        ...prev,
        petActive: nextRunning ? true : prev.petActive,
        focusTimerRunning: nextRunning,
        activeContext: nextRunning ? 'FOCUS_SESSION' : 'IDLE',
      };
    });
  };

  const handleResetFocusTimer = (seconds = 25 * 60) => {
    setTelemetry((prev) => ({
      ...prev,
      focusTimerRunning: false,
      focusSecondsRemaining: seconds,
    }));
  };

  const handleSetCircadian = (circadian: CircadianPhase) => {
    setTelemetry((prev) => ({ ...prev, circadian }));
    pushEvent(
      'Circadian Shift',
      `Workspace lighting set to ${circadian.toLowerCase()}.`,
      profile.mood
    );
  };

  const handleAmbientPlay = () => {
    setProfile((prev) => {
      const unlocked = prev.habits.unlockedAccessories.includes('headphones')
        ? prev.habits.unlockedAccessories
        : [...prev.habits.unlockedAccessories, 'headphones' as AccessoryId];
      const equipped = prev.habits.equippedAccessories.includes('headphones')
        ? prev.habits.equippedAccessories
        : [...prev.habits.equippedAccessories, 'headphones' as AccessoryId];
      return {
        ...prev,
        mood: 'ZEN',
        moodReason: 'Listening to soothing desktop chords',
        vitals: {
          ...prev.vitals,
          calm: clamp(prev.vitals.calm + 4),
        },
        habits: {
          ...prev.habits,
          totalInteractions: prev.habits.totalInteractions + 1,
          unlockedAccessories: unlocked,
          equippedAccessories: equipped,
        },
      };
    });
    showThought('Soothing harmonics~');
  };

  const handleUpdateName = (name: string) => {
    setProfile((prev) => ({ ...prev, name: name || 'Komo' }));
  };

  const handleChangeSpecies = (species: PetSpecies) => {
    soundEngine.playChirp();
    setProfile((prev) => ({ ...prev, species }));
    pushEvent('Form Updated', `Switched companion form to ${species}.`, profile.mood);
  };

  const handleToggleAccessory = (id: AccessoryId) => {
    setProfile((prev) => {
      const equipped = prev.habits.equippedAccessories;
      const next = equipped.includes(id)
        ? equipped.filter((a) => a !== id)
        : [...equipped, id];
      return {
        ...prev,
        habits: {
          ...prev.habits,
          equippedAccessories: next,
        },
      };
    });
  };

  const navTabs: Array<{ id: ActiveTab; label: string }> = [
    { id: 'stage', label: 'Desktop Stage' },
    { id: 'habits', label: 'Habit Memory' },
    { id: 'personality', label: 'Personality' },
    { id: 'python', label: 'Windows main.py' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F6F8] text-[#111827]">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-[1360px] mx-auto px-6 py-3.5 flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={() => setActiveTab('stage')}
            className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {profile.name}
          </button>

          <nav className="flex items-center gap-6 overflow-x-auto">
            {navTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 border-b-2 cursor-pointer ${
                    isActive
                      ? 'text-slate-900 border-slate-900'
                      : 'text-slate-500 border-transparent hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <div className="shrink-0">
            <button
              type="button"
              onClick={() => setSoundOn((s) => !s)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {soundOn ? (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Sound On</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>Muted</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1360px] w-full mx-auto px-6 py-6">
        {activeTab === 'stage' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8">
              <DesktopStage
                profile={profile}
                telemetry={telemetry}
                activeQuote={activeQuote}
                onTogglePetActive={handleTogglePetActive}
                onToggleEnergyMode={handleToggleEnergyMode}
                onRequestQuote={(k) => handleRequestQuote(k)}
                onDismissQuote={() => setActiveQuote(null)}
                onFocusApp={handleFocusApp}
                onTypingSample={handleTypingSample}
                onMouseMoveSample={handleMouseMoveSample}
                onClickSample={handleClickSample}
                onPetKomo={handlePetKomo}
                onFeedSnack={handleFeedSnack}
                onTossBall={handleTossBall}
                onToggleFocusTimer={handleToggleFocusTimer}
                onResetFocusTimer={handleResetFocusTimer}
                onSetCircadian={handleSetCircadian}
                onAmbientPlay={handleAmbientPlay}
                ballActiveSignal={ballActiveSignal}
              />
            </div>
            <div className="lg:col-span-4">
              <BehaviorDeck
                profile={profile}
                telemetry={telemetry}
                events={events}
                onTriggerScenario={handleTriggerScenario}
                onRequestQuote={(k) => handleRequestQuote(k)}
                onToggleEnergyMode={handleToggleEnergyMode}
              />
            </div>
          </div>
        )}

        {activeTab === 'habits' && <HabitMemoryView profile={profile} />}

        {activeTab === 'personality' && (
          <PersonalityView
            profile={profile}
            onUpdateName={handleUpdateName}
            onChangeSpecies={handleChangeSpecies}
            onToggleAccessory={handleToggleAccessory}
          />
        )}

        {activeTab === 'python' && <PythonExportView profile={profile} />}
      </main>
    </div>
  );
}
