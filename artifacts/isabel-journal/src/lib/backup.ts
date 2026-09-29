import { DEFAULT_SETTINGS, type DayEntry, type ExerciseLog, type Mark, type Settings, type SetLog } from './types';
import type { WorkoutNum } from './program';
import { nextSession, type Days } from './logic';
import { toKey } from './dates';

export const BACKUP_APP = 'isabels-fall-strength-journal';
export const BACKUP_VERSION = 1;
export const INVALID_BACKUP = 'This does not appear to be a valid Isabel’s Strength Journal backup.';

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
const str = (v: unknown) => (typeof v === 'string' ? v : '');
const mark = (v: unknown): Mark | undefined => (v === 'done' || v === 'missed' ? v : undefined);
const marks = (v: unknown): Record<string, Mark> => {
  const o: Record<string, Mark> = {};
  if (isObj(v)) for (const [k, val] of Object.entries(v)) { const m = mark(val); if (m) o[k] = m; }
  return o;
};

function fail(): never {
  throw new Error(INVALID_BACKUP);
}

function normalizeDay(raw: unknown): DayEntry {
  if (!isObj(raw) || typeof raw.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(raw.date)) fail();
  const d: DayEntry = {
    date: raw.date,
    morningItems: marks(raw.morningItems),
    morningNotes: str(raw.morningNotes),
    notes: str(raw.notes),
    updatedAt: str(raw.updatedAt) || new Date().toISOString(),
  };
  if (raw.morning === 'yes' || raw.morning === 'no') d.morning = raw.morning;
  if (raw.trained === 'yes' || raw.trained === 'no') d.trained = raw.trained;
  if (raw.dayType === 'planned' || raw.dayType === 'needed' || raw.dayType === 'skipped') d.dayType = raw.dayType;
  if (raw.workout !== undefined && raw.workout !== null) {
    const w = raw.workout;
    if (!isObj(w) || ![1, 2, 3, 4, 5].includes(w.num as number)) fail();
    const exercises: Record<string, ExerciseLog> = {};
    if (isObj(w.exercises)) {
      for (const [k, e] of Object.entries(w.exercises)) {
        if (!isObj(e)) fail();
        const sets: SetLog[] = Array.isArray(e.sets)
          ? e.sets.map((s) => (isObj(s) ? { reps: str(s.reps), weight: str(s.weight) } : { reps: '', weight: '' }))
          : [];
        exercises[k] = { sets, status: mark(e.status), ...(typeof e.choice === 'string' ? { choice: e.choice } : {}) };
      }
    }
    d.workout = {
      num: w.num as WorkoutNum,
      status: w.status === 'completed' ? 'completed' : 'in_progress',
      startedAt: str(w.startedAt) || d.updatedAt,
      ...(typeof w.completedAt === 'string' ? { completedAt: w.completedAt } : {}),
      prep: marks(w.prep),
      exercises,
      notes: str(w.notes),
      ...(isObj(w.run)
        ? {
            run: {
              status: mark(w.run.status),
              mode: w.run.mode === 'continuous' || w.run.mode === 'runwalk' ? w.run.mode : undefined,
              roundsCompleted: str(w.run.roundsCompleted),
              totalTime: str(w.run.totalTime),
              distance: str(w.run.distance),
              runInterval: str(w.run.runInterval),
              walkInterval: str(w.run.walkInterval),
              rounds: str(w.run.rounds),
              notes: str(w.run.notes),
            },
          }
        : {}),
    };
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
  if (!isObj(data) || data.app !== BACKUP_APP || typeof data.version !== 'number' || data.version > BACKUP_VERSION) fail();
  if (!Array.isArray(data.days)) fail();
  const days = data.days.map(normalizeDay);
  const seen = new Set<string>();
  for (const d of days) {
    if (seen.has(d.date)) fail();
    seen.add(d.date);
  }
  const settings: Settings = {
    ...DEFAULT_SETTINGS,
    ...(isObj(data.settings) && typeof data.settings.showMessages === 'boolean' ? { showMessages: data.settings.showMessages } : {}),
  };
  return { days, settings };
}
