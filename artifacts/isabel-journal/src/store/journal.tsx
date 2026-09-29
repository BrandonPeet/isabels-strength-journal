import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { loadAll, putDays, putSettings, replaceAll, requestPersistence } from '@/lib/db';
import { DEFAULT_SETTINGS, emptyDay, type DayEntry, type Settings } from '@/lib/types';
import type { Days } from '@/lib/logic';
import { useToday } from '@/hooks/use-today';
import { END_KEY, START_KEY, clampToJournal } from '@/lib/dates';

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
  const [viewOverride, setViewOverride] = useState<string | null>(null);
  const today = useToday();

  const daysRef = useRef<Days>({});
  const pending = useRef(new Map<string, DayEntry>());
  const pendingSettings = useRef<Settings | null>(null);
  const flushing = useRef(false);
  const readyRef = useRef(false);

  const doLoad = useCallback(async () => {
    setLoad({ kind: 'loading' });
    try {
      const { days: list, settings: s } = await loadAll();
      const map: Days = {};
      list.forEach((d) => (map[d.date] = d));
      daysRef.current = map;
      setDays(map);
      if (s) setSettings({ ...DEFAULT_SETTINGS, ...s });
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
      setSaveError(null);
      setSaveStatus('saved');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save to this device.');
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
      if (!readyRef.current) return;
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
      setSettings((prev) => {
        const n = { ...prev, ...s };
        pendingSettings.current = n;
        try {
          localStorage.setItem('isabel-journal-settings', JSON.stringify(n));
        } catch {
          /* ignore */
        }
        queueMicrotask(() => void flush());
        return n;
      });
    },
    [flush],
  );

  const restore = useCallback(async (list: DayEntry[], s: Settings) => {
    // wait for in-flight writes, drop queued ones (they belong to the replaced journal)
    while (flushing.current) await new Promise((r) => setTimeout(r, 30));
    pending.current.clear();
    pendingSettings.current = null;
    setSaveStatus('saving');
    try {
      await replaceAll(list, s);
    } catch (e) {
      setSaveStatus('error');
      setSaveError(e instanceof Error ? e.message : 'Restore failed.');
      throw e;
    }
    const map: Days = {};
    list.forEach((d) => (map[d.date] = d));
    daysRef.current = map;
    setDays(map);
    setSettings(s);
    setSaveError(null);
    setSaveStatus('saved');
    setViewOverride(null);
  }, []);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (pending.current.size || flushing.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);

  const journalToday = clampToJournal(today);
  const archived = today > END_KEY;

  // If the chosen view date equals the journal's today, follow rollover automatically.
  const viewDate = viewOverride && viewOverride !== journalToday ? viewOverride : journalToday;
  const setViewDate = useCallback((d: string | null) => setViewOverride(d), []);

  const isEditable = useCallback(
    (date: string) => !archived && date >= START_KEY && date <= END_KEY && date <= journalToday,
    [archived, journalToday],
  );

  const value = useMemo<JournalCtx>(
    () => ({
      days, settings, today, journalToday, archived, viewDate, setViewDate, updateDay, updateSettings, restore,
      saveStatus, saveError, retrySave: () => { saveErrorRef.current = null; void flush(); }, isEditable,
    }),
    [days, settings, today, journalToday, archived, viewDate, setViewDate, updateDay, updateSettings, restore, saveStatus, saveError, flush, isEditable],
  );

  if (load.kind === 'loading') return <>{loading}</>;
  if (load.kind === 'error') return <>{failed(load.message, () => void doLoad())}</>;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
