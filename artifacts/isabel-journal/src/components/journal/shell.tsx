import type { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { AlertCircle, BarChart3, CalendarDays, Check, Loader2, NotebookPen, Settings as SettingsIcon, Sprout } from 'lucide-react';
import { useJournal } from '@/store/journal';
import { fmtTab } from '@/lib/dates';
import { cn } from '@/lib/utils';
import { Leaf } from './bits';

export function SaveIndicator() {
  const { saveStatus, saveError, retrySave } = useJournal();
  if (saveStatus === 'error') {
    return (
      <button
        type="button"
        onClick={retrySave}
        title={saveError ?? undefined}
        data-testid="status-save"
        className="inline-flex items-center gap-1.5 rounded-full bg-rose-soft border border-[hsl(356_35%_85%)] px-3 py-1.5 text-xs font-semibold text-rose"
        aria-live="assertive"
      >
        <AlertCircle className="size-3.5" /> Not saved · Retry
      </button>
    );
  }
  return (
    <span
      data-testid="status-save"
      aria-live="polite"
      className="inline-flex items-center gap-1.5 rounded-full bg-card/80 border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground"
    >
      {saveStatus === 'saving' ? (
        <><Loader2 className="size-3.5 animate-spin" /> Saving…</>
      ) : (
        <><Check className="size-3.5 text-sage" strokeWidth={3} /> Saved</>
      )}
    </span>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const [loc] = useLocation();
  const { today, setViewDate, archived } = useJournal();
  const tabs = [
    { href: '/', label: fmtTab(today), icon: NotebookPen, id: 'daily' },
    { href: '/weekly', label: 'Weekly', icon: CalendarDays, id: 'weekly' },
    { href: '/progress', label: 'Progress', icon: BarChart3, id: 'progress' },
    { href: '/history', label: 'History', icon: Sprout, id: 'history' },
  ];
  return (
    <div className="min-h-[100dvh] flex flex-col">
      <header className="sticky top-0 z-40 pt-safe bg-[hsl(38_48%_94%/0.82)] backdrop-blur-md border-b border-border/60">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
          <Link href="/" onClick={() => setViewDate(null)} className="flex items-center gap-2 min-w-0" data-testid="link-home">
            <span className="size-8 rounded-full bg-gradient-to-br from-[hsl(18_55%_55%)] to-[hsl(14_50%_42%)] flex items-center justify-center shrink-0">
              <Leaf className="size-4 text-[hsl(40_60%_95%)]" />
            </span>
            <span className="font-display text-lg font-semibold text-bark truncate">
              Isabel’s Journal{archived && <span className="ml-2 text-xs font-sans font-semibold text-gold uppercase tracking-wider">Archive</span>}
            </span>
          </Link>
          <div className="flex items-center gap-1.5">
            <SaveIndicator />
            <Link
              href="/settings"
              aria-label="Settings"
              data-testid="link-settings"
              className={cn('size-11 rounded-full flex items-center justify-center text-muted-foreground hover:bg-secondary', loc === '/settings' && 'bg-secondary text-bark')}
            >
              <SettingsIcon className="size-5" />
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 pt-5 pb-32">{children}</main>
      <nav
        aria-label="Main"
        className="fixed bottom-0 inset-x-0 z-40 pb-safe bg-[hsl(40_55%_96%/0.92)] backdrop-blur-md border-t border-border/70"
      >
        <div className="max-w-2xl mx-auto grid grid-cols-4 px-2">
          {tabs.map((t) => {
            const active = t.href === '/' ? loc === '/' : loc.startsWith(t.href);
            const Icon = t.icon;
            return (
              <Link
                key={t.id}
                href={t.href}
                onClick={() => t.href === '/' && setViewDate(null)}
                data-testid={`link-tab-${t.id}`}
                aria-current={active ? 'page' : undefined}
                className="flex flex-col items-center justify-center gap-1 min-h-[64px] relative"
              >
                <span className={cn('h-8 px-4 rounded-full flex items-center justify-center transition-colors', active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>
                  <Icon className="size-[1.2rem]" />
                </span>
                <span className={cn('text-[0.72rem] font-semibold whitespace-nowrap', active ? 'text-bark' : 'text-muted-foreground')}>{t.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
