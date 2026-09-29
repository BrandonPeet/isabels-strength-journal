export const START_KEY = '2026-09-28';
export const END_KEY = '2027-09-28';

export function toKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

export function addDays(key: string, n: number): string {
  const d = fromKey(key);
  d.setDate(d.getDate() + n);
  return toKey(d);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((fromKey(b).getTime() - fromKey(a).getTime()) / 86400000);
}

export const TOTAL_WEEKS = Math.floor(daysBetween(START_KEY, END_KEY) / 7) + 1;

export function weekOf(key: string): number {
  return Math.floor(daysBetween(START_KEY, key) / 7) + 1;
}

export function dayOfWeek(key: string): number {
  return ((fromKey(key).getDay() + 6) % 7) + 1;
}

export function weekRange(week: number): { start: string; end: string; days: string[] } {
  const start = addDays(START_KEY, (week - 1) * 7);
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const k = addDays(start, i);
    if (k <= END_KEY) days.push(k);
  }
  return { start, end: days[days.length - 1], days };
}

export function inRange(key: string): boolean {
  return key >= START_KEY && key <= END_KEY;
}

export function clampToJournal(key: string): string {
  if (key < START_KEY) return START_KEY;
  if (key > END_KEY) return END_KEY;
  return key;
}

const fmt = (key: string, o: Intl.DateTimeFormatOptions) => fromKey(key).toLocaleDateString('en-US', o);

export const fmtLong = (k: string) => fmt(k, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
export const fmtTab = (k: string) => fmt(k, { weekday: 'short', month: 'short', day: 'numeric' });
export const fmtMonthDay = (k: string) => fmt(k, { month: 'long', day: 'numeric' });
export const fmtShortMD = (k: string) => fmt(k, { month: 'short', day: 'numeric' });
export const fmtMonthYear = (k: string) => fmt(k, { month: 'long', year: 'numeric' });
export const fmtWeekday = (k: string) => fmt(k, { weekday: 'short' });
