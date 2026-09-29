import { ArrowRight } from 'lucide-react';
import { useJournal } from '@/store/journal';
import { MAJOR_LIFTS, WORKOUT_SHORT, type WorkoutNum } from '@/lib/program';
import { fmtShortMD, weekOf } from '@/lib/dates';
import { compactSet, exerciseInstances, isCompletedWorkout, morningPct, nextSession, sortedDays, topSet } from '@/lib/logic';
import { SectionTitle, StatCard, EmptyState } from '@/components/journal/bits';
import { cn } from '@/lib/utils';

function Spark({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const w = 120;
  const h = 36;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - 4 - (max === min ? 0.5 : (v - min) / (max - min)) * (h - 8)}`);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-28 h-9" aria-hidden="true">
      <polyline points={pts.join(' ')} fill="none" stroke="hsl(14 50% 48%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1].split(',')[0]} cy={pts[pts.length - 1].split(',')[1]} r="3" fill="hsl(14 50% 48%)" />
    </svg>
  );
}

export default function Progress() {
  const { days, journalToday } = useJournal();
  const list = sortedDays(days);
  const workouts = list.filter(isCompletedWorkout).length;
  const pcts = list.map(morningPct).filter((p): p is number => p !== null);
  const planned = list.filter((d) => d.trained === 'no' && d.dayType === 'planned').length;
  const needed = list.filter((d) => d.trained === 'no' && d.dayType === 'needed').length;
  const skipped = list.filter((d) => d.trained === 'no' && d.dayType === 'skipped').length;
  const next = nextSession(days, journalToday);
  const inst = exerciseInstances(days);

  return (
    <div className="grid gap-6">
      <section className="rise">
        <div className="eyebrow">The long view</div>
        <h1 className="font-display text-5xl font-semibold text-bark leading-none mt-1">Progress</h1>
        <p className="text-muted-foreground mt-2">Week {weekOf(journalToday)} of your year. Every entry adds a little more to this page.</p>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <StatCard testId="stat-total-workouts" tone="sage" label="Workouts Completed" value={workouts} />
        <StatCard testId="stat-current-week" tone="gold" label="Current Week" value={weekOf(journalToday)} />
        <StatCard testId="stat-morning-logged" tone="default" label="Morning Routines Logged" value={pcts.length} />
        <StatCard testId="stat-morning-avg" tone="gold" label="Avg. Morning Completion" value={pcts.length ? `${Math.round((pcts.reduce((a, b) => a + b, 0) / pcts.length) * 100)}%` : '—'} />
        <StatCard testId="stat-planned-recovery" tone="clay" label="Planned Recovery" value={planned} sub={needed ? `+ ${needed} needed recovery` : undefined} />
        <StatCard testId="stat-total-skipped" tone="rose" label="Skipped Workouts" value={skipped} />
      </section>

      <section className="paper-card p-5">
        <div className="eyebrow">Your sequence</div>
        <div className="font-display text-2xl font-semibold text-bark mt-1" data-testid="text-current-workout">Next up: Workout {next}</div>
        <ol className="mt-4 grid grid-cols-5 gap-1.5">
          {([1, 2, 3, 4, 5] as WorkoutNum[]).map((n) => (
            <li key={n} className={cn('rounded-2xl py-3 px-1 text-center border', n === next ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border')}>
              <div className="font-display text-2xl font-semibold leading-none">{n}</div>
              <div className={cn('text-[0.6rem] leading-tight mt-1', n === next ? 'text-[hsl(40_60%_90%)]' : 'text-muted-foreground')}>{WORKOUT_SHORT[n]}</div>
            </li>
          ))}
        </ol>
        <p className="text-xs text-muted-foreground mt-3">Rest days pause the sequence; it always picks up where you left off.</p>
      </section>

      <section>
        <SectionTitle eyebrow="Strength" title="First vs. latest" />
        {MAJOR_LIFTS.every((l) => inst.filter((i) => i.key === l.key).length === 0) ? (
          <EmptyState title="Your strength story starts here" body="After you log a few sets of hip thrusts, hack squats and rows, your first and latest numbers will appear side by side." />
        ) : (
          <div className="grid gap-3">
            {MAJOR_LIFTS.map((l) => {
              const sessions = inst.filter((i) => i.key === l.key);
              if (!sessions.length)
                return (
                  <div key={l.key} className="rounded-[1.25rem] border border-dashed border-border px-4 py-3 flex items-center justify-between">
                    <span className="font-display text-lg text-bark">{l.name}</span>
                    <span className="text-xs text-muted-foreground">Not logged yet</span>
                  </div>
                );
              const first = sessions[0];
              const last = sessions[sessions.length - 1];
              const weights = sessions.map((s) => topSet(s.sets)?.weight ?? null).filter((w): w is number => w !== null);
              return (
                <article key={l.key} className="paper-card p-4" data-testid={`card-lift-${l.key}`}>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display text-xl font-semibold text-bark">{l.name}</h3>
                    <Spark values={weights} />
                  </div>
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 mt-2">
                    <div className="rounded-2xl bg-muted px-3 py-2.5">
                      <div className="text-[0.65rem] uppercase tracking-wider font-semibold text-muted-foreground">First · {fmtShortMD(first.date)}</div>
                      <div className="font-semibold text-bark mt-0.5">{compactSet(topSet(first.sets))}</div>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground" />
                    <div className="rounded-2xl bg-sage-soft px-3 py-2.5">
                      <div className="text-[0.65rem] uppercase tracking-wider font-semibold text-[hsl(100_20%_32%)]">Latest · {fmtShortMD(last.date)}</div>
                      <div className="font-semibold text-bark mt-0.5">{compactSet(topSet(last.sets))}</div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">{sessions.length} logged {sessions.length === 1 ? 'session' : 'sessions'}</div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
