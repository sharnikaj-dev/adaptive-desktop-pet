import React from 'react';
import { AccessoryId, PetProfile, PetSpecies } from '../types/pet';
import { ACCESSORY_META } from '../engine/behaviorEngine';
import { PetSprite } from './PetSprite';
import { Check, Lock } from 'lucide-react';

interface PersonalityViewProps {
  profile: PetProfile;
  onUpdateName: (name: string) => void;
  onChangeSpecies: (species: PetSpecies) => void;
  onToggleAccessory: (id: AccessoryId) => void;
}

export const PersonalityView: React.FC<PersonalityViewProps> = ({
  profile,
  onUpdateName,
  onChangeSpecies,
  onToggleAccessory,
}) => {
  const speciesOptions: Array<{
    id: PetSpecies;
    label: string;
    temperament: string;
  }> = [
    {
      id: 'red_panda',
      label: 'Cozy Red Panda',
      temperament: 'Warm, expressive companion with striped tail',
    },
    {
      id: 'panda',
      label: 'Bamboo Panda',
      temperament: 'Gentle black-and-white focus buddy',
    },
    {
      id: 'shiba',
      label: 'Cream Shiba',
      temperament: 'Loyal, attentive desktop friend',
    },
    {
      id: 'cat',
      label: 'Slate Tabby',
      temperament: 'Observant window-perching kitten',
    },
  ];

  const traitAxes: Array<{
    label: string;
    value: number;
    driver: string;
    barClass: string;
  }> = [
    {
      label: 'Curiosity',
      value: profile.personality.curiosity,
      driver: 'Grows with pointer exploration and dragging desktop windows.',
      barClass: 'bg-sky-600',
    },
    {
      label: 'Calmness',
      value: profile.personality.calmness,
      driver: 'Grows during steady typing sessions and quiet desktop pauses.',
      barClass: 'bg-teal-600',
    },
    {
      label: 'Playfulness',
      value: profile.personality.playfulness,
      driver: 'Grows when tossing the ball, feeding snacks, and playing.',
      barClass: 'bg-amber-500',
    },
    {
      label: 'Empathy',
      value: profile.personality.empathy,
      driver: 'Grows through late-night check-ins and gentle petting.',
      barClass: 'bg-emerald-600',
    },
  ];

  const accessoryIds = Object.keys(ACCESSORY_META) as AccessoryId[];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left: Identity & Live Preview */}
      <div className="lg:col-span-5 space-y-6">
        <section className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex flex-col items-center py-6 bg-slate-50 rounded-lg border border-slate-100">
            <PetSprite
              species={profile.species}
              mood={profile.mood}
              facing="right"
              isWalking={false}
              isDragging={false}
              isPurring={false}
              lookOffset={{ x: 0, y: 0 }}
              equippedAccessories={profile.habits.equippedAccessories}
              size={140}
            />
            <div className="mt-3 text-base font-semibold text-slate-900">
              {profile.name}
            </div>
            <div className="text-xs text-slate-500">
              {profile.habits.equippedAccessories.length} equipped accessories ·{' '}
              {profile.habits.unlockedAccessories.length}/{accessoryIds.length} unlocked
            </div>
          </div>

          <div className="mt-5">
            <label
              htmlFor="pet-name-input"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              Companion Name
            </label>
            <input
              id="pet-name-input"
              type="text"
              maxLength={18}
              value={profile.name}
              onChange={(e) => onUpdateName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              placeholder="Name your pet"
            />
          </div>

          <div className="mt-5">
            <div className="text-xs font-medium text-slate-700 mb-2">
              Companion Form
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {speciesOptions.map((sp) => {
                const selected = profile.species === sp.id;
                return (
                  <button
                    key={sp.id}
                    type="button"
                    onClick={() => onChangeSpecies(sp.id)}
                    className={`text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                      selected
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-900'
                    }`}
                  >
                    <div className="text-xs font-semibold">{sp.label}</div>
                    <div
                      className={`mt-0.5 text-[11px] leading-snug ${
                        selected ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      {sp.temperament}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {/* Right: Evolving Personality & Accessories */}
      <div className="lg:col-span-7 space-y-6">
        <section className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Adaptive Personality Matrix
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Unlike static virtual pets, {profile.name}&apos;s traits evolve continuously in response to your actual habits.
          </p>

          <div className="mt-5 space-y-4">
            {traitAxes.map((trait) => {
              const val = Math.round(trait.value);
              return (
                <div key={trait.label}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-800">
                      {trait.label}
                    </span>
                    <span className="font-mono tabular-nums text-xs text-slate-700">
                      {val} / 100
                    </span>
                  </div>
                  <div className="mt-1.5 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${trait.barClass} rounded-full transition-all duration-300`}
                      style={{ width: `${val}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{trait.driver}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="text-base font-semibold text-slate-900">
            Habit-Unlocked Accessories
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Accessories unlock automatically as you work, rest, and interact on the desktop stage.
          </p>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {accessoryIds.map((id) => {
              const meta = ACCESSORY_META[id];
              const unlocked = profile.habits.unlockedAccessories.includes(id);
              const equipped = profile.habits.equippedAccessories.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  disabled={!unlocked}
                  onClick={() => unlocked && onToggleAccessory(id)}
                  className={`flex items-start justify-between gap-3 p-3.5 rounded-lg border text-left transition-colors ${
                    !unlocked
                      ? 'border-slate-100 bg-slate-50/70 text-slate-400 cursor-not-allowed'
                      : equipped
                      ? 'border-slate-900 bg-slate-50 text-slate-900 cursor-pointer'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800 cursor-pointer'
                  }`}
                >
                  <div>
                    <div className="text-sm font-medium">{meta.label}</div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {unlocked ? (equipped ? 'Equipped' : 'Click to equip') : meta.unlockHint}
                    </div>
                  </div>
                  <div className="mt-0.5 shrink-0">
                    {!unlocked ? (
                      <Lock className="w-4 h-4 text-slate-400" />
                    ) : equipped ? (
                      <Check className="w-4 h-4 text-slate-900" />
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
