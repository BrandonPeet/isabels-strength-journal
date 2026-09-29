import assert from 'node:assert/strict';
import { test } from 'node:test';
import { nextSession, unfinishedBefore, weekStats, workoutForDate, type Days } from './logic';
import { END_KEY, START_KEY, TOTAL_WEEKS, dayOfWeek, fmtLong, inRange, weekOf, weekRange } from './dates';
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

test('September 28 is Monday Day 1 and starts the new year', () => {
  assert.equal(START_KEY, '2026-09-28');
  assert.equal(fmtLong(START_KEY), 'Monday, September 28, 2026');
  assert.equal(dayOfWeek(START_KEY), 1);
  assert.equal(weekOf(START_KEY), 1);
});

test('saved September 29 stays Tuesday Day 2 on its original date', () => {
  const existing = day('2026-09-29', workout(1, 'completed'));
  const days: Days = { [existing.date]: existing };
  assert.equal(fmtLong(existing.date), 'Tuesday, September 29, 2026');
  assert.equal(dayOfWeek(existing.date), 2);
  assert.equal(days['2026-09-29'], existing);
  assert.equal(days['2026-09-28'], undefined);
});

test('October 4 is Sunday Day 7 at the end of week 1', () => {
  assert.equal(fmtLong('2026-10-04'), 'Sunday, October 4, 2026');
  assert.equal(dayOfWeek('2026-10-04'), 7);
  assert.deepEqual(weekRange(1).days, [
    '2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01',
    '2026-10-02', '2026-10-03', '2026-10-04',
  ]);
});

test('October 5 starts week 2 on Monday Day 1', () => {
  assert.equal(fmtLong('2026-10-05'), 'Monday, October 5, 2026');
  assert.equal(dayOfWeek('2026-10-05'), 1);
  assert.equal(weekOf('2026-10-05'), 2);
  assert.deepEqual(weekRange(2).days, [
    '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08',
    '2026-10-09', '2026-10-10', '2026-10-11',
  ]);
});

const recoveryDay = (date: string): DayEntry => ({
  date, trained: 'no', dayType: 'needed', morningItems: {}, morningNotes: '', notes: '', updatedAt: '',
});

test('two recovery days anywhere in a Monday-Sunday week use 2 of 2 without missed consistency', () => {
  const days: Days = {
    '2026-09-30': recoveryDay('2026-09-30'),
    '2026-10-02': recoveryDay('2026-10-02'),
  };
  assert.equal(weekStats(days, 1).recovery, 2);
  assert.equal(weekStats(days, 1).missedConsistency, 0);
});

test('third recovery day in the same Monday-Sunday week counts as one missed consistency day', () => {
  const days: Days = Object.fromEntries(['2026-09-30', '2026-10-02', '2026-10-04'].map((date) => [date, recoveryDay(date)]));
  assert.equal(weekStats(days, 1).recovery, 3);
  assert.equal(weekStats(days, 1).extraRecovery, 1);
  assert.equal(weekStats(days, 1).missedConsistency, 1);
});

test('next Monday resets recovery allowance and weekly workouts', () => {
  const days: Days = {
    '2026-10-04': recoveryDay('2026-10-04'),
    '2026-10-03': day('2026-10-03', workout(1, 'completed')),
  };
  assert.equal(weekStats(days, 1).recovery, 1);
  assert.equal(weekStats(days, 2).recovery, 0);
  assert.equal(weekStats(days, 2).workouts, 0);
});

test('rest days do not advance the workout sequence', () => {
  const days: Days = {
    '2026-09-28': day('2026-09-28', workout(1, 'completed')),
    '2026-09-29': recoveryDay('2026-09-29'),
  };
  assert.equal(workoutForDate(days, '2026-09-30'), 2);
  assert.equal(nextSession(days, '2026-09-30'), 2);
});

test('new Monday does not reset workout sequence without a fifth completed workout', () => {
  const days: Days = { '2026-10-04': day('2026-10-04', workout(3, 'completed')) };
  assert.equal(workoutForDate(days, '2026-10-05'), 4);
  assert.equal(nextSession(days, '2026-10-05'), 4);
});

test('weekly report stats exclude adjacent weeks even when crossing a month boundary', () => {
  const days: Days = {
    '2026-10-04': recoveryDay('2026-10-04'),
    '2026-10-05': day('2026-10-05', workout(1, 'completed')),
    '2026-10-11': recoveryDay('2026-10-11'),
    '2026-10-12': day('2026-10-12', workout(2, 'completed')),
  };
  assert.deepEqual([weekStats(days, 1).workouts, weekStats(days, 1).recovery], [0, 1]);
  assert.deepEqual([weekStats(days, 2).workouts, weekStats(days, 2).recovery], [1, 1]);
  assert.deepEqual([weekStats(days, 3).workouts, weekStats(days, 3).recovery], [1, 0]);
});

test('Monday-Sunday periods stay aligned across year boundary and final partial week', () => {
  assert.deepEqual([weekRange(14).start, weekRange(14).end], ['2026-12-28', '2027-01-03']);
  assert.equal(dayOfWeek('2027-01-03'), 7);
  assert.equal(dayOfWeek('2027-01-04'), 1);
  assert.equal(END_KEY, '2027-09-28');
  assert.equal(weekRange(TOTAL_WEEKS).start, '2027-09-27');
  assert.equal(weekRange(TOTAL_WEEKS).end, END_KEY);
  assert.equal(inRange('2027-09-29'), false);
});