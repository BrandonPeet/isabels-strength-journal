import type { WorkoutNum } from './program';

export type Mark = 'done' | 'missed';

export interface SetLog {
  reps: string;
  weight: string;
}

export interface ExerciseLog {
  status?: Mark;
  sets: SetLog[];
  choice?: string;
}

export interface RunLog {
  status?: Mark;
  roundsCompleted?: string;
  mode?: 'continuous' | 'runwalk';
  totalTime?: string;
  distance?: string;
  runInterval?: string;
  walkInterval?: string;
  rounds?: string;
  notes?: string;
}

export interface WorkoutLog {
  /** Identity is fixed when the session starts and never relabeled. */
  num: WorkoutNum;
  status: 'in_progress' | 'completed';
  startedAt: string;
  completedAt?: string;
  /** Archived without finishing; does not advance the sequence. */
  leftUnfinished?: boolean;
  prep: Record<string, Mark>;
  exercises: Record<string, ExerciseLog>;
  run?: RunLog;
  notes: string;
}

export type DayType = 'planned' | 'needed' | 'skipped';

export interface DayEntry {
  date: string;
  morning?: 'yes' | 'no';
  morningItems: Record<string, Mark>;
  morningNotes: string;
  trained?: 'yes' | 'no';
  dayType?: DayType;
  workout?: WorkoutLog;
  notes: string;
  updatedAt: string;
}

export interface Settings {
  showMessages: boolean;
}

export const DEFAULT_SETTINGS: Settings = { showMessages: true };

export function emptyDay(date: string): DayEntry {
  return { date, morningItems: {}, morningNotes: '', notes: '', updatedAt: new Date().toISOString() };
}

export function dayHasContent(d: DayEntry | undefined): boolean {
  if (!d) return false;
  return !!(d.morning || d.trained || d.notes.trim() || d.morningNotes.trim() || d.workout);
}
