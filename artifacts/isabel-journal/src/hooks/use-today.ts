import { useEffect, useState } from 'react';
import { toKey } from '@/lib/dates';

/** Local device date, re-checked on focus, visibility, wake, periodically and at midnight. */
export function useToday(): string {
  const [today, setToday] = useState(() => toKey(new Date()));

  useEffect(() => {
    const check = () => setToday((prev) => {
      const k = toKey(new Date());
      return k === prev ? prev : k;
    });
    let midnight: ReturnType<typeof setTimeout>;
    const arm = () => {
      const now = new Date();
      const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
      midnight = setTimeout(() => {
        check();
        arm();
      }, next.getTime() - now.getTime());
    };
    arm();
    const interval = setInterval(check, 30_000);
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        check();
        clearTimeout(midnight);
        arm();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', check);
    window.addEventListener('pageshow', check);
    window.addEventListener('online', check);
    return () => {
      clearTimeout(midnight);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('focus', check);
      window.removeEventListener('pageshow', check);
      window.removeEventListener('online', check);
    };
  }, []);

  return today;
}
