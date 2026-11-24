import React from 'react';
import { CircadianPhase, PetProfile } from '../types/pet';

interface HabitMemoryViewProps {
  profile: PetProfile;
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

export const HabitMemoryView: React.FC<HabitMemoryViewProps> = ({ profile }) => {
  const { habits } = profile;
  const totalCtxSeconds =
    habits.secondsByContext.focus +
      habits.secondsByContext.explore +
      habits.secondsByContext.rest +
      habits.secondsByContext.play || 1;

  const contextRows: Array<{
    label: string;
    seconds: number;
    pct: number;
    color: string;
    summary: string;
  }> = [
    {
      label: 'Focused Work & Typing',
      seconds: habits.secondsByContext.focus,
      pct: Math.round((habits.secondsByContext.focus / totalCtxSeconds) * 100),
      color: 'bg-indigo-600',
      summary: 'Steady keyboard cadence and timed work intervals',
    },
    {
      label: 'Active Exploration',
      seconds: habits.secondsByContext.explore,
      pct: Math.round((habits.secondsByContext.explore / totalCtxSeconds) * 100),
      color: 'bg-sky-600',
      summary: 'Cursor movement, window organizing, and navigation',
    },
    {
      label: 'Energy Relief & Direct Care',
      seconds: habits.secondsByContext.play,
      pct: Math.round((habits.secondsByContext.play / totalCtxSeconds) * 100),
      color: 'bg-amber-500',
      summary: '5-min Energy breaks, ball chasing, snack feeding, and petting',
    },
    {
      label: 'Quiet Rest & Corner Standby',
      seconds: habits.secondsByContext.rest,
      pct: Math.round((habits.secondsByContext.rest / totalCtxSeconds) * 100),
      color: 'bg-teal-600',
      summary: 'Low-activity pauses and recovery intervals',
    },
  ];

  const appEntries = Object.entries(habits.appUsageSeconds || {}).sort(
    (a, b) => b[1] - a[1]
  );
  const totalAppSec =
    appEntries.reduce((sum, [, sec]) => sum + sec, 0) || 1;

  const phases: Array<{ key: CircadianPhase; label: string; window: string }> = [
    { key: 'MORNING', label: 'Morning', window: '05:00 – 12:00' },
    { key: 'AFTERNOON', label: 'Afternoon', window: '12:00 – 17:00' },
    { key: 'EVENING', label: 'Evening', window: '17:00 – 22:00' },
    { key: 'NIGHT', label: 'Late Night', window: '22:00 – 05:00' },
  ];

  const totalPhaseSec =
    Object.values(habits.secondsByPhase).reduce((a, b) => a + b, 0) || 1;

  const insights: Array<{ title: string; detail: string; active: boolean }> = [
    {
      title: 'Steady Flow Worker',
      detail: `Peak typing speed recorded at ${Math.round(habits.peakWpmRecorded)} WPM with ${Math.round(habits.secondsByContext.focus)}s of focus sync.`,
      active: habits.secondsByContext.focus >= 20 || habits.peakWpmRecorded >= 30,
    },
    {
      title: 'Attentive Caretaker',
      detail: `${habits.pettingCount} petting interactions and ${habits.snacksFed} snacks shared with ${profile.name}.`,
      active: habits.pettingCount >= 3 || habits.snacksFed >= 2,
    },
    {
      title: 'Playful Break Taker',
      detail: `${habits.ballThrows} desktop ball tosses used to decompress between work bursts.`,
      active: habits.ballThrows >= 2,
    },
    {
      title: 'Night Owl Rhythm',
      detail: 'Late-night activity detected; Komo shifts into gentle calming-quote mode.',
      active: habits.secondsByPhase.NIGHT >= 15,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Observed User Habit Memory
        </h2>
        <p className="mt-1 text-sm text-slate-600 max-w-2xl">
          {profile.name} monitors which app you focus on, how long your laptop work runs, and how you recharge during breaks.
        </p>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="text-xs text-slate-500">Total Interactions</div>
            <div className="mt-1 text-2xl font-semibold font-mono tabular-nums text-slate-900">
              {habits.totalInteractions}
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="text-xs text-slate-500">Peak Typing Speed</div>
            <div className="mt-1 text-2xl font-semibold font-mono tabular-nums text-slate-900">
              {Math.round(habits.peakWpmRecorded)} WPM
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="text-xs text-slate-500">Focus Cycles</div>
            <div className="mt-1 text-2xl font-semibold font-mono tabular-nums text-slate-900">
              {habits.focusSessionsCompleted}
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="text-xs text-slate-500">Snacks Shared</div>
            <div className="mt-1 text-2xl font-semibold font-mono tabular-nums text-slate-900">
              {habits.snacksFed}
            </div>
          </div>
        </div>
      </div>

      {/* Observed App Time Breakdown */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <h3 className="text-base font-semibold text-slate-900">
          App Work Duration Breakdown
        </h3>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {appEntries.map(([appName, sec]) => {
            const pct = Math.round((sec / totalAppSec) * 100);
            return (
              <div key={appName} className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-800">{appName}</span>
                  <span className="font-mono tabular-nums text-xs text-slate-600">
                    {formatDuration(sec)} · {pct}%
                  </span>
                </div>
                <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-900 rounded-full transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="text-base font-semibold text-slate-900">
            Activity Distribution
          </h3>
          <div className="mt-4 space-y-4">
            {contextRows.map((row) => (
              <div key={row.label}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-800">{row.label}</span>
                  <span className="font-mono tabular-nums text-xs text-slate-600">
                    {row.pct}% · {Math.round(row.seconds)}s
                  </span>
                </div>
                <div className="mt-1.5 h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${row.color} rounded-full transition-all duration-300`}
                    style={{ width: `${row.pct}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">{row.summary}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="text-base font-semibold text-slate-900">
            Circadian Affinity
          </h3>
          <div className="mt-4 space-y-3.5">
            {phases.map((p) => {
              const sec = habits.secondsByPhase[p.key];
              const pct = Math.round((sec / totalPhaseSec) * 100);
              return (
                <div
                  key={p.key}
                  className="flex items-center justify-between gap-4 py-2 border-b border-slate-100 last:border-b-0"
                >
                  <div>
                    <div className="text-sm font-medium text-slate-800">{p.label}</div>
                    <div className="text-xs text-slate-500 font-mono tabular-nums">
                      {p.window}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-48">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-800 rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-xs font-mono tabular-nums text-slate-700">
                      {pct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <h3 className="text-base font-semibold text-slate-900">
          Learned Behavioral Patterns
        </h3>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((item) => (
            <div
              key={item.title}
              className={`p-4 rounded-lg border ${
                item.active
                  ? 'border-slate-300 bg-slate-50'
                  : 'border-slate-100 bg-white opacity-60'
              }`}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-900">
                  {item.title}
                </h4>
                <span className="text-xs font-medium text-slate-500">
                  {item.active ? 'Observed' : 'Pending'}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
