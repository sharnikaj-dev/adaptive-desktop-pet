import React, { useEffect, useRef, useState } from 'react';
import {
  CircadianPhase,
  DesktopWindowState,
  FloatingParticle,
  PetAction,
  PetProfile,
  SnackType,
  ToyBall,
  TreatDrop,
  UserTelemetry,
} from '../types/pet';
import { PetQuote } from '../engine/quotes';
import { PetSprite } from './PetSprite';
import { soundEngine } from '../utils/sound';
import {
  CircleDot,
  Code2,
  Cookie,
  Heart,
  Moon,
  Music,
  Pause,
  Play,
  Power,
  RotateCcw,
  Sparkles,
  StickyNote,
  Sun,
  Sunrise,
  Sunset,
  Timer,
  X,
  Zap,
} from 'lucide-react';

interface DesktopStageProps {
  profile: PetProfile;
  telemetry: UserTelemetry;
  activeQuote: PetQuote | null;
  onTogglePetActive: () => void;
  onToggleEnergyMode: () => void;
  onRequestQuote: (kind: 'calm' | 'love') => void;
  onDismissQuote: () => void;
  onFocusApp: (appName: string) => void;
  onTypingSample: (charCount: number, appName: string) => void;
  onMouseMoveSample: (velocityPxPerSec: number) => void;
  onClickSample: () => void;
  onPetKomo: () => void;
  onFeedSnack: (snack: SnackType) => void;
  onTossBall: () => void;
  onToggleFocusTimer: () => void;
  onResetFocusTimer: (seconds?: number) => void;
  onSetCircadian: (phase: CircadianPhase) => void;
  onAmbientPlay: () => void;
  ballActiveSignal: number;
}

const INITIAL_WINDOWS: DesktopWindowState[] = [
  {
    id: 'code',
    title: 'Code Editor',
    x: 24,
    y: 22,
    width: 325,
    height: 210,
    open: true,
    zIndex: 3,
  },
  {
    id: 'notes',
    title: 'Scratchpad',
    x: 368,
    y: 26,
    width: 280,
    height: 195,
    open: true,
    zIndex: 2,
  },
  {
    id: 'timer',
    title: 'Focus Timer',
    x: 34,
    y: 256,
    width: 245,
    height: 175,
    open: false,
    zIndex: 4,
  },
  {
    id: 'ambient',
    title: 'Lo-Fi Chimes',
    x: 310,
    y: 256,
    width: 235,
    height: 175,
    open: false,
    zIndex: 5,
  },
];

const SNACK_LABELS: Record<SnackType, string> = {
  berry: 'Berry Tart',
  matcha: 'Matcha Cake',
  ramen: 'Mini Ramen',
  cookie: 'Honey Cookie',
};

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const DesktopStage: React.FC<DesktopStageProps> = ({
  profile,
  telemetry,
  activeQuote,
  onTogglePetActive,
  onToggleEnergyMode,
  onRequestQuote,
  onDismissQuote,
  onFocusApp,
  onTypingSample,
  onMouseMoveSample,
  onClickSample,
  onPetKomo,
  onFeedSnack,
  onTossBall,
  onToggleFocusTimer,
  onResetFocusTimer,
  onSetCircadian,
  onAmbientPlay,
  ballActiveSignal,
}) => {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [stageSize, setStageSize] = useState({ width: 900, height: 610 });
  const [windows, setWindows] = useState<DesktopWindowState[]>(INITIAL_WINDOWS);
  const [codeText, setCodeText] = useState(
    'def observe_work(app_name, duration):\n    if duration > 1800:\n        return "Take a 5-min Energy break!"\n    return "Steady flow"'
  );
  const [notesText, setNotesText] = useState(
    'Click Activate Pet in the bottom-right corner to wake Komo.\n\nType here or in Code Editor—Komo monitors your work duration and offers calming quotes or a 5-min Energy Mode.'
  );
  const [snackMenuOpen, setSnackMenuOpen] = useState(false);

  // Pet physics & action state
  const [petPos, setPetPos] = useState({ x: 740, y: 420 });
  const petVelRef = useRef({ vx: 1.5, vy: 0 });
  const petPosRef = useRef({ x: 740, y: 420 });
  const [facing, setFacing] = useState<'left' | 'right'>('left');
  const [isWalking, setIsWalking] = useState(false);
  const [petAction, setPetAction] = useState<PetAction>('sleep_corner');
  const actionUntilRef = useRef<number>(0);
  const [isDraggingPet, setIsDraggingPet] = useState(false);
  const [isPurring, setIsPurring] = useState(false);
  const [lookOffset, setLookOffset] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState<FloatingParticle[]>([]);
  const [treats, setTreats] = useState<TreatDrop[]>([]);
  const [ball, setBall] = useState<ToyBall>({
    active: false,
    x: 240,
    y: 120,
    vx: 4,
    vy: -2,
  });

  const dragPetState = useRef<{
    active: boolean;
    offsetX: number;
    offsetY: number;
    startX: number;
    startY: number;
    moved: boolean;
  }>({ active: false, offsetX: 0, offsetY: 0, startX: 0, startY: 0, moved: false });

  const dragWindowState = useRef<{
    id: DesktopWindowState['id'] | null;
    offsetX: number;
    offsetY: number;
  }>({ id: null, offsetX: 0, offsetY: 0 });

  const lastPointerRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const prevCharLenRef = useRef(notesText.length + codeText.length);
  const windowsRef = useRef(windows);
  windowsRef.current = windows;
  const treatsRef = useRef(treats);
  treatsRef.current = treats;
  const ballRef = useRef(ball);
  ballRef.current = ball;
  const profileRef = useRef(profile);
  profileRef.current = profile;
  const telemetryRef = useRef(telemetry);
  telemetryRef.current = telemetry;

  const spawnParticle = (kind: FloatingParticle['kind'], x: number, y: number) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setParticles((prev) => [...prev.slice(-8), { id, kind, x, y }]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== id));
    }, 1750);
  };

  const triggerCuteAction = (action: PetAction, durationMs = 1100) => {
    setPetAction(action);
    actionUntilRef.current = Date.now() + durationMs;
    if (action === 'roll' || action === 'hop') {
      petVelRef.current.vy = -5.5;
      soundEngine.playChirp();
      spawnParticle('spark', petPosRef.current.x + 56, petPosRef.current.y + 8);
    }
  };

  // Observe stage container size
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setStageSize({ width: rect.width, height: rect.height });
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Snap to bottom-right corner when resting/standby, hop out when activated
  useEffect(() => {
    const cornerX = Math.max(24, stageSize.width - 134);
    const cornerY = Math.max(80, stageSize.height - 180);
    if (!telemetry.petActive) {
      petPosRef.current = { x: cornerX, y: cornerY };
      petVelRef.current = { vx: 0, vy: 0 };
      setPetPos({ x: cornerX, y: cornerY });
      setFacing('left');
      setIsWalking(false);
      setPetAction('sleep_corner');
    } else {
      setPetAction('hop');
      actionUntilRef.current = Date.now() + 900;
      petVelRef.current = { vx: -2.2, vy: -6.5 };
      spawnParticle('spark', petPosRef.current.x + 56, petPosRef.current.y + 10);
    }
  }, [telemetry.petActive, stageSize.width, stageSize.height]);

  // Trigger ball toss when parent increments signal
  useEffect(() => {
    if (ballActiveSignal === 0) return;
    const startX = Math.max(80, Math.min(stageSize.width - 100, petPosRef.current.x - 90));
    const newBall: ToyBall = {
      active: true,
      x: startX,
      y: 90,
      vx: (Math.random() > 0.5 ? 1 : -1) * (4.5 + Math.random() * 2.5),
      vy: -3.5,
    };
    ballRef.current = newBall;
    setBall(newBall);
    soundEngine.playBounce();
  }, [ballActiveSignal, stageSize.width]);

  // Ambient sleepy Zzz particles when resting in corner or sleepy
  useEffect(() => {
    if (telemetry.petActive && profile.mood !== 'SLEEPY') return;
    const interval = setInterval(() => {
      spawnParticle('zzz', petPosRef.current.x + 68, petPosRef.current.y + 8);
    }, 2400);
    return () => clearInterval(interval);
  }, [telemetry.petActive, profile.mood]);

  // Physics, screen roaming & cute action loop (~30fps)
  useEffect(() => {
    const petW = 112;
    const petH = 112;
    const dockHeight = 68;

    const timer = setInterval(() => {
      const stageW = stageSize.width;
      const floorY = stageSize.height - dockHeight - petH;
      const now = Date.now();

      // 1. Update bouncy toy ball if active
      if (ballRef.current.active) {
        let { x, y, vx, vy } = ballRef.current;
        vy += 0.42;
        x += vx;
        y += vy;
        const ballFloor = stageSize.height - dockHeight - 24;
        if (x <= 16) {
          x = 16;
          vx = Math.abs(vx) * 0.88;
          soundEngine.playBounce();
        } else if (x >= stageW - 36) {
          x = stageW - 36;
          vx = -Math.abs(vx) * 0.88;
          soundEngine.playBounce();
        }
        if (y >= ballFloor) {
          y = ballFloor;
          vy = -Math.abs(vy) * 0.76;
          vx *= 0.96;
          if (Math.abs(vy) > 1.8) soundEngine.playBounce();
        }
        if (Math.abs(vx) < 0.25 && Math.abs(vy) < 0.8 && y >= ballFloor - 2) {
          const stopped = { ...ballRef.current, active: false };
          ballRef.current = stopped;
          setBall(stopped);
        } else {
          const updated = { active: true, x, y, vx, vy };
          ballRef.current = updated;
          setBall(updated);
        }
      }

      if (dragPetState.current.active) return;

      // Stay tucked in corner when not activated
      if (!telemetryRef.current.petActive) {
        const cornerX = Math.max(24, stageW - 134);
        const cornerY = Math.max(80, floorY);
        petPosRef.current = { x: cornerX, y: cornerY };
        setPetPos({ x: cornerX, y: cornerY });
        setIsWalking(false);
        setPetAction('sleep_corner');
        return;
      }

      let { x, y } = petPosRef.current;
      let { vx, vy } = petVelRef.current;
      const mood = profileRef.current.mood;
      const energyMode = telemetryRef.current.energyModeActive;

      // Gravity
      vy += 0.58;
      y += vy;

      // Window-top landing
      let landed = false;
      const footX = x + petW / 2;
      const prevFootY = y - vy + petH;
      const currFootY = y + petH;

      if (vy >= 0) {
        for (const win of windowsRef.current) {
          if (!win.open) continue;
          const surfaceY = win.y + 42;
          if (
            footX >= win.x + 18 &&
            footX <= win.x + win.width - 18 &&
            prevFootY <= surfaceY + 12 &&
            currFootY >= surfaceY
          ) {
            y = surfaceY - petH + 6;
            vy = 0;
            landed = true;
            break;
          }
        }
      }

      if (!landed && y >= floorY) {
        y = floorY;
        vy = 0;
        landed = true;
      }

      let walkingNow = false;
      const actionActive = now < actionUntilRef.current;

      if (ballRef.current.active) {
        const dx = ballRef.current.x - (x + petW / 2);
        if (Math.abs(dx) > 18) {
          const speed = 4.1;
          vx = dx > 0 ? speed : -speed;
          x += vx;
          walkingNow = true;
          setFacing(vx >= 0 ? 'right' : 'left');
        } else if (landed && Math.abs(ballRef.current.y - (y + petH - 18)) < 36) {
          const kicked = {
            ...ballRef.current,
            vx: (Math.random() > 0.5 ? 1 : -1) * (5.2 + Math.random() * 2.5),
            vy: -7.8,
          };
          ballRef.current = kicked;
          setBall(kicked);
          vy = -5.8;
          setPetAction('roll');
          actionUntilRef.current = now + 750;
          soundEngine.playChirp();
          spawnParticle('spark', x + 54, y + 12);
        }
      } else if (treatsRef.current.length > 0) {
        const target = treatsRef.current[0];
        const dx = target.x - (x + petW / 2);
        if (Math.abs(dx) > 22) {
          const speed = 2.8;
          vx = dx > 0 ? speed : -speed;
          x += vx;
          walkingNow = true;
          setFacing(vx >= 0 ? 'right' : 'left');
        } else {
          soundEngine.playCrunch();
          setPetAction('eat');
          actionUntilRef.current = now + 800;
          spawnParticle('heart', x + 52, y + 8);
          setTreats((prev) => prev.filter((t) => t.id !== target.id));
        }
      } else if (mood === 'SLEEPY' || mood === 'ZEN') {
        walkingNow = false;
        if (!actionActive) setPetAction('idle');
      } else {
        // Active screen-wide roaming with cute rolls, hops, and waves
        const moveChance = energyMode ? 0.032 : 0.018;
        if (Math.random() < moveChance) {
          const speed = energyMode ? 2.4 : 1.5;
          vx = vx === 0 ? (Math.random() > 0.5 ? speed : -speed) : 0;
        }
        if (Math.abs(vx) > 0.1) {
          x += vx;
          walkingNow = true;
          setFacing(vx >= 0 ? 'right' : 'left');
          if (!actionActive) setPetAction('walk');
        } else if (!actionActive) {
          setPetAction('idle');
        }

        // Autonomous cute pet actions: roll, hop, or paw wave
        if (!actionActive && landed) {
          const rollRoll = Math.random();
          if (rollRoll < (energyMode ? 0.016 : 0.006)) {
            setPetAction('roll');
            actionUntilRef.current = now + 800;
            vy = -5.0;
          } else if (rollRoll < (energyMode ? 0.03 : 0.011)) {
            setPetAction('hop');
            actionUntilRef.current = now + 700;
            vy = -6.8;
          } else if (rollRoll < 0.015 && !walkingNow) {
            setPetAction('wave');
            actionUntilRef.current = now + 1100;
          }
        }
      }

      if (x < 12) {
        x = 12;
        vx = Math.abs(vx) || 1.5;
        setFacing('right');
      } else if (x > stageW - petW - 12) {
        x = stageW - petW - 12;
        vx = -(Math.abs(vx) || 1.5);
        setFacing('left');
      }

      petPosRef.current = { x, y };
      petVelRef.current = { vx, vy };
      setPetPos({ x, y });
      setIsWalking(walkingNow);
    }, 33);

    return () => clearInterval(timer);
  }, [stageSize.height, stageSize.width]);

  const handleStagePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const relX = e.clientX - rect.left;
    const relY = e.clientY - rect.top;

    const now = performance.now();
    if (lastPointerRef.current) {
      const dt = Math.max(0.016, (now - lastPointerRef.current.t) / 1000);
      const dist = Math.hypot(
        relX - lastPointerRef.current.x,
        relY - lastPointerRef.current.y
      );
      onMouseMoveSample(dist / dt);
    }
    lastPointerRef.current = { x: relX, y: relY, t: now };

    const petCenterX = petPosRef.current.x + 56;
    const petCenterY = petPosRef.current.y + 56;
    setLookOffset({
      x: Math.max(-3.5, Math.min(3.5, (relX - petCenterX) / 45)),
      y: Math.max(-2.5, Math.min(2.5, (relY - petCenterY) / 45)),
    });

    if (dragWindowState.current.id) {
      const id = dragWindowState.current.id;
      setWindows((prev) =>
        prev.map((w) => {
          if (w.id !== id) return w;
          const nextX = Math.max(
            8,
            Math.min(rect.width - w.width - 8, relX - dragWindowState.current.offsetX)
          );
          const nextY = Math.max(
            8,
            Math.min(rect.height - 115 - w.height, relY - dragWindowState.current.offsetY)
          );
          return { ...w, x: nextX, y: nextY };
        })
      );
    }

    if (dragPetState.current.active && telemetryRef.current.petActive) {
      const movedDist = Math.hypot(
        relX - dragPetState.current.startX,
        relY - dragPetState.current.startY
      );
      if (movedDist > 5) dragPetState.current.moved = true;
      const nx = Math.max(
        8,
        Math.min(rect.width - 120, relX - dragPetState.current.offsetX)
      );
      const ny = Math.max(
        8,
        Math.min(rect.height - 170, relY - dragPetState.current.offsetY)
      );
      petPosRef.current = { x: nx, y: ny };
      petVelRef.current = { vx: 0, vy: 0 };
      setPetPos({ x: nx, y: ny });
    }
  };

  const handleStagePointerUp = () => {
    if (dragPetState.current.active && !dragPetState.current.moved) {
      if (!telemetry.petActive) {
        onTogglePetActive();
      } else {
        setIsPurring(true);
        soundEngine.playPurr();
        spawnParticle('heart', petPosRef.current.x + 56, petPosRef.current.y + 10);
        onPetKomo();
        setTimeout(() => setIsPurring(false), 650);
      }
    }
    dragPetState.current.active = false;
    setIsDraggingPet(false);
    dragWindowState.current.id = null;
  };

  const bringWindowToFront = (id: DesktopWindowState['id'], appTitle: string) => {
    onFocusApp(appTitle);
    setWindows((prev) => {
      const maxZ = Math.max(...prev.map((w) => w.zIndex), 2);
      return prev.map((w) => (w.id === id ? { ...w, zIndex: maxZ + 1 } : w));
    });
  };

  const toggleWindowOpen = (id: DesktopWindowState['id'], appTitle: string) => {
    onFocusApp(appTitle);
    setWindows((prev) => {
      const maxZ = Math.max(...prev.map((w) => w.zIndex), 2);
      return prev.map((w) =>
        w.id === id ? { ...w, open: !w.open, zIndex: maxZ + 1 } : w
      );
    });
  };

  const handleTextChange = (
    newValue: string,
    appName: string,
    setter: (v: string) => void
  ) => {
    const totalLen =
      (appName === 'Code Editor' ? newValue.length + notesText.length : codeText.length + newValue.length);
    const diff = Math.abs(totalLen - prevCharLenRef.current);
    prevCharLenRef.current = totalLen;
    setter(newValue);
    onTypingSample(Math.max(1, diff), appName);
  };

  const handleDropTreat = (snack: SnackType) => {
    const dropX = Math.max(
      60,
      Math.min(
        stageSize.width - 80,
        petPosRef.current.x + (petPosRef.current.x > stageSize.width / 2 ? -100 : 100)
      )
    );
    const dropY = stageSize.height - 96;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setTreats((prev) => [...prev, { id, snack, x: dropX, y: dropY }]);
    setSnackMenuOpen(false);
    onFeedSnack(snack);
  };

  const stageTheme: Record<
    CircadianPhase,
    { bg: string; grid: string; bar: string }
  > = {
    MORNING: {
      bg: 'bg-[#F8FAFC]',
      grid: 'radial-gradient(#CBD5E1 1px, transparent 1px)',
      bar: 'bg-white/90 border-slate-200 text-slate-700',
    },
    AFTERNOON: {
      bg: 'bg-[#F4F6F9]',
      grid: 'radial-gradient(#CBD5E1 1px, transparent 1px)',
      bar: 'bg-white/90 border-slate-200 text-slate-700',
    },
    EVENING: {
      bg: 'bg-[#EEF1F6]',
      grid: 'radial-gradient(#94A3B8 1px, transparent 1px)',
      bar: 'bg-white/90 border-slate-200 text-slate-800',
    },
    NIGHT: {
      bg: 'bg-[#0F172A]',
      grid: 'radial-gradient(#334155 1px, transparent 1px)',
      bar: 'bg-slate-900/90 border-slate-700 text-slate-200',
    },
  };

  const theme = stageTheme[telemetry.circadian];
  const mins = String(Math.floor(telemetry.focusSecondsRemaining / 60)).padStart(2, '0');
  const secs = String(telemetry.focusSecondsRemaining % 60).padStart(2, '0');

  const phaseButtons: Array<{
    phase: CircadianPhase;
    label: string;
    icon: React.ReactNode;
  }> = [
    { phase: 'MORNING', label: 'Morning', icon: <Sunrise className="w-3.5 h-3.5" /> },
    { phase: 'AFTERNOON', label: 'Afternoon', icon: <Sun className="w-3.5 h-3.5" /> },
    { phase: 'EVENING', label: 'Evening', icon: <Sunset className="w-3.5 h-3.5" /> },
    { phase: 'NIGHT', label: 'Night', icon: <Moon className="w-3.5 h-3.5" /> },
  ];

  // Clamp quote card horizontal position so it never clips off edges
  const quoteLeft = Math.max(
    16,
    Math.min(stageSize.width - 300, petPos.x - 86)
  );
  const quoteTop = Math.max(54, petPos.y - 118);

  return (
    <div
      ref={stageRef}
      onPointerMove={handleStagePointerMove}
      onPointerUp={handleStagePointerUp}
      onPointerLeave={handleStagePointerUp}
      onClick={() => onClickSample()}
      style={{
        backgroundImage: theme.grid,
        backgroundSize: '22px 22px',
      }}
      className={`relative w-full h-[610px] rounded-xl border border-slate-200 overflow-hidden select-none transition-colors duration-500 ${theme.bg}`}
    >
      {/* Top Stage Utility Bar */}
      <div
        className={`relative z-20 flex items-center justify-between px-4 py-2.5 border-b backdrop-blur-sm ${theme.bar}`}
      >
        <div className="flex items-center gap-2 text-xs font-medium min-w-0">
          <span className="truncate">
            {telemetry.petActive
              ? `Observing: ${telemetry.activeAppName} (${formatDuration(telemetry.appWorkSeconds)}) · Laptop: ${formatDuration(telemetry.laptopWorkSeconds)}`
              : 'Corner Standby — Click Activate Pet to wake Komo'}
          </span>
        </div>

        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-200/60 shrink-0">
          {phaseButtons.map((pb) => {
            const active = telemetry.circadian === pb.phase;
            return (
              <button
                key={pb.phase}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSetCircadian(pb.phase);
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-white text-slate-900 shadow-xs'
                    : telemetry.circadian === 'NIGHT'
                    ? 'text-slate-300 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {pb.icon}
                <span className="hidden sm:inline">{pb.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5-Minute Energy Relief Mode Banner inside stage */}
      {telemetry.energyModeActive && (
        <div className="relative z-20 mx-auto mt-2.5 w-fit flex items-center gap-3 px-4 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium shadow-xs">
          <Zap className="w-3.5 h-3.5 text-amber-600" />
          <span className="font-mono tabular-nums">
            5-Min Energy Relief · {formatDuration(telemetry.reliefSecondsRemaining)}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleEnergyMode();
            }}
            className="text-amber-700 hover:text-amber-950 underline cursor-pointer"
          >
            End Break
          </button>
        </div>
      )}

      {/* Draggable Desktop Windows */}
      {windows.map((win) => {
        if (!win.open) return null;
        const isCurrentApp = telemetry.activeAppName === win.title;
        return (
          <div
            key={win.id}
            style={{
              left: win.x,
              top: win.y + 42,
              width: win.width,
              height: win.height,
              zIndex: win.zIndex,
            }}
            onPointerDown={() => bringWindowToFront(win.id, win.title)}
            className={`absolute bg-white/95 backdrop-blur-sm border rounded-xl shadow-[0_8px_24px_rgba(15,23,42,0.08)] flex flex-col overflow-hidden ${
              isCurrentApp ? 'border-slate-400' : 'border-slate-200'
            }`}
          >
            <div
              onPointerDown={(e) => {
                e.stopPropagation();
                bringWindowToFront(win.id, win.title);
                const rect = stageRef.current?.getBoundingClientRect();
                if (!rect) return;
                dragWindowState.current = {
                  id: win.id,
                  offsetX: e.clientX - rect.left - win.x,
                  offsetY: e.clientY - rect.top - win.y,
                };
              }}
              className="flex items-center justify-between px-3.5 py-2 bg-slate-50 border-b border-slate-200 cursor-grab active:cursor-grabbing"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                <span>{win.title}</span>
                {(win.id === 'notes' || win.id === 'code') && (
                  <span className="font-mono tabular-nums font-normal text-slate-500">
                    · {Math.round(telemetry.typingWpm)} WPM
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWindowOpen(win.id, win.title);
                }}
                className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                aria-label={`Close ${win.title}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {win.id === 'code' && (
              <textarea
                value={codeText}
                onFocus={() => onFocusApp('Code Editor')}
                onChange={(e) => handleTextChange(e.target.value, 'Code Editor', setCodeText)}
                onClick={(e) => e.stopPropagation()}
                spellCheck={false}
                className="flex-1 w-full p-3.5 text-xs leading-relaxed text-slate-800 bg-slate-50/40 resize-none focus:outline-none font-mono"
              />
            )}

            {win.id === 'notes' && (
              <textarea
                value={notesText}
                onFocus={() => onFocusApp('Scratchpad')}
                onChange={(e) => handleTextChange(e.target.value, 'Scratchpad', setNotesText)}
                onClick={(e) => e.stopPropagation()}
                placeholder="Start typing here..."
                className="flex-1 w-full p-3.5 text-xs leading-relaxed text-slate-700 bg-transparent resize-none focus:outline-none font-body"
              />
            )}

            {win.id === 'timer' && (
              <div className="flex-1 p-3.5 flex flex-col items-center justify-center">
                <div className="text-2xl font-mono font-semibold tabular-nums text-slate-900">
                  {mins}:{secs}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {telemetry.focusTimerRunning ? 'Focus session running' : 'Work timer'}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onFocusApp('Focus Timer');
                      onToggleFocusTimer();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    {telemetry.focusTimerRunning ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>Start</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onResetFocusTimer(25 * 60);
                    }}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                    aria-label="Reset timer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {win.id === 'ambient' && (
              <div className="flex-1 p-3.5 flex flex-col justify-between">
                <p className="text-xs text-slate-500">
                  Calming chords to ease intense screen work.
                </p>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {['Cmaj7', 'Am7', 'Fmaj7', 'G7'].map((chord, idx) => (
                    <button
                      key={chord}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onFocusApp('Lo-Fi Chimes');
                        soundEngine.playAmbientChord(idx);
                        spawnParticle('note', petPosRef.current.x + 62, petPosRef.current.y + 8);
                        onAmbientPlay();
                      }}
                      className="py-2 px-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      {chord}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Dropped Treats */}
      {treats.map((treat) => (
        <div
          key={treat.id}
          style={{ left: treat.x - 14, top: treat.y }}
          className="absolute z-10 flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-100 border border-amber-300 text-amber-900 text-xs font-medium shadow-xs"
        >
          <Cookie className="w-3.5 h-3.5 text-amber-700" />
          <span>{SNACK_LABELS[treat.snack].split(' ')[0]}</span>
        </div>
      ))}

      {/* Bouncy Toy Ball */}
      {ball.active && (
        <div
          style={{
            transform: `translate3d(${ball.x}px, ${ball.y}px, 0)`,
          }}
          className="absolute top-0 left-0 z-20 w-6 h-6 rounded-full bg-amber-500 border-2 border-slate-900 shadow-sm pointer-events-none"
        />
      )}

      {/* Floating Reaction Particles */}
      {particles.map((pt) => (
        <div
          key={pt.id}
          style={{ left: pt.x, top: pt.y }}
          className="absolute z-30 pointer-events-none animate-float-particle text-xs font-semibold"
        >
          {pt.kind === 'heart' && <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />}
          {pt.kind === 'zzz' && <span className="font-mono text-slate-500">Zzz</span>}
          {pt.kind === 'spark' && <span className="text-amber-500 font-bold">✦</span>}
          {pt.kind === 'note' && <Music className="w-4 h-4 text-indigo-600" />}
        </div>
      ))}

      {/* Calming Mind / Love Quote Floating Card near Pet */}
      {activeQuote && (
        <div
          style={{ left: quoteLeft, top: quoteTop }}
          onClick={(e) => e.stopPropagation()}
          className="absolute z-40 w-72 bg-white border border-slate-200 rounded-xl p-3.5 shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
        >
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 mb-1">
            <span>
              {activeQuote.category === 'love'
                ? 'Warm Love Note'
                : activeQuote.category === 'energy'
                ? 'Energy Relief'
                : 'Calming Mind'}
            </span>
            <button
              type="button"
              onClick={onDismissQuote}
              className="text-slate-400 hover:text-slate-700 cursor-pointer"
              aria-label="Dismiss quote"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-slate-800 leading-relaxed">{activeQuote.text}</p>
          <div className="mt-2.5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onRequestQuote(activeQuote.category === 'love' ? 'calm' : 'love')}
              className="text-[11px] font-medium text-slate-700 hover:text-slate-900 underline cursor-pointer"
            >
              Another Quote
            </button>
            {!telemetry.energyModeActive && (
              <button
                type="button"
                onClick={onToggleEnergyMode}
                className="text-[11px] font-medium text-amber-700 hover:text-amber-900 underline cursor-pointer"
              >
                5-Min Energy Break
              </button>
            )}
          </div>
        </div>
      )}

      {/* Corner Standby Prompt Badge */}
      {!telemetry.petActive && (
        <div
          style={{
            right: 26,
            bottom: 185,
          }}
          className="absolute z-30"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePetActive();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium shadow-md hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Power className="w-3.5 h-3.5 text-emerald-400" />
            <span>Activate {profile.name}</span>
          </button>
        </div>
      )}

      {/* The Adaptive Desktop Pet Entity */}
      <div
        style={{
          transform: `translate3d(${petPos.x}px, ${petPos.y}px, 0)`,
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          const rect = stageRef.current?.getBoundingClientRect();
          if (!rect) return;
          const relX = e.clientX - rect.left;
          const relY = e.clientY - rect.top;
          dragPetState.current = {
            active: true,
            offsetX: relX - petPosRef.current.x,
            offsetY: relY - petPosRef.current.y,
            startX: relX,
            startY: relY,
            moved: false,
          };
          if (telemetry.petActive) setIsDraggingPet(true);
        }}
        className="absolute top-0 left-0 z-30 cursor-grab active:cursor-grabbing"
      >
        {profile.thoughtBubble && !activeQuote && (
          <div className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 rounded-lg bg-white border border-slate-200 shadow-sm text-xs font-medium text-slate-800 pointer-events-none">
            {profile.thoughtBubble}
          </div>
        )}

        <PetSprite
          species={profile.species}
          mood={profile.mood}
          action={petAction}
          facing={facing}
          isWalking={isWalking}
          isDragging={isDraggingPet}
          isPurring={isPurring}
          lookOffset={lookOffset}
          equippedAccessories={profile.habits.equippedAccessories}
          size={112}
        />
      </div>

      {/* Bottom Desktop Dock */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 px-2 py-1.5 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl shadow-[0_6px_20px_rgba(15,23,42,0.08)] max-w-[96%] overflow-x-auto">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onTogglePetActive();
          }}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            telemetry.petActive
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-slate-900 text-white hover:bg-slate-800'
          }`}
        >
          <Power className="w-3.5 h-3.5" />
          <span>{telemetry.petActive ? 'Corner Rest' : 'Activate'}</span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (!telemetry.petActive) onTogglePetActive();
            triggerCuteAction('roll', 900);
          }}
          className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-sky-600" />
          <span>Roll</span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (!telemetry.petActive) onTogglePetActive();
            setIsPurring(true);
            soundEngine.playPurr();
            spawnParticle('heart', petPosRef.current.x + 56, petPosRef.current.y + 8);
            onPetKomo();
            setTimeout(() => setIsPurring(false), 650);
          }}
          className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Heart className="w-3.5 h-3.5 text-rose-500" />
          <span>Pet</span>
        </button>

        {/* Feed Snack Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSnackMenuOpen((v) => !v);
            }}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Cookie className="w-3.5 h-3.5 text-amber-600" />
            <span>Feed</span>
          </button>

          {snackMenuOpen && (
            <div className="absolute bottom-12 left-0 w-40 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 flex flex-col gap-0.5 z-50">
              {(Object.keys(SNACK_LABELS) as SnackType[]).map((snack) => (
                <button
                  key={snack}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!telemetry.petActive) onTogglePetActive();
                    handleDropTreat(snack);
                  }}
                  className="text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  {SNACK_LABELS[snack]}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (!telemetry.petActive) onTogglePetActive();
            onTossBall();
          }}
          className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <CircleDot className="w-3.5 h-3.5 text-indigo-600" />
          <span>Ball</span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleEnergyMode();
          }}
          className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            telemetry.energyModeActive
              ? 'bg-amber-500 text-white'
              : 'text-slate-700 hover:bg-amber-50 hover:text-amber-800'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>5m Energy</span>
        </button>

        <div className="w-px h-5 bg-slate-200 mx-0.5 shrink-0" aria-hidden="true" />

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleWindowOpen('code', 'Code Editor');
          }}
          className={`flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            windows.find((w) => w.id === 'code')?.open
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
          title="Toggle Code Editor"
        >
          <Code2 className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleWindowOpen('notes', 'Scratchpad');
          }}
          className={`flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            windows.find((w) => w.id === 'notes')?.open
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
          title="Toggle Scratchpad"
        >
          <StickyNote className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleWindowOpen('timer', 'Focus Timer');
          }}
          className={`flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            windows.find((w) => w.id === 'timer')?.open
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
          title="Toggle Focus Timer"
        >
          <Timer className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleWindowOpen('ambient', 'Lo-Fi Chimes');
          }}
          className={`flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            windows.find((w) => w.id === 'ambient')?.open
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
          title="Toggle Lo-Fi Chimes"
        >
          <Music className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
