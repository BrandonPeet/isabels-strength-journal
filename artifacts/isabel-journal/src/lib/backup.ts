import { DEFAULT_SETTINGS, type DayEntry, type ExerciseLog, type Mark, type Settings, type SetLog } from './types';
import { MORNING_ROUTINE, exerciseSlots, prepItems, type WorkoutNum } from './program';
import { nextSession, type Days } from './logic';
import { END_KEY, START_KEY, toKey } from './dates';

export const BACKUP_APP = 'isabels-fall-strength-journal';
export const BACKUP_VERSION = 1;
export const INVALID_BACKUP = 'This does not appear to be a valid Isabel’s Strength Journal backup. Your current journal has not been changed.';

export function buildBackup(days: Days, settings: Settings) {
  const list = Object.values(days).sort((a, b) => a.date.localeCompare(b.date));
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    settings,
    sequence: { nextWorkout: nextSession(days, toKey(new Date())) },
    days: list,
  };
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

function fail(): never {
  throw new Error(INVALID_BACKUP);
}

/** Missing fields from older backups receive defaults; present fields must be valid. */
function optionalString(obj: Record<string, unknown>, key: string, fallback = ''): string {
  if (!(key in obj)) return fallback;
  if (typeof obj[key] !== 'string') fail();
  return obj[key] as string;
}

function optionalEnum<T extends string>(obj: Record<string, unknown>, key: string, values: readonly T[]): T | undefined {
  if (!(key in obj)) return undefined;
  if (!values.includes(obj[key] as T)) fail();
  return obj[key] as T;
}

function optionalMarkMap(v: unknown, validKeys: Set<string>): Record<string, Mark> {
  if (v === undefined) return {};
  if (!isObj(v)) fail();
  const out: Record<string, Mark> = {};
  for (const [key, value] of Object.entries(v)) {
    if (!validKeys.has(key) || (value !== 'done' && value !== 'missed')) fail();
    out[key] = value;
  }
  return out;
}

function validDate(key: unknown): key is string {
  if (typeof key !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(key) || key < START_KEY || key > END_KEY) return false;
  const year = Number(key.slice(0, 4));
  const month = Number(key.slice(5, 7));
  const day = Number(key.slice(8, 10));
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() + 1 === month && date.getUTCDate() === day;
}

const workoutNums = [1, 2, 3, 4, 5];

function normalizeDay(raw: unknown): DayEntry {
  if (!isObj(raw) || !validDate(raw.date)) fail();
  const d: DayEntry = {
    date: raw.date,
    morningItems: optionalMarkMap(raw.morningItems, new Set(MORNING_ROUTINE.map((item) => item.id))),
    morningNotes: optionalString(raw, 'morningNotes'),
    notes: optionalString(raw, 'notes'),
    updatedAt: optionalString(raw, 'updatedAt', new Date().toISOString()),
  };
  d.morning = optionalEnum(raw, 'morning', ['yes', 'no']);
  d.trained = optionalEnum(raw, 'trained', ['yes', 'no']);
  d.dayType = optionalEnum(raw, 'dayType', ['planned', 'needed', 'skipped']);

  if ('workout' in raw) {
    const w = raw.workout;
    if (!isObj(w) || !workoutNums.includes(w.num as number)) fail();
    const num = w.num as WorkoutNum;
    const slots = exerciseSlots(num);
    const byId = new Map(slots.map((slot) => [slot.id, slot]));
    const exercises: Record<string, ExerciseLog> = {};
    if ('exercises' in w && !isObj(w.exercises)) fail();
    if (isObj(w.exercises)) {
      for (const [id, value] of Object.entries(w.exercises)) {
        const slot = byId.get(id);
        if (!slot || !isObj(value)) fail();
        if (!Array.isArray(value.sets)) fail();
        const sets: SetLog[] = value.sets.map((set) => {
          if (!isObj(set) || !('reps' in set) || !('weight' in set)) fail();
          return { reps: optionalString(set, 'reps'), weight: optionalString(set, 'weight') };
        });
        const status = optionalEnum(value, 'status', ['done', 'missed']);
        const choice = optionalString(value, 'choice');
        if ('choice' in value && (!slot.options || !slot.options.some((option) => option.key === choice))) fail();
        exercises[id] = { sets, ...(status ? { status } : {}), ...('choice' in value ? { choice } : {}) };
      }
    }
    const status = optionalEnum(w, 'status', ['completed', 'in_progress']) ?? 'in_progress';
    if ('leftUnfinished' in w && typeof w.leftUnfinished !== 'boolean') fail();
    d.workout = {
      num,
      status,
      startedAt: optionalString(w, 'startedAt', d.updatedAt),
      ...('completedAt' in w ? { completedAt: optionalString(w, 'completedAt') } : {}),
      ...('leftUnfinished' in w ? { leftUnfinished: w.leftUnfinished as boolean } : {}),
      prep: optionalMarkMap(w.prep, new Set(prepItems(num).map((item) => item.id))),
      exercises,
      notes: optionalString(w, 'notes'),
    };
    if ('run' in w) {
      if (!isObj(w.run) || num !== 3) fail();
      const run = w.run;
      d.workout.run = {
        status: optionalEnum(run, 'status', ['done', 'missed']),
        mode: optionalEnum(run, 'mode', ['continuous', 'runwalk']),
        roundsCompleted: optionalString(run, 'roundsCompleted'),
        totalTime: optionalString(run, 'totalTime'),
        distance: optionalString(run, 'distance'),
        runInterval: optionalString(run, 'runInterval'),
        walkInterval: optionalString(run, 'walkInterval'),
        rounds: optionalString(run, 'rounds'),
        notes: optionalString(run, 'notes'),
      };
    }
  }
  return d;
}

export function parseBackup(text: string): { days: DayEntry[]; settings: Settings } {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    fail();
  }
  if (!isObj(data) || data.app !== BACKUP_APP) fail();
  if ('version' in data && (!Number.isInteger(data.version) || (data.version as number) < 1 || (data.version as number) > BACKUP_VERSION)) fail();
  if ('exportedAt' in data && typeof data.exportedAt !== 'string') fail();
  if ('sequence' in data) {
    if (!isObj(data.sequence) || !workoutNums.includes(data.sequence.nextWorkout as number)) fail();
  }
  if (!Array.isArray(data.days)) fail();
  const days = data.days.map(normalizeDay);
  const seen = new Set<string>();
  for (const d of days) {
    if (seen.has(d.date)) fail();
    seen.add(d.date);
  }
  if ('settings' in data && !isObj(data.settings)) fail();
  if (isObj(data.settings) && 'showMessages' in data.settings && typeof data.settings.showMessages !== 'boolean') fail();
  const settings: Settings = {
    ...DEFAULT_SETTINGS,
    ...(isObj(data.settings) && 'showMessages' in data.settings
      ? { showMessages: data.settings.showMessages as boolean }
      : {}),
  };
  return { days, settings };
}