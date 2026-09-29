import { MORNING_ROUTINE, exerciseSlots, exerciseName, type WorkoutNum, type ExerciseSlot } from './program';
import type { DayEntry, ExerciseLog, SetLog } from './types';
import { weekRange } from './dates';

export type Days = Record<string, DayEntry>;

export const sortedDays = (days: Days) => Object.values(days).sort((a, b) => a.date.localeCompare(b.date));

export const isCompletedWorkout = (d?: DayEntry) => !!d && d.trained === 'yes' && d.workout?.status === 'completed';
export const isRecovery = (d?: DayEntry) => !!d && d.trained === 'no' && (d.dayType === 'planned' || d.dayType === 'needed');
export const isSkipped = (d?: DayEntry) => !!d && d.trained === 'no' && d.dayType === 'skipped';

const nextAfter = (n: WorkoutNum): WorkoutNum => ((n % 5) + 1) as WorkoutNum;

/** Oldest unresolved session strictly before the selected day. */
export function unfinishedBefore(days: Days, date: string): DayEntry | undefined {
  return sortedDays(days).find((d) =>
    d.date < date && d.trained === 'yes' && d.workout?.status === 'in_progress' && !d.workout.leftUnfinished,
  );
}

/** Workout to start on `date`, derived from completed workouts strictly before it (chronological). */
export function workoutForDate(days: Days, date: string): WorkoutNum {
  let last: WorkoutNum | null = null;
  for (const d of sortedDays(days)) {
    if (d.date >= date) break;
    if (isCompletedWorkout(d)) last = d.workout!.num;
  }
  return last ? nextAfter(last) : 1;
}

/** The session Isabel should do next as of `today`. */
export function nextSession(days: Days, today: string): WorkoutNum {
  const t = days[today];
  if (t?.trained === 'yes' && t.workout?.status === 'in_progress' && !t.workout.leftUnfinished) return t.workout.num;
  const unfinished = unfinishedBefore(days, today);
  if (unfinished?.workout) return unfinished.workout.num;
  let last: WorkoutNum | null = null;
  for (const d of sortedDays(days)) if (d.date <= today && isCompletedWorkout(d)) last = d.workout!.num;
  // also include any completed later entries (e.g. archive) — chronological last wins
  return last ? nextAfter(last) : 1;
}

export function effectiveKey(slot: ExerciseSlot, log?: ExerciseLog): string {
  if (slot.options) return log?.choice ?? slot.options[0].key;
  return slot.key;
}

const hasData = (log?: ExerciseLog) => !!log && log.sets.some((s) => s.reps.trim() || s.weight.trim());

export interface ExerciseInstance {
  date: string;
  key: string;
  sets: SetLog[];
  status?: 'done' | 'missed';
}

/** All logged instances of every exercise, chronologically. Only counts days where training happened. */
export function exerciseInstances(days: Days): ExerciseInstance[] {
  const out: ExerciseInstance[] = [];
  for (const d of sortedDays(days)) {
    if (d.trained !== 'yes' || !d.workout) continue;
    for (const slot of exerciseSlots(d.workout.num)) {
      const log = d.workout.exercises[slot.id];
      if (!hasData(log)) continue;
      out.push({ date: d.date, key: effectiveKey(slot, log), sets: log!.sets, status: log!.status });
    }
  }
  return out;
}

export function previousInstance(days: Days, key: string, beforeDate: string): ExerciseInstance | null {
  const all = exerciseInstances(days).filter((i) => i.key === key && i.date < beforeDate);
  return all.length ? all[all.length - 1] : null;
}

const num = (s: string) => {
  const m = s.replace(',', '.').match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : NaN;
};

export interface TopSet {
  weight: number | null;
  reps: number | null;
  label: string;
}

export function topSet(sets: SetLog[]): TopSet | null {
  let best: { w: number; r: number; s: SetLog } | null = null;
  for (const s of sets) {
    if (!s.reps.trim() && !s.weight.trim()) continue;
    const w = num(s.weight);
    const r = num(s.reps);
    const W = isNaN(w) ? -1 : w;
    const R = isNaN(r) ? -1 : r;
    if (!best || W > best.w || (W === best.w && R > best.r)) best = { w: W, r: R, s };
  }
  if (!best) return null;
  return {
    weight: best.w >= 0 ? best.w : null,
    reps: best.r >= 0 ? best.r : null,
    label: formatSet(best.s),
  };
}

export function formatSet(s: SetLog): string {
  const reps = s.reps.trim();
  const weight = s.weight.trim();
  const r = reps ? (/^\d+(\.\d+)?$/.test(reps) ? `${reps} reps` : reps) : '—';
  if (!weight) return r;
  const w = /^\d+(\.\d+)?$/.test(weight) ? `${weight} lb` : weight;
  return `${r} @ ${w}`;
}

export function compactSet(t: TopSet | null): string {
  if (!t) return '—';
  if (t.weight !== null && t.reps !== null) return `${t.weight} lb × ${t.reps}`;
  return t.label;
}

function improved(prev: SetLog[], cur: SetLog[]): boolean {
  const a = topSet(prev);
  const b = topSet(cur);
  if (!a || !b) return false;
  const aw = a.weight ?? 0;
  const bw = b.weight ?? 0;
  if (bw > aw) return true;
  if (bw === aw && (b.reps ?? 0) > (a.reps ?? 0)) return true;
  return false;
}

export function morningPct(d?: DayEntry): number | null {
  if (!d?.morning) return null;
  if (d.morning === 'no') return 0;
  const done = MORNING_ROUTINE.filter((m) => d.morningItems[m.id] === 'done').length;
  return done / MORNING_ROUTINE.length;
}

export interface WeekStats {
  week: number;
  days: string[];
  morningPct: number | null;
  morningLogged: number;
  workouts: number;
  recovery: number;
  extraRecovery: number;
  skipped: number;
  missedConsistency: number;
  improved: string[];
  missedMorning: { name: string; count: number } | null;
  missedExercise: { name: string; count: number } | null;
}

export function recoveryIndex(days: Days, date: string, week: number): number {
  const { days: wd } = weekRange(week);
  let i = 0;
  for (const k of wd) {
    if (isRecovery(days[k])) i++;
    if (k === date) return i;
  }
  return i;
}

export function weekStats(days: Days, week: number): WeekStats {
  const { days: wd } = weekRange(week);
  const entries = wd.map((k) => days[k]).filter(Boolean) as DayEntry[];
  const pcts = entries.map(morningPct).filter((p): p is number => p !== null);
  const recovery = entries.filter(isRecovery).length;
  const skipped = entries.filter(isSkipped).length;
  const extra = Math.max(0, recovery - 2);

  const mm: Record<string, number> = {};
  for (const e of entries) {
    if (e.morning !== 'yes') continue;
    for (const m of MORNING_ROUTINE) if (e.morningItems[m.id] === 'missed') mm[m.name] = (mm[m.name] ?? 0) + 1;
  }
  const me: Record<string, number> = {};
  const improvedList: string[] = [];
  for (const e of entries) {
    if (e.trained !== 'yes' || !e.workout) continue;
    for (const slot of exerciseSlots(e.workout.num)) {
      const log = e.workout.exercises[slot.id];
      const key = effectiveKey(slot, log);
      if (log?.status === 'missed') me[exerciseName(key)] = (me[exerciseName(key)] ?? 0) + 1;
      if (hasData(log)) {
        const prev = previousInstance(days, key, e.date);
        if (prev && improved(prev.sets, log!.sets)) {
          const n = exerciseName(key);
          if (!improvedList.includes(n)) improvedList.push(n);
        }
      }
    }
  }
  const top = (o: Record<string, number>) => {
    const arr = Object.entries(o).sort((a, b) => b[1] - a[1]);
    return arr.length ? { name: arr[0][0], count: arr[0][1] } : null;
  };
  return {
    week,
    days: wd,
    morningPct: pcts.length ? pcts.reduce((a, b) => a + b, 0) / pcts.length : null,
    morningLogged: pcts.length,
    workouts: entries.filter(isCompletedWorkout).length,
    recovery,
    extraRecovery: extra,
    skipped,
    missedConsistency: skipped + extra,
    improved: improvedList,
    missedMorning: top(mm),
    missedExercise: top(me),
  };
}

export function weeklyFeedback(s: WeekStats, isCurrent: boolean): string[] {
  const out: string[] = [];
  const logged = s.days.length;
  if (s.morningLogged === 0 && s.workouts === 0 && s.recovery === 0 && s.skipped === 0) {
    return [isCurrent ? 'A fresh week. Start with the morning routine and let the rest follow.' : 'Nothing was logged this week. That is alright — every week is a new beginning.'];
  }
  if (s.workouts >= 5 && s.missedConsistency === 0) {
    out.push('Excellent week. Keep the same volume and continue trying to improve your logged reps or weight gradually.');
  } else if (s.workouts > 0) {
    const left = 5 - s.workouts;
    out.push(
      isCurrent && left > 0
        ? `You have completed ${s.workouts} of your 5 workouts so far. ${left === 1 ? 'One more session' : `${left} more sessions`} would round out the week.`
        : `You completed ${s.workouts} of your 5 workouts. Focus on completing the remaining ${left === 1 ? 'session' : 'sessions'} before adding extra work.`,
    );
  } else if (!isCurrent) {
    out.push('No workouts were finished this week. Next week, aim for just one — momentum is built one session at a time.');
  }
  if (s.extraRecovery > 0) {
    out.push(
      `You used ${s.recovery} recovery days this week. Two were planned, so ${s.extraRecovery === 1 ? 'one' : s.extraRecovery} counted toward missed-workout consistency. Rest when you need it.`,
    );
  } else if (s.recovery > 0 && out.length < 3) {
    out.push(`You took ${s.recovery} of your 2 planned recovery ${s.recovery === 1 ? 'day' : 'days'}. Recovery is part of becoming stronger.`);
  }
  if (s.missedMorning && out.length < 3) {
    out.push(`You missed ${s.missedMorning.name.toLowerCase()} most often this week. Try doing it immediately after your treadmill walk.`);
  } else if (s.morningPct !== null && s.morningPct >= 0.85 && out.length < 3) {
    out.push(`Your morning routine was ${Math.round(s.morningPct * 100)}% complete. That quiet consistency adds up.`);
  }
  if (s.improved.length && out.length < 3) {
    out.push(`You logged improvements in ${s.improved.slice(0, 2).join(' and ')}${s.improved.length > 2 ? ` and ${s.improved.length - 2} more` : ''}.`);
  }
  void logged;
  return out.slice(0, 3);
}
