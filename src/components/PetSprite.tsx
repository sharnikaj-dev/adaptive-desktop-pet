import React from 'react';
import { AccessoryId, PetAction, PetMood, PetSpecies } from '../types/pet';

interface PetSpriteProps {
  species: PetSpecies;
  mood: PetMood;
  action?: PetAction;
  facing: 'left' | 'right';
  isWalking: boolean;
  isDragging: boolean;
  isPurring: boolean;
  lookOffset: { x: number; y: number };
  equippedAccessories: AccessoryId[];
  size?: number;
}

export const PetSprite: React.FC<PetSpriteProps> = ({
  species,
  mood,
  action = 'idle',
  facing,
  isWalking,
  isDragging,
  isPurring,
  lookOffset,
  equippedAccessories,
  size = 112,
}) => {
  const flipX = facing === 'left' ? -1 : 1;
  const lx = Math.max(-3, Math.min(3, lookOffset.x * flipX));
  const ly = Math.max(-2, Math.min(2, lookOffset.y));

  const bodyAnimClass = isDragging
    ? ''
    : action === 'roll'
    ? 'animate-pet-roll'
    : action === 'hop'
    ? 'animate-pet-hop'
    : isWalking || action === 'walk'
    ? 'animate-pet-walk'
    : 'animate-pet-breathe';

  const tailAnimClass =
    mood === 'SLEEPY' || action === 'sleep_corner' ? '' : 'animate-pet-tail';

  const hasGlasses =
    equippedAccessories.includes('glasses') ||
    (mood === 'FOCUSED' && equippedAccessories.length === 0);
  const hasScarf = equippedAccessories.includes('scarf');
  const hasHeadphones = equippedAccessories.includes('headphones');
  const hasTeacup = equippedAccessories.includes('teacup') || mood === 'CONCERNED';
  const hasStarPin = equippedAccessories.includes('star_pin');

  // Dedicated high-craft Cozy Red Panda renderer matching reference poses
  if (species === 'red_panda') {
    const isCornerSleep = action === 'sleep_corner' || (mood === 'SLEEPY' && !isWalking && action !== 'roll' && action !== 'hop');
    const isHappyRoll = action === 'roll';
    const isWaving = action === 'wave' || mood === 'AFFECTIONATE' || isPurring;

    // Pose 1: Sleeping Curled Up on Cozy Pillow (matches reference Pose 1)
    if (isCornerSleep && !isDragging) {
      return (
        <div style={{ width: size, height: size }} className="relative select-none">
          <svg
            viewBox="0 0 128 120"
            className="w-full h-full overflow-visible drop-shadow-[0_6px_12px_rgba(45,22,14,0.12)]"
            aria-label="Sleeping red panda desktop pet"
          >
            {/* Cozy cream cushion pillow */}
            <path
              d="M16 90 Q 32 76 64 78 Q 98 76 114 90 Q 98 106 64 106 Q 30 106 16 90 Z"
              fill="#FBF3E4"
              stroke="#2D160E"
              strokeWidth="2.3"
              strokeLinejoin="round"
            />
            <g className="animate-pet-breathe">
              {/* Curled body */}
              <ellipse
                cx="66"
                cy="78"
                rx="32"
                ry="20"
                fill="#D96236"
                stroke="#2D160E"
                strokeWidth="2.4"
              />
              {/* Fluffy striped tail wrapped around front */}
              <g>
                <path
                  d="M66 92 C 88 94, 108 82, 100 66 C 93 56, 76 66, 62 76 Z"
                  fill="#D96236"
                  stroke="#2D160E"
                  strokeWidth="2.4"
                  strokeLinejoin="round"
                />
                <path d="M74 88 Q 78 78 72 72" stroke="#4A2518" strokeWidth="5.5" strokeLinecap="round" fill="none" />
                <path d="M86 85 Q 92 74 85 66" stroke="#4A2518" strokeWidth="5.5" strokeLinecap="round" fill="none" />
                <path d="M96 76 Q 100 68 95 63" stroke="#4A2518" strokeWidth="4.5" strokeLinecap="round" fill="none" />
              </g>
              {/* Head resting on paws */}
              <g transform="translate(-8, 6)">
                {/* Ears */}
                <path d="M30 48 L 24 31 L 42 38 Z" fill="#FFF3E2" stroke="#2D160E" strokeWidth="2.3" strokeLinejoin="round" />
                <path d="M28 45 L 26 35 L 38 40 Z" fill="#D96236" />
                <path d="M68 48 L 74 31 L 56 38 Z" fill="#FFF3E2" stroke="#2D160E" strokeWidth="2.3" strokeLinejoin="round" />
                <path d="M70 45 L 72 35 L 60 40 Z" fill="#D96236" />

                <ellipse cx="49" cy="57" rx="23" ry="18" fill="#D96236" stroke="#2D160E" strokeWidth="2.4" />
                {/* Cream cheek/muzzle mask */}
                <path
                  d="M32 61 Q 36 52 43 56 Q 49 52 55 56 Q 62 52 66 61 Q 63 72 49 72 Q 35 72 32 61 Z"
                  fill="#FFF3E2"
                />
                {/* Cream brow spots */}
                <ellipse cx="41" cy="49" rx="3" ry="1.8" fill="#FFF3E2" />
                <ellipse cx="57" cy="49" rx="3" ry="1.8" fill="#FFF3E2" />
                {/* Closed peaceful eyes */}
                <path d="M38 58 Q 41 61 44 58" fill="none" stroke="#2D160E" strokeWidth="2.1" strokeLinecap="round" />
                <path d="M54 58 Q 57 61 60 58" fill="none" stroke="#2D160E" strokeWidth="2.1" strokeLinecap="round" />
                {/* Tiny nose & sleepy mouth */}
                <ellipse cx="49" cy="61.5" rx="2.5" ry="1.8" fill="#2D160E" />
                <path d="M46.5 65.5 Q 49 67.5 51.5 65.5" fill="none" stroke="#2D160E" strokeWidth="1.7" strokeLinecap="round" />
                {/* Tucked dark front paw */}
                <ellipse cx="42" cy="76" rx="7" ry="4.5" fill="#4A2518" stroke="#2D160E" strokeWidth="2" />
              </g>
            </g>
          </svg>
        </div>
      );
    }

    // Pose 3: Happy Rolling Pose (matches reference Pose 3)
    if (isHappyRoll && !isDragging) {
      return (
        <div style={{ width: size, height: size }} className="relative select-none">
          <svg
            viewBox="0 0 120 120"
            className="w-full h-full overflow-visible drop-shadow-[0_6px_12px_rgba(45,22,14,0.14)]"
            aria-label="Happy rolling red panda desktop pet"
          >
            <ellipse cx="60" cy="106" rx="30" ry="6" fill="rgba(45,22,14,0.14)" />
            <g className="animate-pet-roll">
              {/* Fluffy striped tail curving up */}
              <path
                d="M36 62 C 12 50, 12 24, 30 22 C 42 22, 46 42, 44 56 Z"
                fill="#D96236"
                stroke="#2D160E"
                strokeWidth="2.4"
                strokeLinejoin="round"
              />
              <path d="M22 44 Q 28 38 35 42" stroke="#4A2518" strokeWidth="5" strokeLinecap="round" fill="none" />
              <path d="M24 31 Q 30 27 36 32" stroke="#4A2518" strokeWidth="5" strokeLinecap="round" fill="none" />

              {/* Round tummy on back */}
              <ellipse cx="60" cy="66" rx="24" ry="20" fill="#D96236" stroke="#2D160E" strokeWidth="2.4" />
              <ellipse cx="60" cy="64" rx="14" ry="12" fill="#4A2518" />

              {/* Happy paws kicked up */}
              <ellipse cx="42" cy="48" rx="6" ry="7" transform="rotate(-25 42 48)" fill="#4A2518" stroke="#2D160E" strokeWidth="2" />
              <ellipse cx="78" cy="48" rx="6" ry="7" transform="rotate(25 78 48)" fill="#4A2518" stroke="#2D160E" strokeWidth="2" />
              <ellipse cx="44" cy="82" rx="6" ry="5.5" fill="#4A2518" stroke="#2D160E" strokeWidth="2" />
              <ellipse cx="76" cy="82" rx="6" ry="5.5" fill="#4A2518" stroke="#2D160E" strokeWidth="2" />

              {/* Upside-down / tilted happy head */}
              <g transform="translate(60, 74) rotate(165) translate(-60, -54)">
                <path d="M36 44 L 30 24 L 48 34 Z" fill="#FFF3E2" stroke="#2D160E" strokeWidth="2.3" strokeLinejoin="round" />
                <path d="M84 44 L 90 24 L 72 34 Z" fill="#FFF3E2" stroke="#2D160E" strokeWidth="2.3" strokeLinejoin="round" />
                <ellipse cx="60" cy="54" rx="23" ry="18" fill="#D96236" stroke="#2D160E" strokeWidth="2.4" />
                <path d="M42 58 Q 48 50 54 54 Q 60 50 66 54 Q 72 50 78 58 Q 74 69 60 69 Q 46 69 42 58 Z" fill="#FFF3E2" />
                <path d="M47 54 Q 50 49 53 54" fill="none" stroke="#2D160E" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M67 54 Q 70 49 73 54" fill="none" stroke="#2D160E" strokeWidth="2.2" strokeLinecap="round" />
                <ellipse cx="60" cy="59" rx="2.4" ry="1.8" fill="#2D160E" />
                <path d="M56 62 Q 60 68 64 62 Z" fill="#F472B6" stroke="#2D160E" strokeWidth="1.6" />
              </g>
            </g>
          </svg>
        </div>
      );
    }

    // Pose 2: Upright Chibi Red Panda (Idle, Walking, Waving Paw, Hopping — matches reference Pose 2)
    return (
      <div
        style={{ width: size, height: size }}
        className={`relative select-none transition-transform duration-150 ${
          isPurring ? 'scale-105' : isDragging ? 'scale-105 -translate-y-1' : 'scale-100'
        }`}
      >
        <svg
          viewBox="0 0 120 120"
          className="w-full h-full overflow-visible drop-shadow-[0_6px_12px_rgba(45,22,14,0.14)]"
          aria-label={`Red panda desktop pet in ${mood.toLowerCase()} mood`}
        >
          <g transform={`translate(60, 0) scale(${flipX}, 1) translate(-60, 0)`}>
            {/* Ground shadow */}
            <ellipse
              cx="60"
              cy="108"
              rx={isDragging || action === 'hop' ? 18 : 26}
              ry={isDragging || action === 'hop' ? 4 : 6}
              fill="rgba(45, 22, 14, 0.14)"
            />

            <g className={bodyAnimClass}>
              {/* Fluffy Striped Tail */}
              <g className={tailAnimClass}>
                <path
                  d="M42 86 C 14 86, 10 54, 24 44 C 34 38, 44 54, 42 74 Z"
                  fill="#D96236"
                  stroke="#2D160E"
                  strokeWidth="2.4"
                  strokeLinejoin="round"
                />
                <path d="M22 72 Q 30 66 37 72" stroke="#4A2518" strokeWidth="5.5" strokeLinecap="round" fill="none" />
                <path d="M20 58 Q 28 53 36 59" stroke="#4A2518" strokeWidth="5.5" strokeLinecap="round" fill="none" />
                <path d="M25 47 Q 31 44 36 49" stroke="#4A2518" strokeWidth="4.5" strokeLinecap="round" fill="none" />
              </g>

              {/* Torso */}
              <path
                d="M40 74 C 38 62, 46 58, 60 58 C 74 58, 82 62, 80 74 L 78 96 C 78 101, 70 103, 60 103 C 50 103, 42 101, 42 96 Z"
                fill="#D96236"
                stroke="#2D160E"
                strokeWidth="2.4"
              />
              {/* Cocoa tummy patch */}
              <ellipse cx="60" cy="84" rx="13" ry="14" fill="#4A2518" />

              {/* Left Arm */}
              <ellipse
                cx="39"
                cy="79"
                rx="6"
                ry="10"
                transform="rotate(14 39 79)"
                fill="#4A2518"
                stroke="#2D160E"
                strokeWidth="2.2"
              />

              {/* Right Arm (waving with cute pink paw pad when waving/affectionate!) */}
              {isWaving ? (
                <g className="animate-pet-wave">
                  <ellipse
                    cx="83"
                    cy="62"
                    rx="6.2"
                    ry="11"
                    transform="rotate(32 83 62)"
                    fill="#4A2518"
                    stroke="#2D160E"
                    strokeWidth="2.2"
                  />
                  <circle cx="87" cy="54" r="2.2" fill="#F9A8D4" />
                  <circle cx="84" cy="51.5" r="1.2" fill="#F9A8D4" />
                  <circle cx="87.5" cy="50.5" r="1.2" fill="#F9A8D4" />
                  <circle cx="90.5" cy="52" r="1.2" fill="#F9A8D4" />
                </g>
              ) : (
                <ellipse
                  cx="81"
                  cy="79"
                  rx="6"
                  ry="10"
                  transform="rotate(-14 81 79)"
                  fill="#4A2518"
                  stroke="#2D160E"
                  strokeWidth="2.2"
                />
              )}

              {/* Feet */}
              <ellipse cx="50" cy={isDragging ? 104 : 101} rx="7.5" ry="4.8" fill="#4A2518" stroke="#2D160E" strokeWidth="2.2" />
              <ellipse cx="70" cy={isDragging ? 104 : 101} rx="7.5" ry="4.8" fill="#4A2518" stroke="#2D160E" strokeWidth="2.2" />

              {/* Knit Scarf */}
              {hasScarf && (
                <g>
                  <path
                    d="M40 62 Q 60 69 80 62 L 78 69 Q 60 76 42 69 Z"
                    fill="#DC2626"
                    stroke="#2D160E"
                    strokeWidth="1.8"
                  />
                  <path
                    d="M65 67 L 70 81 L 62 83 L 59 69 Z"
                    fill="#B91C1C"
                    stroke="#2D160E"
                    strokeWidth="1.6"
                  />
                </g>
              )}

              {/* Star Pin */}
              {hasStarPin && (
                <polygon
                  points="52,74 54,78 58,78.5 55,81 55.8,85 52,83 48.2,85 49,81 46,78.5 50,78"
                  fill="#F59E0B"
                  stroke="#2D160E"
                  strokeWidth="1.2"
                />
              )}

              {/* Ears (Cream outer, rust-orange inner like reference!) */}
              <path
                d="M35 39 L 27 16 L 50 26 Z"
                fill="#FFF3E2"
                stroke="#2D160E"
                strokeWidth="2.4"
                strokeLinejoin="round"
              />
              <path d="M36 35 L 31 22 L 45 28 Z" fill="#D96236" />
              <path
                d="M85 39 L 93 16 L 70 26 Z"
                fill="#FFF3E2"
                stroke="#2D160E"
                strokeWidth="2.4"
                strokeLinejoin="round"
              />
              <path d="M84 35 L 89 22 L 75 28 Z" fill="#D96236" />

              {/* Head */}
              <path
                d="M30 46 C 30 27, 44 21, 60 21 C 76 21, 90 27, 90 46 C 90 61, 77 67, 60 67 C 43 67, 30 61, 30 46 Z"
                fill="#D96236"
                stroke="#2D160E"
                strokeWidth="2.4"
              />

              {/* Fluffy hair tuft */}
              <path
                d="M55 21 Q 60 15 64 21"
                fill="#D96236"
                stroke="#2D160E"
                strokeWidth="2.2"
                strokeLinecap="round"
              />

              {/* Cream Cheek & Muzzle Markings */}
              <ellipse cx="39" cy="51" rx="8.5" ry="6.5" fill="#FFF3E2" />
              <ellipse cx="81" cy="51" rx="8.5" ry="6.5" fill="#FFF3E2" />
              <ellipse cx="60" cy="55" rx="12" ry="9" fill="#FFF3E2" />

              {/* Cream Eyebrow Dots */}
              <ellipse cx="48" cy="36" rx="4" ry="2.4" transform="rotate(-12 48 36)" fill="#FFF3E2" />
              <ellipse cx="72" cy="36" rx="4" ry="2.4" transform="rotate(12 72 36)" fill="#FFF3E2" />

              {/* Studio Headphones */}
              {hasHeadphones && (
                <g>
                  <path
                    d="M29 45 C 27 14, 93 14, 91 45"
                    fill="none"
                    stroke="#334155"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <rect x="23" y="38" width="9" height="16" rx="4" fill="#1E293B" />
                  <rect x="88" y="38" width="9" height="16" rx="4" fill="#1E293B" />
                  <rect x="25" y="41" width="3.5" height="10" rx="1.5" fill="#F59E0B" />
                  <rect x="91.5" y="41" width="3.5" height="10" rx="1.5" fill="#F59E0B" />
                </g>
              )}

              {/* Rosy Cheeks */}
              <ellipse
                cx="40"
                cy="51"
                rx="4.2"
                ry="2.5"
                fill="#F48C8C"
                opacity={mood === 'AFFECTIONATE' || isPurring ? 0.95 : 0.7}
              />
              <ellipse
                cx="80"
                cy="51"
                rx="4.2"
                ry="2.5"
                fill="#F48C8C"
                opacity={mood === 'AFFECTIONATE' || isPurring ? 0.95 : 0.7}
              />

              {/* Eyes */}
              {mood === 'PLAYFUL' || mood === 'AFFECTIONATE' || isPurring ? (
                <g stroke="#2D160E" strokeWidth="2.4" strokeLinecap="round" fill="none">
                  <path d="M43 45 Q 47.5 39 52 45" />
                  <path d="M68 45 Q 72.5 39 77 45" />
                </g>
              ) : mood === 'ZEN' ? (
                <g stroke="#2D160E" strokeWidth="2.2" strokeLinecap="round" fill="none">
                  <line x1="43" y1="45" x2="52" y2="45" />
                  <line x1="68" y1="45" x2="77" y2="45" />
                </g>
              ) : (
                <g>
                  <circle cx={47 + lx * 0.65} cy={44 + ly * 0.65} r="4.8" fill="#2D160E" />
                  <circle cx={73 + lx * 0.65} cy={44 + ly * 0.65} r="4.8" fill="#2D160E" />
                  <circle cx={48.6 + lx * 0.8} cy={42.2 + ly * 0.8} r="1.7" fill="#FFFFFF" />
                  <circle cx={74.6 + lx * 0.8} cy={42.2 + ly * 0.8} r="1.7" fill="#FFFFFF" />
                  <circle cx={45.5 + lx * 0.6} cy={46 + ly * 0.6} r="0.9" fill="#FFFFFF" opacity="0.8" />
                  <circle cx={71.5 + lx * 0.6} cy={46 + ly * 0.6} r="0.9" fill="#FFFFFF" opacity="0.8" />
                  {mood === 'CONCERNED' && (
                    <g stroke="#2D160E" strokeWidth="1.9" strokeLinecap="round">
                      <line x1="42" y1="38" x2="51" y2="40" />
                      <line x1="78" y1="38" x2="69" y2="40" />
                    </g>
                  )}
                </g>
              )}

              {/* Focus Specs */}
              {hasGlasses && (
                <g stroke="#2D160E" strokeWidth="1.8" fill="rgba(255,255,255,0.22)">
                  <rect x="39" y="38.5" width="16" height="11.5" rx="4" />
                  <rect x="65" y="38.5" width="16" height="11.5" rx="4" />
                  <line x1="55" y1="44" x2="65" y2="44" />
                </g>
              )}

              {/* Nose & Happy Mouth */}
              <ellipse cx="60" cy="50.5" rx="2.7" ry="1.9" fill="#2D160E" />
              {mood === 'CONCERNED' ? (
                <path
                  d="M56 57 Q 60 54 64 57"
                  fill="none"
                  stroke="#2D160E"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                />
              ) : (
                <g>
                  <path
                    d="M55 54 Q 57.5 57.5 60 54.5 Q 62.5 57.5 65 54"
                    fill="none"
                    stroke="#2D160E"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                  />
                  {(isWaving || mood === 'PLAYFUL' || action === 'eat') && (
                    <path
                      d="M57 56 Q 60 61.5 63 56 Z"
                      fill="#F472B6"
                      stroke="#2D160E"
                      strokeWidth="1.4"
                    />
                  )}
                </g>
              )}

              {/* Matcha Teacup */}
              {hasTeacup && (
                <g transform="translate(84, 72)">
                  <rect
                    x="0"
                    y="6"
                    width="15"
                    height="13"
                    rx="3"
                    fill="#FFFFFF"
                    stroke="#2D160E"
                    strokeWidth="1.8"
                  />
                  <path d="M15 9 C 19 9, 19 15, 15 15" fill="none" stroke="#2D160E" strokeWidth="1.8" />
                  <rect x="2.5" y="7.5" width="10" height="3" rx="1" fill="#34D399" />
                  <path d="M5 3 Q 7 0 5 -2 M10 3 Q 12 0 10 -2" fill="none" stroke="#94A3B8" strokeWidth="1.4" strokeLinecap="round" />
                </g>
              )}
            </g>
          </g>
        </svg>
      </div>
    );
  }

  // Classic Bamboo Giant Panda & other optional forms
  const fallbackColors =
    species === 'panda'
      ? { fur: '#FFFFFF', dark: '#1E293B', belly: '#FFFFFF', ear: '#1E293B', cheek: '#FDA4AF' }
      : species === 'cat'
      ? { fur: '#94A3B8', dark: '#64748B', belly: '#F8FAFC', ear: '#64748B', cheek: '#FDA4AF' }
      : { fur: '#E99A54', dark: '#C87632', belly: '#FFF6EB', ear: '#C87632', cheek: '#F59E9E' };

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative select-none transition-transform duration-150 ${
        isPurring ? 'scale-105' : isDragging ? 'scale-105 -translate-y-1' : 'scale-100'
      }`}
    >
      <svg viewBox="0 0 120 120" className="w-full h-full overflow-visible drop-shadow-[0_6px_12px_rgba(15,23,42,0.12)]">
        <g transform={`translate(60, 0) scale(${flipX}, 1) translate(-60, 0)`}>
          <ellipse cx="60" cy="108" rx="26" ry="5.5" fill="rgba(15, 23, 42, 0.14)" />
          <g className={bodyAnimClass}>
            <circle cx="38" cy="28" r="10" fill={fallbackColors.ear} stroke="#1E293B" strokeWidth="2.2" />
            <circle cx="82" cy="28" r="10" fill={fallbackColors.ear} stroke="#1E293B" strokeWidth="2.2" />
            <path
              d="M34 70 C 32 42, 43 30, 60 30 C 77 30, 88 42, 86 70 C 88 90, 78 100, 60 100 C 42 100, 32 90, 34 70 Z"
              fill={fallbackColors.fur}
              stroke="#1E293B"
              strokeWidth="2.4"
            />
            {species === 'panda' && (
              <>
                <ellipse cx="47" cy="54" rx="7" ry="9" transform="rotate(14 47 54)" fill="#1E293B" />
                <ellipse cx="73" cy="54" rx="7" ry="9" transform="rotate(-14 73 54)" fill="#1E293B" />
                <path d="M36 73 Q 60 78 84 73 L 84 82 Q 60 87 36 82 Z" fill="#1E293B" />
              </>
            )}
            <ellipse cx="42" cy="64" rx="4.5" ry="2.6" fill={fallbackColors.cheek} opacity="0.7" />
            <ellipse cx="78" cy="64" rx="4.5" ry="2.6" fill={fallbackColors.cheek} opacity="0.7" />
            {mood === 'SLEEPY' || action === 'sleep_corner' ? (
              <g stroke={species === 'panda' ? '#FFFFFF' : '#1E293B'} strokeWidth="2.2" strokeLinecap="round" fill="none">
                <path d="M43 54 Q 47 57 51 54" />
                <path d="M69 54 Q 73 57 77 54" />
              </g>
            ) : (
              <g>
                <circle cx={47 + lx * 0.6} cy={54 + ly * 0.6} r="2.6" fill={species === 'panda' ? '#FFFFFF' : '#1E293B'} />
                <circle cx={73 + lx * 0.6} cy={54 + ly * 0.6} r="2.6" fill={species === 'panda' ? '#FFFFFF' : '#1E293B'} />
              </g>
            )}
            <ellipse cx="60" cy="61" rx="2.6" ry="1.9" fill="#1E293B" />
            <path d="M56 65 Q 58 67.5 60 65 Q 62 67.5 64 65" fill="none" stroke="#1E293B" strokeWidth="1.8" strokeLinecap="round" />
            <ellipse cx="46" cy="99" rx="6.5" ry="4.5" fill={fallbackColors.dark} stroke="#1E293B" strokeWidth="2" />
            <ellipse cx="74" cy="99" rx="6.5" ry="4.5" fill={fallbackColors.dark} stroke="#1E293B" strokeWidth="2" />
          </g>
        </g>
      </svg>
    </div>
  );
};
