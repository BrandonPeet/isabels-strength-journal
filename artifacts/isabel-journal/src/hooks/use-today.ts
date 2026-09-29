import { useCallback, useEffect, useState } from 'react';
import { toKey } from '@/lib/dates';

/** Local device date, re-checked on focus, visibility, wake, periodically and at midnight. */
export function useToday(): [string, () => void] {
  const [today, setToday] = useState(() => toKey(new Date()));
  const check = useCallback(() => setToday((prev) => {
    const k = toKey(new Date());
    return k === prev ? prev : k;
  }), []);

  useEffect(() => {
    let midnight: ReturnType<typeof setTimeout>;
    const arm = () => {
      const now = new Date();
      const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      clearTimeout(midnight);
      midnight = setTimeout(() => {
        check();
        arm();
      }, Math.max(0, next.getTime() - now.getTime()));
    };
    const wake = () => {
      check();
      arm();
    };
    arm();
    const interval = setInterval(check, 30_000);
    const onVis = () => {
      if (document.visibilityState === 'visible') wake();
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', wake);
    window.addEventListener('pageshow', wake);
    window.addEventListener('online', wake);
    return () => {
      clearTimeout(midnight);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('focus', wake);
      window.removeEventListener('pageshow', wake);
      window.removeEventListener('online', wake);
    };
  }, [check]);

  return [today, check];
}
