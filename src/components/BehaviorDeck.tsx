import React from 'react';
import {
  ActivityContext,
  BehaviorEvent,
  PetProfile,
  UserTelemetry,
} from '../types/pet';
import { getVitalStatusLabel, MOOD_META } from '../engine/behaviorEngine';
import {
  Coffee,
  Flame,
  HeartHandshake,
  Keyboard,
  Sparkles,
  Zap,
} from 'lucide-react';

interface BehaviorDeckProps {
  profile: PetProfile;
  telemetry: UserTelemetry;
  events: BehaviorEvent[];
  onTriggerScenario: (context: ActivityContext) => void;
  onRequestQuote: (kind: 'calm' | 'love') => void;
  onToggleEnergyMode: () => void;
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
}

export const BehaviorDeck: React.FC<BehaviorDeckProps> = ({
  profile,
  telemetry,
  events,
  onTriggerScenario,
  onRequestQuote,
  onToggleEnergyMode,
}) => {
  const moodInfo = MOOD_META[profile.mood];

  const vitalsList: Array<{
    key: keyof PetProfile['vitals'];
    label: string;
    value: number;
    barColor: string;
  }> = [
    {
      key: 'energy',
      label: 'Energy',
      value: profile.vitals.energy,
      barColor: 'bg-amber-500',
    },
    {
      key: 'bond',
      label: 'Bond',
      value: profile.vitals.bond,
      barColor: 'bg-emerald-500',
    },
    {
      key: 'focusSync',
      label: 'Focus Sync',
      value: profile.vitals.focusSync,
      barColor: 'bg-indigo-600',
    },
    {
      key: 'calm',
      label: 'Calm',
      value: profile.vitals.calm,
      barColor: 'bg-sky-600',
    },
  ];

  const strainLabel =
    telemetry.workStrain === 'WORKING_HARD'
      ? 'Working Hard'
      : telemetry.workStrain === 'STEADY'
      ? 'Steady Flow'
      : 'Relaxed';

  return (
    <aside className="flex flex-col gap-5">
      {/* Emotional & Work Observation Card */}
      <section className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-slate-500">
              {telemetry.petActive ? 'Active & Observing' : 'Corner Standby'}
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <h2 className="text-xl font-semibold text-slate-900 tracking-tight">
                {moodInfo.label}
              </h2>
              <span className="text-xs text-slate-500">· {strainLabel}</span>
            </div>
          </div>
          <span
            className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap shrink-0 ${moodInfo.bgTint} ${moodInfo.textColor}`}
          >
            {profile.mood}
          </span>
        </div>

        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          {profile.moodReason}
        </p>

        {/* Live App & Laptop Work Observer */}
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="text-[11px] text-slate-500">Active App</div>
            <div className="mt-0.5 text-xs font-semibold text-slate-900 truncate">
              {telemetry.activeAppName}
            </div>
            <div className="mt-0.5 text-xs font-mono tabular-nums text-slate-600">
              {formatDuration(telemetry.appWorkSeconds)}
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="text-[11px] text-slate-500">Laptop Session</div>
            <div className="mt-0.5 text-xs font-semibold font-mono tabular-nums text-slate-900">
              {formatDuration(telemetry.laptopWorkSeconds)}
            </div>
            <div className="mt-0.5 text-xs font-mono tabular-nums text-slate-600">
              {Math.round(telemetry.typingWpm)} WPM
            </div>
          </div>
        </div>

        {/* 4 Vitals */}
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
          {vitalsList.map((item) => {
            const rounded = Math.round(item.value);
            const statusText = getVitalStatusLabel(item.key, rounded);
            return (
              <div key={item.key}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700">{item.label}</span>
                  <span className="font-mono tabular-nums text-slate-600">
                    {rounded}% · {statusText}
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.barColor} rounded-full transition-all duration-300`}
                    style={{ width: `${rounded}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Mind Care, Love Quotes & Energy Mode */}
      <section className="bg-white border border-slate-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-900">
          Mood Care & Work Relief
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          When you work hard, {profile.name} reads your strain and offers calming thoughts, love quotes, or a 5-minute Energy break.
        </p>

        <div className="mt-3.5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onRequestQuote('calm')}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-100 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Calm My Mind</span>
          </button>
          <button
            type="button"
            onClick={() => onRequestQuote('love')}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Love Quote</span>
          </button>
          <button
            type="button"
            onClick={onToggleEnergyMode}
            className={`col-span-2 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              telemetry.energyModeActive
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>
              {telemetry.energyModeActive
                ? 'End 5-Min Energy Relief Mode'
                : 'Start 5-Min Energy Relief Mode'}
            </span>
          </button>
        </div>

        <div className="mt-4 pt-3.5 border-t border-slate-100">
          <div className="text-xs font-medium text-slate-600 mb-2">
            Simulate Work Activity
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => onTriggerScenario('STEADY_TYPING')}
              className="flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Steady</span>
            </button>
            <button
              type="button"
              onClick={() => onTriggerScenario('RAPID_BURST')}
              className="flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <Flame className="w-3.5 h-3.5 text-rose-600" />
              <span>Work Hard</span>
            </button>
            <button
              type="button"
              onClick={() => onTriggerScenario('RESTING')}
              className="flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>Rest</span>
            </button>
          </div>
        </div>
      </section>

      {/* Behavior Adaptation Log */}
      <section className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-900">
            Observation Log
          </h3>
          <span className="text-xs text-slate-500 tabular-nums">
            {events.length} recent
          </span>
        </div>

        <ul className="divide-y divide-slate-100 max-h-44 overflow-y-auto pr-1">
          {events.slice(0, 8).map((ev) => (
            <li key={ev.id} className="py-2 first:pt-0 last:pb-0">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-medium text-slate-800">{ev.trigger}</span>
                <span className="font-mono tabular-nums">{ev.timestamp}</span>
              </div>
              <p className="mt-0.5 text-xs text-slate-600">{ev.adaptation}</p>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
};
