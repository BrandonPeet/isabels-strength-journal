import assert from 'node:assert/strict';
import { test } from 'node:test';
import { nextSession, unfinishedBefore, weekStats, workoutForDate, type Days } from './logic';
import type { DayEntry, WorkoutLog } from './types';

const workout = (num: WorkoutLog['num'], status: WorkoutLog['status'], leftUnfinished = false): WorkoutLog => ({
  num, status, leftUnfinished, startedAt: '2026-10-01T12:00:00.000Z',
  prep: {}, exercises: { w2e1: { sets: [{ reps: '8', weight: '30' }] } }, notes: 'Saved notes',
});

const day = (date: string, w: WorkoutLog): DayEntry => ({
  date, trained: 'yes', workout: w, morningItems: {}, morningNotes: '', notes: '', updatedAt: '2026-10-01T12:00:00.000Z',
});

test('unfinished prior date stays the next workout, with saved exercise data on its original date', () => {
  const days: Days = {
    '2026-09-30': day('2026-09-30', workout(1, 'completed')),
    '2026-10-01': day('2026-10-01', workout(2, 'in_progress')),
  };
  assert.equal(nextSession(days, '2026-10-01'), 2);
  assert.equal(nextSession(days, '2026-10-02'), 2);
  assert.equal(unfinishedBefore(days, '2026-10-01'), undefined);
  assert.equal(unfinishedBefore(days, '2026-10-02'), days['2026-10-01']);
  assert.deepEqual(days['2026-10-01'].workout?.exercises.w2e1.sets, [{ reps: '8', weight: '30' }]);
  days['2026-10-01'] = day('2026-10-01', { ...days['2026-10-01'].workout!, status: 'completed' });
  assert.equal(unfinishedBefore(days, '2026-10-02'), undefined);
  assert.equal(nextSession(days, '2026-10-02'), 3);
});

test('leaving unfinished retains the original record but does not count or advance', () => {
  const days: Days = {
    '2026-09-30': day('2026-09-30', workout(1, 'completed')),
    '2026-10-01': day('2026-10-01', workout(2, 'in_progress', true)),
  };
  assert.equal(unfinishedBefore(days, '2026-10-02'), undefined);
  assert.equal(nextSession(days, '2026-10-02'), 2);
  assert.equal(workoutForDate(days, '2026-10-02'), 2);
  assert.equal(weekStats(days, 1).workouts, 1);
  assert.equal(days['2026-10-01'].workout?.notes, 'Saved notes');
});