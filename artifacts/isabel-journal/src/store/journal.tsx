import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { loadAll, putDays, putSettings, replaceAll, requestPersistence } from '@/lib/db';
import { DEFAULT_SETTINGS, emptyDay, type DayEntry, type Settings } from '@/lib/types';
import type { Days } from '@/lib/logic';
import { useToday } from '@/hooks/use-today';
import { END_KEY, START_KEY, clampToJournal, inRange, toKey } from '@/lib/dates';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface JournalCtx {
  days: Days;
  settings: Settings;
  today: string;
  /** Journal-clamped today (Day 1 before start, final day after end). */
  journalToday: string;
  archived: boolean;
  viewDate: string;
  setViewDate: (d: string | null) => void;
  updateDay: (date: string, fn: (d: DayEntry) => DayEntry) => void;
  updateSettings: (s: Partial<Settings>) => void;
  restore: (days: DayEntry[], settings: Settings) => Promise<void>;
  saveStatus: SaveStatus;
  saveError: string | null;
  retrySave: () => void;
  isEditable: (date: string) => boolean;
}

const Ctx = createContext<JournalCtx | null>(null);

export function useJournal() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useJournal outside provider');
  return c;
}

type LoadState = { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'ready' };

export function JournalProvider({ children, loading, failed }: {
  children: ReactNode;
  loading: ReactNode;
  failed: (message: string, retry: () => void) => ReactNode;
}) {
  const [load, setLoad] = useState<LoadState>({ kind: 'loading' });
  const [days, setDays] = useState<Days>({});
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [viewOverride, setViewOverride] = useState<string | null>(null);
  const [today, refreshToday] = useToday();

  const daysRef = useRef<Days>({});
  const settingsRef = useRef<Settings>(DEFAULT_SETTINGS);
  const pending = useRef(new Map<string, DayEntry>());
  const pendingSettings = useRef<Settings | null>(null);
  const flushing = useRef(false);
  const restoringRef = useRef(false);
  const readyRef = useRef(false);

  const doLoad = useCallback(async () => {
    setLoad({ kind: 'loading' });
    try {
      const { days: list, settings: s } = await loadAll();
      const map: Days = {};
      list.forEach((d) => (map[d.date] = d));
      daysRef.current = map;
      setDays(map);
      if (s) {
        settingsRef.current = { ...DEFAULT_SETTINGS, ...s };
        setSettings(settingsRef.current);
      }
      readyRef.current = true;
      setLoad({ kind: 'ready' });
      void requestPersistence();
    } catch (e) {
      // Never overwrite storage after a failed read — writes stay disabled until load succeeds.
      readyRef.current = false;
      setLoad({ kind: 'error', message: e instanceof Error ? e.message : String(e) });
    }
  }, []);

  useEffect(() => {
    void doLoad();
  }, [doLoad]);

  const flush = useCallback(async () => {
    if (flushing.current || !readyRef.current) return;
    flushing.current = true;
    setSaveStatus('saving');
    try {
      while (pending.current.size || pendingSettings.current) {
        const batch = [...pending.current.values()];
        pending.current.clear();
        const s = pendingSettings.current;
        pendingSettings.current = null;
        try {
          if (batch.length) await putDays(batch);
          if (s) await putSettings(s);
        } catch (err) {
          batch.forEach((b) => {
            if (!pending.current.has(b.date)) pending.current.set(b.date, b);
          });
          if (s && !pendingSettings.current) pendingSettings.current = s;
          throw err;
        }
      }
      saveErrorRef.current = null;
      setSaveError(null);
      setSaveStatus('saved');
    } catch (err) {
      saveErrorRef.current = err instanceof Error ? err.message : 'Could not save to this device.';
      setSaveError(saveErrorRef.current);
      setSaveStatus('error');
    } finally {
      flushing.current = false;
    }
    if ((pending.current.size || pendingSettings.current) && !saveErrorRef.current) void flush();
  }, []);
  const saveErrorRef = useRef<string | null>(null);
  saveErrorRef.current = saveError;

  const updateDay = useCallback(
    (date: string, fn: (d: DayEntry) => DayEntry) => {
      if (!readyRef.current || restoringRef.current || !inRange(date)) return;
      const cur = daysRef.current[date] ?? emptyDay(date);
      const next = { ...fn(cur), date, updatedAt: new Date().toISOString() };
      daysRef.current = { ...daysRef.current, [date]: next };
      setDays(daysRef.current);
      pending.current.set(date, next);
      saveErrorRef.current = null;
      void flush();
    },
    [flush],
  );

  const updateSettings = useCallback(
    (s: Partial<Settings>) => {
      if (!readyRef.current || restoringRef.current) return;
      const n = { ...settingsRef.current, ...s };
      settingsRef.current = n;
      setSettings(n);
      pendingSettings.current = n;
      try {
        localStorage.setItem('isabel-journal-settings', JSON.stringify(n));
      } catch {
        /* ignore */
      }
      queueMicrotask(() => void flush());
    },
    [flush],
  );

  const restore = useCallback(async (list: DayEntry[], s: Settings) => {
    if (restoringRef.current) throw new Error('A journal replacement is already in progress.');
    restoringRef.current = true;
    setRestoring(true);
    try {
      // Finish existing writes before replacing the data. If they cannot be saved,
      // do not replace anything: the queued entries remain available for Retry.
      while (flushing.current) await new Promise((r) => setTimeout(r, 30));
      if (pending.current.size || pendingSettings.current) {
        saveErrorRef.current = null;
        await flush();
      }
      if (pending.current.size || pendingSettings.current || saveErrorRef.current) {
        throw new Error(saveErrorRef.current ?? 'Could not save pending journal changes before import. Retry saving first.');
      }
      setSaveStatus('saving');
      await replaceAll(list, s);
      const map: Days = {};
      list.forEach((d) => (map[d.date] = d));
      daysRef.current = map;
      settingsRef.current = s;
      setDays(map);
      setSettings(s);
      saveErrorRef.current = null;
      setSaveError(null);
      setSaveStatus('saved');
      setViewOverride(null);
    } catch (e) {
      saveErrorRef.current = e instanceof Error ? e.message : 'Restore failed.';
      setSaveStatus('error');
      setSaveError(saveErrorRef.current);
      throw e;
    } finally {
      restoringRef.current = false;
      setRestoring(false);
    }
  }, [flush]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (pending.current.size || pendingSettings.current || flushing.current || restoringRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);

  const journalToday = clampToJournal(today);
  const archived = today > END_KEY;

  // An explicitly selected current day follows midnight; a historical selection stays put.
  const viewDate = viewOverride ?? journalToday;
  const setViewDate = useCallback((d: string | null) => {
    refreshToday(); // Return to Today must read the device clock, not a stale interval value.
    setViewOverride(d === null || d === clampToJournal(toKey(new Date())) ? null : d);
  }, [refreshToday]);

  const isEditable = useCallback(
    (date: string) => !restoring && !archived && date >= START_KEY && date <= END_KEY && date <= journalToday,
    [restoring, archived, journalToday],
  );

  const value = useMemo<JournalCtx>(
    () => ({
      days, settings, today, journalToday, archived, viewDate, setViewDate, updateDay, updateSettings, restore,
      saveStatus, saveError, retrySave: () => { if (!restoringRef.current) { saveErrorRef.current = null; void flush(); } }, isEditable,
    }),
    [days, settings, today, journalToday, archived, viewDate, setViewDate, updateDay, updateSettings, restore, saveStatus, saveError, flush, isEditable],
  );

  if (load.kind === 'loading') return <>{loading}</>;
  if (load.kind === 'error') return <>{failed(load.message, () => void doLoad())}</>;
  return (
    <Ctx.Provider value={value}>
      <div className="contents" inert={restoring}>{children}</div>
      {restoring && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center px-5" role="status" aria-live="assertive" aria-busy="true">
          <div className="paper-card p-6 text-center text-bark font-semibold">Replacing journal data… Please keep this page open.</div>
        </div>
      )}
    </Ctx.Provider>
  );
}
