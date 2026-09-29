export type WorkoutNum = 1 | 2 | 3 | 4 | 5;

export interface PrepItem {
  id: string;
  name: string;
  prescription: string;
}

export interface ExerciseOption {
  key: string;
  name: string;
}

export interface ExerciseSlot {
  id: string;
  /** Default display name (or label for a choice slot) */
  name: string;
  /** Shared exercise key used for cross-workout memory. For choice slots, each option has its own key. */
  key: string;
  options?: ExerciseOption[];
  prescription: string;
  sets: number;
}

export type Section =
  | { kind: 'prep'; title: string; items: PrepItem[] }
  | { kind: 'work'; title: string; items: ExerciseSlot[] }
  | { kind: 'run'; title: string };

export interface WorkoutDef {
  num: WorkoutNum;
  title: string;
  description: string;
  sections: Section[];
}

const p = (id: string, name: string, prescription: string): PrepItem => ({ id, name, prescription });
const x = (
  id: string,
  name: string,
  key: string,
  prescription: string,
  sets: number,
  options?: ExerciseOption[],
): ExerciseSlot => ({ id, name, key, prescription, sets, options });

export const MORNING_ROUTINE: PrepItem[] = [
  p('m1', 'Easy treadmill walk', '3 minutes'),
  p('m2', 'Comfortable brisk treadmill walk', '3–5 minutes'),
  p('m3', 'Cat-camel', '4–6 slow repetitions'),
  p('m4', 'Wall slides', '6–8 repetitions'),
  p('m5', 'Supported ankle rocks', '6 per side'),
  p('m6', 'Controlled calf raises', '8–10 repetitions'),
  p('m7', 'Sit-to-stand or bodyweight squat', '5–8 repetitions'),
];

export const WORKOUTS: Record<WorkoutNum, WorkoutDef> = {
  1: {
    num: 1,
    title: 'Core, Back Capacity, Hip Mobility + Light Upper Body',
    description: 'Core control, back capacity, mobility, and a light second upper-body exposure.',
    sections: [
      { kind: 'prep', title: 'General Warm-Up', items: [p('w1g1', 'Treadmill walk', '5 minutes')] },
      {
        kind: 'prep',
        title: 'Movement Preparation',
        items: [
          p('w1p1', 'Cat-camel', '6 slow repetitions'),
          p('w1p2', 'Open-book thoracic rotation', '5 per side'),
          p('w1p3', 'Controlled 90/90 hip switches', '5 per side'),
          p('w1p4', 'Supported ankle rocks', '8 per side'),
          p('w1p5', 'Bodyweight lateral weight shift', '5 per side'),
        ],
      },
      {
        kind: 'work',
        title: 'Core / Back',
        items: [
          x('w1e1', 'Cable Chop or Cable Lift', 'cable-chop', '2 × 8–10 per side', 2, [
            { key: 'cable-chop', name: 'Cable Chop' },
            { key: 'cable-lift', name: 'Cable Lift' },
          ]),
          x('w1e2', 'Back Extension', 'back-extension', '2 × 8–12', 2),
          x('w1e3', 'Bird Dog', 'bird-dog', '2 × 6–8 per side', 2),
          x('w1e4', 'Front Plank With Controlled Breathing', 'front-plank', '2 × 20–30 seconds', 2),
          x('w1e5', 'Farmer Carry', 'farmer-carry', '2 × 30–40 seconds', 2),
          x('w1e6', 'Knee Raises or Leg Raises', 'knee-raises', '2 × 6–10', 2, [
            { key: 'knee-raises', name: 'Knee Raises' },
            { key: 'leg-raises', name: 'Leg Raises' },
          ]),
        ],
      },
      {
        kind: 'work',
        title: 'Light Upper Body',
        items: [
          x('w1e7', 'Chest-Supported Row', 'chest-supported-row', '2 × 8–12', 2),
          x('w1e8', 'Incline Push-Up', 'incline-push-up', '2 × 6–10', 2),
        ],
      },
      {
        kind: 'work',
        title: 'Loaded Hip Mobility',
        items: [
          x('w1e9', 'Supported Cossack Squat', 'supported-cossack-squat', '2 × 6 per side', 2),
          x('w1e10', 'Controlled 90/90 Hip Lift-Off', 'hip-lift-off-9090', '2 × 5 per side', 2),
          x('w1e11', 'Half-Kneeling Hip-Flexor March/Lift', 'hip-flexor-march', '2 × 6 per side', 2),
          x('w1e12', 'Active Straight-Leg Raise', 'active-straight-leg-raise', '2 × 6–8 per side', 2),
        ],
      },
    ],
  },
  2: {
    num: 2,
    title: 'Full Legs A',
    description: 'Steady, machine-supported leg strength from ankle to hip.',
    sections: [
      { kind: 'prep', title: 'General Warm-Up', items: [p('w2g1', 'Treadmill Walk', '4–5 minutes')] },
      {
        kind: 'prep',
        title: 'Movement Preparation',
        items: [
          p('w2p1', 'Supported Ankle Rocks', '8 per side'),
          p('w2p2', 'Controlled 90/90 Hip Switches', '5 per side'),
          p('w2p3', 'Glute Bridge', '8–10'),
          p('w2p4', 'Lateral Band Walk', '1 × 8–10 steps each direction'),
          p('w2p5', 'Bodyweight Squat', '8'),
        ],
      },
      {
        kind: 'work',
        title: 'Working Exercises',
        items: [
          x('w2e1', 'Hack Squat', 'hack-squat', '3 × 8–10', 3),
          x('w2e2', 'Seated Hamstring Curl', 'seated-hamstring-curl', '3 × 8–12', 3),
          x('w2e3', 'Leg Extension', 'leg-extension', '2–3 × 10–15', 3),
          x('w2e4', 'Hip-Abduction Machine', 'hip-abduction', '2 × 12–20', 2),
          x('w2e5', 'Standing Calf Raise', 'standing-calf-raise', '3 × 10–15', 3),
          x('w2e6', 'Tibialis Raise', 'tibialis-raise', '2 × 15–20', 2),
        ],
      },
    ],
  },
  3: {
    num: 3,
    title: 'Upper Body + Beginner Run',
    description: 'Pulling, pressing, and an easy run that builds week by week.',
    sections: [
      { kind: 'prep', title: 'General Warm-Up', items: [p('w3g1', 'Treadmill or Elliptical', '4–5 minutes')] },
      {
        kind: 'prep',
        title: 'Upper-Body Preparation',
        items: [
          p('w3p1', 'Wrist Rocks', '8'),
          p('w3p2', 'Wall Slides', '8'),
          p('w3p3', 'Scapular Wall Push-Ups', '8'),
          p('w3p4', 'Active Hang', '10–20 seconds'),
          p('w3p5', 'Scapular Pull-Ups', '5'),
        ],
      },
      {
        kind: 'work',
        title: 'Upper-Body Training',
        items: [
          x('w3e1', 'Machine-Assisted Pull-Up', 'assisted-pull-up', '3 × 5–8', 3),
          x('w3e2', 'Incline Push-Up', 'incline-push-up', '3 × 6–10', 3),
          x('w3e3', 'Chest-Supported Machine Row', 'chest-supported-row', '3 × 8–12', 3),
          x('w3e4', 'Machine-Assisted Dip', 'assisted-dip', '2 × 5–8', 2),
          x('w3e5', 'Machine Shoulder Press', 'machine-shoulder-press', '2 × 8–12', 2),
          x('w3e6', 'Reverse Pec Deck', 'reverse-pec-deck', '2 × 12–15', 2),
          x('w3e7', 'Optional Cable Curl', 'cable-curl', '2 × 10–15', 2),
          x('w3e8', 'Optional Triceps Press-Down', 'triceps-press-down', '2 × 10–15', 2),
        ],
      },
      {
        kind: 'prep',
        title: 'Pre-Run Reset',
        items: [
          p('w3r1', 'Rest and Drink Water', '3–5 minutes'),
          p('w3r2', 'Easy-to-Brisk Treadmill Walk', '3–5 minutes'),
        ],
      },
      {
        kind: 'prep',
        title: 'Run Preparation',
        items: [
          p('w3q1', 'Supported Ankle Rocks', '8 per side'),
          p('w3q2', 'Controlled Calf Raises', '10'),
          p('w3q3', 'Tibialis Raises', '10–15'),
          p('w3q4', 'Marching in Place', '10 per side'),
          p('w3q5', 'Alternating Knee Lifts', '8 per side'),
          p('w3q6', 'Controlled Forward/Back Leg Swings', '8 per side'),
        ],
      },
      { kind: 'run', title: 'Run' },
    ],
  },
  4: {
    num: 4,
    title: 'Glutes + Core',
    description: 'Hip strength and a steady, braced middle.',
    sections: [
      { kind: 'prep', title: 'General Warm-Up', items: [p('w4g1', 'Treadmill Walk', '4–5 minutes')] },
      {
        kind: 'prep',
        title: 'Movement Preparation',
        items: [
          p('w4p1', 'Controlled 90/90 Hip Switches', '5 per side'),
          p('w4p2', 'Regular Glute Bridge', '8–10'),
          p('w4p3', 'Dead-Bug Heel Tap', '5 per side'),
          p('w4p4', 'Bodyweight Hip Hinge', '8'),
          p('w4p5', 'Lateral Band Walk', '1 × 8–10 steps each direction'),
          p('w4p6', 'Bodyweight Bulgarian Split Squat', '5 per leg'),
        ],
      },
      {
        kind: 'work',
        title: 'Glute Training',
        items: [
          x('w4e1', 'Hip Thrust', 'hip-thrust', '3 × 8–12', 3),
          x('w4e2', 'Romanian Deadlift', 'romanian-deadlift', '3 × 8–10', 3),
          x('w4e3', 'Bulgarian Split Squat', 'bulgarian-split-squat', '2 × 8–10 per leg', 2),
          x('w4e4', 'Hip-Abduction Machine', 'hip-abduction', '2 × 12–20', 2),
        ],
      },
      {
        kind: 'work',
        title: 'Core',
        items: [
          x('w4e5', 'Dead Bug', 'dead-bug', '2 × 6–8 per side', 2),
          x('w4e6', 'Side Plank', 'side-plank', '2 × 20–30 seconds per side', 2),
          x('w4e7', 'Suitcase Carry', 'suitcase-carry', '2 × 20–30 seconds per side', 2),
        ],
      },
    ],
  },
  5: {
    num: 5,
    title: 'Conservative Plyometrics + Full Legs B',
    description: 'Gentle, low-volume landing practice, then a second full leg day.',
    sections: [
      { kind: 'prep', title: 'General Warm-Up', items: [p('w5g1', 'Treadmill Walk', '5 minutes')] },
      {
        kind: 'prep',
        title: 'Plyometric Movement Preparation',
        items: [
          p('w5p1', 'Tripod-Foot Hold', '1 × 10 seconds per foot'),
          p('w5p2', 'Supported Ankle Rocks', '8 per side'),
          p('w5p3', 'Standing Calf Raises', '10'),
          p('w5p4', 'Tibialis Raises', '12–15'),
          p('w5p5', 'Bodyweight Squats', '8'),
          p('w5p6', 'Bodyweight Hip Hinge', '8'),
          p('w5p7', 'Alternating Split Squats', '5 per side'),
          p('w5p8', 'Lateral Weight Shift', '5 per side'),
          p('w5p9', 'A-March', '10 steps per side'),
          p('w5p10', 'Heel-to-Toe Quick Steps', '2 × 10 seconds'),
          p('w5p11', 'Athletic-Position Hold', '2 × 10 seconds'),
          p('w5p12', 'Practice Snap-Down', '2 repetitions'),
          p('w5p13', 'Small Practice Vertical Jump', '2 repetitions'),
        ],
      },
      {
        kind: 'work',
        title: 'Plyometric Training',
        items: [
          x('w5e1', 'Snap-Down Landing', 'snap-down-landing', '2 × 4', 2),
          x('w5e2', 'Low Pogo Hops', 'low-pogo-hops', '2 × 8', 2),
          x('w5e3', 'Vertical Jump With Held Landing', 'vertical-jump-held', '3 × 2', 3),
        ],
      },
      {
        kind: 'work',
        title: 'Full Legs B',
        items: [
          x('w5e4', 'Hack Squat', 'hack-squat', '2–3 × 10–15', 3),
          x('w5e5', 'Hip Thrust', 'hip-thrust', '2–3 × 8–12', 3),
          x('w5e6', 'Hamstring Curl', 'hamstring-curl', '3 × 10–15', 3),
          x('w5e7', 'Leg Extension', 'leg-extension', '2 × 12–15', 2),
          x('w5e8', 'Cable Kickback', 'cable-kickback', '2 × 12–15 per leg', 2),
          x('w5e9', 'Seated Calf Raise', 'seated-calf-raise', '3 × 12–20', 3),
        ],
      },
    ],
  },
};

export const WORKOUT_SHORT: Record<WorkoutNum, string> = {
  1: 'Core, Back & Hips',
  2: 'Full Legs A',
  3: 'Upper Body + Run',
  4: 'Glutes + Core',
  5: 'Plyo + Full Legs B',
};

export function exerciseSlots(num: WorkoutNum): ExerciseSlot[] {
  return WORKOUTS[num].sections.flatMap((s) => (s.kind === 'work' ? s.items : []));
}

export function prepItems(num: WorkoutNum): PrepItem[] {
  return WORKOUTS[num].sections.flatMap((s) => (s.kind === 'prep' ? s.items : []));
}

export function exerciseName(key: string): string {
  for (const n of [1, 2, 3, 4, 5] as WorkoutNum[]) {
    for (const s of exerciseSlots(n)) {
      if (s.options) {
        const o = s.options.find((o) => o.key === key);
        if (o) return o.name;
      } else if (s.key === key) return s.name;
    }
  }
  return key;
}

export interface RunPhase {
  weeks: string;
  run: string;
  walk: string;
  rounds: number;
}

export const RUN_PHASES: RunPhase[] = [
  { weeks: 'Weeks 1–2', run: '30 seconds', walk: '90 seconds', rounds: 8 },
  { weeks: 'Weeks 3–4', run: '45 seconds', walk: '75 seconds', rounds: 8 },
  { weeks: 'Weeks 5–6', run: '60 seconds', walk: '90 seconds', rounds: 8 },
  { weeks: 'Weeks 7–8', run: '90 seconds', walk: '90 seconds', rounds: 8 },
  { weeks: 'Weeks 9–10', run: '2 minutes', walk: '90 seconds', rounds: 7 },
  { weeks: 'Weeks 11–12', run: '3 minutes', walk: '90 seconds', rounds: 6 },
];

export function runPhaseForWeek(week: number): RunPhase | null {
  if (week > 12) return null;
  return RUN_PHASES[Math.max(0, Math.ceil(week / 2) - 1)];
}

export const MAJOR_LIFTS: { key: string; name: string }[] = [
  { key: 'hip-thrust', name: 'Hip Thrust' },
  { key: 'hack-squat', name: 'Hack Squat' },
  { key: 'romanian-deadlift', name: 'Romanian Deadlift' },
  { key: 'bulgarian-split-squat', name: 'Bulgarian Split Squat' },
  { key: 'seated-hamstring-curl', name: 'Seated Hamstring Curl' },
  { key: 'assisted-pull-up', name: 'Assisted Pull-Up' },
  { key: 'chest-supported-row', name: 'Chest-Supported Row' },
];

export const ENCOURAGEMENTS: { text: string; source?: string }[] = [
  { text: 'Strength and honour are her clothing.', source: 'Proverbs 31:25 KJV' },
  { text: 'Consistency over perfection.' },
  { text: 'She girdeth her loins with strength, and strengtheneth her arms.', source: 'Proverbs 31:17 KJV' },
  { text: 'Small faithful choices become visible strength.' },
  { text: 'I can do all things through Christ which strengtheneth me.', source: 'Philippians 4:13 KJV' },
  { text: 'Recovery is part of becoming stronger.' },
  { text: 'They that wait upon the LORD shall renew their strength.', source: 'Isaiah 40:31 KJV' },
  { text: 'Your body is learning what you repeatedly ask it to do.' },
  { text: 'He giveth power to the faint; and to them that have no might he increaseth strength.', source: 'Isaiah 40:29 KJV' },
  { text: 'You do not need a perfect day. You need another faithful one.' },
  { text: 'Let us not be weary in well doing.', source: 'Galatians 6:9 KJV' },
  { text: 'Slow and steady still arrives.' },
  { text: 'This is the day which the LORD hath made; we will rejoice and be glad in it.', source: 'Psalm 118:24 KJV' },
  { text: 'Show up gently. Then show up again.' },
];
