import { useLocation } from 'wouter';
import { Check, ChevronRight, X } from 'lucide-react';
import { useJournal } from '@/store/journal';
import { fmtMonthYear, fmtShortMD, fmtWeekday } from '@/lib/dates';
import { dayHasContent, type DayEntry } from '@/lib/types';
import { sortedDays } from '@/lib/logic';
import { EmptyState, Pill } from '@/components/journal/bits';

function DaySummary({ d }: { d: DayEntry }) {
  const chips = [];
  if (d.morning === 'yes') chips.push(<Pill key="m" tone="sage"><Check className="size-3" strokeWidth={3} /> Morning</Pill>);
  if (d.morning === 'no') chips.push(<Pill key="m" tone="rose"><X className="size-3" strokeWidth={3} /> Morning</Pill>);
  if (d.workout?.leftUnfinished) {
    chips.push(<Pill key="w" tone="gold">Workout {d.workout.num} · left unfinished</Pill>);
  } else if (d.trained === 'yes' && d.workout) {
    chips.push(
      d.workout.status === 'completed'
        ? <Pill key="w" tone="sage"><Check className="size-3" strokeWidth={3} /> Workout {d.workout.num}</Pill>
        : <Pill key="w" tone="gold">Workout {d.workout.num} · in progress</Pill>,
    );
  }
  if (d.trained === 'no') {
    if (d.dayType === 'planned') chips.push(<Pill key="r" tone="clay">Planned Recovery</Pill>);
    else if (d.dayType === 'needed') chips.push(<Pill key="r" tone="clay">Needed Recovery</Pill>);
    else if (d.dayType === 'skipped') chips.push(<Pill key="r" tone="rose">Skipped Workout</Pill>);
    else chips.push(<Pill key="r" tone="muted">No workout</Pill>);
  }
  if (!chips.length) chips.push(<Pill key="n" tone="muted">Notes only</Pill>);
  return <div className="flex flex-wrap gap-1.5">{chips}</div>;
}

export default function History() {
  const { days, setViewDate } = useJournal();
  const [, navigate] = useLocation();
  const entries = sortedDays(days).filter(dayHasContent).reverse();
  const groups: { month: string; items: DayEntry[] }[] = [];
  for (const e of entries) {
    const m = fmtMonthYear(e.date);
    const g = groups[groups.length - 1];
    if (g && g.month === m) g.items.push(e);
    else groups.push({ month: m, items: [e] });
  }

  return (
    <div className="grid gap-6">
      <section className="rise">
        <div className="eyebrow">Every faithful day</div>
        <h1 className="font-display text-5xl font-semibold text-bark leading-none mt-1">History</h1>
        <p className="text-muted-foreground mt-2">Tap any day to open it. Changes save instantly and update your weekly reports.</p>
      </section>

      {!groups.length ? (
        <EmptyState title="Your pages are still blank" body="Once you log a morning routine, a workout, or a rest day, it will be kept here — organized by month, ready to revisit.">
          <button type="button" onClick={() => { setViewDate(null); navigate('/'); }} className="min-h-12 px-6 rounded-2xl bg-primary text-primary-foreground font-semibold" data-testid="button-start-today">
            Begin today’s entry
          </button>
        </EmptyState>
      ) : (
        groups.map((g) => (
          <section key={g.month}>
            <h2 className="font-display text-2xl italic text-terracotta px-1 mb-2">{g.month}</h2>
            <ul className="paper-card divide-y divide-border/60 overflow-hidden">
              {g.items.map((d) => (
                <li key={d.date}>
                  <button
                    type="button"
                    onClick={() => { setViewDate(d.date); navigate('/'); window.scrollTo({ top: 0 }); }}
                    className="w-full flex items-center gap-4 px-4 py-3.5 text-left hover:bg-secondary/50 min-h-[68px]"
                    data-testid={`button-history-${d.date}`}
                  >
                    <div className="w-12 text-center shrink-0">
                      <div className="text-[0.65rem] uppercase font-semibold text-muted-foreground">{fmtWeekday(d.date)}</div>
                      <div className="font-display text-2xl font-semibold text-bark leading-none">{Number(d.date.slice(8))}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-bark mb-1 sr-only">{fmtShortMD(d.date)}</div>
                      <DaySummary d={d} />
                      {(d.notes || d.workout?.notes) && (
                        <p className="text-xs text-muted-foreground mt-1.5 truncate italic">“{d.notes || d.workout?.notes}”</p>
                      )}
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
