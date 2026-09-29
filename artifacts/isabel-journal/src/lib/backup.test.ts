import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildBackup, INVALID_BACKUP, parseBackup } from './backup';
import type { DayEntry } from './types';

const day: DayEntry = {
  date: '2026-09-29',
  morning: 'yes',
  morningItems: { m1: 'done' },
  morningNotes: 'Felt good',
  trained: 'yes',
  workout: {
    num: 3,
    status: 'in_progress',
    startedAt: '2026-09-29T12:00:00.000Z',
    leftUnfinished: true,
    prep: { w3g1: 'done' },
    exercises: { w3e1: { sets: [{ reps: '8', weight: '50 lb' }], status: 'done' } },
    run: { mode: 'runwalk', roundsCompleted: '3', notes: 'Easy pace' },
    notes: 'Training note',
  },
  notes: 'Day note',
  updatedAt: '2026-09-29T12:00:00.000Z',
};

const valid = () => buildBackup({ [day.date]: day }, { showMessages: false });
const clone = (): Record<string, any> => JSON.parse(JSON.stringify(valid()));
const invalid = (value: unknown) =>
  assert.throws(() => parseBackup(JSON.stringify(value)), (error: unknown) => error instanceof Error && error.message === INVALID_BACKUP);

test('real exported backup restores all saved fields, including unfinished workouts', () => {
  const parsed = parseBackup(JSON.stringify(valid()));
  assert.equal(parsed.settings.showMessages, false);
  assert.equal(parsed.days[0].date, day.date);
  assert.equal(parsed.days[0].morningNotes, day.morningNotes);
  assert.equal(parsed.days[0].notes, day.notes);
  assert.equal(parsed.days[0].workout?.notes, day.workout?.notes);
  assert.equal(parsed.days[0].workout?.leftUnfinished, true);
  assert.deepEqual(parsed.days[0].workout?.exercises.w3e1.sets, day.workout?.exercises.w3e1.sets);
  assert.equal(parsed.days[0].workout?.run?.roundsCompleted, '3');
});

test('older same-app backup may omit version, settings, sequence and new fields', () => {
  const backup = clone();
  delete backup.version;
  delete backup.settings;
  delete backup.sequence;
  delete backup.days[0].workout.leftUnfinished;
  assert.equal(parseBackup(JSON.stringify(backup)).days[0].workout?.num, 3);
  assert.equal(parseBackup(JSON.stringify(backup)).settings.showMessages, true);
});

test('rejects unrelated, malformed and future-version backups', () => {
  assert.throws(() => parseBackup('{'), { message: INVALID_BACKUP });
  invalid({ days: [] });
  for (const version of [0, 1.5, '1', 2, null]) {
    const backup = clone();
    backup.version = version;
    invalid(backup);
  }
});

test('rejects impossible, out-of-period and duplicate dates, without accepting any partial days', () => {
  for (const date of ['2026-09-31', '2027-02-29', '2026-09-27', '2027-09-30', '2026-9-29']) {
    const backup = clone();
    backup.days[0].date = date;
    invalid(backup);
  }
  const backup = clone();
  backup.days.push({ ...backup.days[0], date: '2026-09-30', notes: 3 });
  invalid(backup);
  backup.days[1] = { ...backup.days[0] };
  invalid(backup);
});

test('new first and final tracking dates are valid backup entries', () => {
  const backup = clone();
  backup.days = [
    { ...backup.days[0], date: '2026-09-28' },
    { ...backup.days[0], date: '2027-09-28' },
  ];
  assert.deepEqual(parseBackup(JSON.stringify(backup)).days.map((d) => d.date), ['2026-09-28', '2027-09-28']);
});

test('old final-day record survives export and reimport without changing its date or exercise data', () => {
  const old = { ...day, date: '2027-09-29', notes: 'Old final-day note' };
  const backup = buildBackup({ [old.date]: old, [day.date]: day }, { showMessages: false });
  const restored = parseBackup(JSON.stringify(backup));
  assert.deepEqual(restored.days.map((d) => d.date), ['2026-09-29', '2027-09-29']);
  assert.equal(restored.days[1].notes, old.notes);
  assert.deepEqual(restored.days[1].workout?.exercises, old.workout?.exercises);
  assert.deepEqual(parseBackup(JSON.stringify(buildBackup(
    Object.fromEntries(restored.days.map((d) => [d.date, d])), restored.settings,
  ))).days.map((d) => d.date), ['2026-09-29', '2027-09-29']);
});

test('rejects malformed supplied morning, recovery, workout, sets, notes and unfinished fields', () => {
  const changes: ((backup: Record<string, any>) => void)[] = [
    (b) => { b.days[0].morning = 'maybe'; },
    (b) => { b.days[0].morningItems.m1 = null; },
    (b) => { b.days[0].morningItems.unknown = 'done'; },
    (b) => { b.days[0].morningNotes = 12; },
    (b) => { b.days[0].trained = false; },
    (b) => { b.days[0].dayType = 'unknown'; },
    (b) => { b.days[0].notes = null; },
    (b) => { b.days[0].workout.num = 6; },
    (b) => { b.days[0].workout.status = 'finished'; },
    (b) => { b.days[0].workout.leftUnfinished = 'yes'; },
    (b) => { b.days[0].workout.prep.w3g1 = 'pending'; },
    (b) => { b.days[0].workout.exercises.unknown = { sets: [] }; },
    (b) => { delete b.days[0].workout.exercises.w3e1.sets; },
    (b) => { b.days[0].workout.exercises.w3e1.sets = {}; },
    (b) => { delete b.days[0].workout.exercises.w3e1.sets[0].reps; },
    (b) => { b.days[0].workout.exercises.w3e1.sets[0].reps = 8; },
    (b) => { b.days[0].workout.exercises.w3e1.sets[0].weight = null; },
    (b) => { b.days[0].workout.exercises.w3e1.status = 'pending'; },
    (b) => { b.days[0].workout.notes = []; },
    (b) => { b.days[0].workout.run.mode = 'sprint'; },
    (b) => { b.days[0].workout.run.roundsCompleted = 3; },
    (b) => { b.days[0].workout.run.notes = null; },
    (b) => { b.settings.showMessages = 'false'; },
    (b) => { b.sequence.nextWorkout = 0; },
    (b) => { b.sequence = null; },
  ];
  for (const change of changes) {
    const backup = clone();
    change(backup);
    invalid(backup);
  }
});