import { useState } from 'react';
import { useLocation } from 'wouter';
import { ChevronLeft, ChevronRight, Feather, TrendingUp } from 'lucide-react';
import { useJournal } from '@/store/journal';
import { fmtMonthDay, fmtWeekday, weekOf, weekRange } from '@/lib/dates';
import { isCompletedWorkout, isRecovery, isSkipped, weekStats, weeklyFeedback } from '@/lib/logic';
import { StatCard } from '@/components/journal/bits';
import { cn } from '@/lib/utils';

export default function Weekly() {
  const { days, journalToday, setViewDate } = useJournal();
  const [, navigate] = useLocation();
  const current = weekOf(journalToday);
  const [week, setWeek] = useState(current);
  const s = weekStats(days, week);
  const r = weekRange(week);
  const feedback = weeklyFeedback(s, week === current);

  return (
    <div className="grid gap-6">
      <section className="rise">
        <div className="eyebrow">Training week</div>
        <div className="flex items-center justify-between gap-2 mt-1">
          <button type="button" aria-label="Previous week" disabled={week <= 1} onClick={() => setWeek(week - 1)} data-testid="button-prev-week" className="size-12 rounded-full bg-card border border-border flex items-center justify-center disabled:opacity-40">
            <ChevronLeft className="size-5" />
          </button>
          <div className="text-center">
            <h1 className="font-display text-5xl font-semibold text-bark leading-none" data-testid="text-week-number">Week {week}</h1>
            <p className="text-muted-foreground mt-1.5 italic font-display text-lg" data-testid="text-week-range">{fmtMonthDay(r.start)} – {fmtMonthDay(r.end)}</p>
          </div>
          <button type="button" aria-label="Next week" disabled={week >= current} onClick={() => setWeek(week + 1)} data-testid="button-next-week" className="size-12 rounded-full bg-card border border-border flex items-center justify-center disabled:opacity-40">
            <ChevronRight className="size-5" />
          </button>
        </div>
        {week !== current && (
          <div className="text-center mt-2">
            <button type="button" onClick={() => setWeek(current)} className="text-sm font-semibold text-terracotta min-h-11 px-3" data-testid="button-current-week">Back to this week</button>
          </div>
        )}
      </section>

      {/* day strip */}
      <section className="paper-card p-3" aria-label="Days of the week">
        <div className="grid grid-cols-7 gap-1">
          {r.days.map((k, i) => {
            const d = days[k];
            const future = k > journalToday;
            const tone = isCompletedWorkout(d) ? 'sage' : isRecovery(d) ? 'clay' : isSkipped(d) ? 'rose' : d?.trained === 'yes' ? 'gold' : 'none';
            return (
              <button
                key={k}
                type="button"
                disabled={future}
                onClick={() => { setViewDate(k); navigate('/'); }}
                data-testid={`button-week-day-${i + 1}`}
                className="flex flex-col items-center gap-1 py-2 rounded-2xl hover:bg-secondary/70 disabled:opacity-40 min-h-[72px]"
                aria-label={`Day ${i + 1}, ${fmtMonthDay(k)}`}
              >
                <span className="text-[0.65rem] font-semibold uppercase text-muted-foreground">{fmtWeekday(k)}</span>
                <span
                  className={cn(
                    'size-9 rounded-full flex items-center justify-center text-sm font-semibold border',
                    tone === 'sage' && 'bg-sage text-[hsl(40_60%_97%)] border-sage',
                    tone === 'clay' && 'bg-clay-soft border-clay text-[hsl(26_30%_30%)]',
                    tone === 'rose' && 'bg-rose-soft border-[hsl(356_35%_75%)] text-rose',
                    tone === 'gold' && 'bg-gold-soft border-gold text-[hsl(36_45%_30%)]',
                    tone === 'none' && 'border-dashed border-border text-muted-foreground',
                  )}
                >
                  {Number(k.slice(8))}
                </span>
                <span className="text-[0.6rem] text-muted-foreground h-3">{isCompletedWorkout(d) ? `W${d!.workout!.num}` : isRecovery(d) ? 'Rest' : isSkipped(d) ? 'Skip' : ''}</span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2 text-[0.7rem] text-muted-foreground">
          <span className="flex items-center gap-1"><i className="size-2.5 rounded-full bg-sage" /> Completed</span>
          <span className="flex items-center gap-1"><i className="size-2.5 rounded-full bg-clay" /> Recovery</span>
          <span className="flex items-center gap-1"><i className="size-2.5 rounded-full bg-rose" /> Skipped</span>
          <span className="flex items-center gap-1"><i className="size-2.5 rounded-full bg-gold" /> In progress</span>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <StatCard testId="stat-week-morning" tone="gold" label="Morning Routine" value={s.morningPct === null ? '—' : `${Math.round(s.morningPct * 100)}%`} sub={`${s.morningLogged} days logged`} />
        <StatCard testId="stat-week-workouts" tone="sage" label="Workouts Completed" value={<>{s.workouts}<span className="text-lg text-muted-foreground"> / 5</span></>} />
        <StatCard testId="stat-week-recovery" tone="clay" label="Recovery Days" value={<>{s.recovery}<span className="text-lg text-muted-foreground"> / 2</span></>} sub={s.extraRecovery ? `${s.extraRecovery} counted as missed` : undefined} />
        <StatCard testId="stat-week-skipped" tone="rose" label="Skipped Workouts" value={s.skipped} sub={s.missedConsistency !== s.skipped ? `${s.missedConsistency} missed-consistency days` : undefined} />
        <div className="col-span-2">
          <StatCard testId="stat-week-improved" tone="terracotta" label="Exercises Improved" value={s.improved.length} sub={s.improved.length ? s.improved.join(', ') : 'More weight or reps than the time before will show here.'} />
        </div>
      </section>

      <section className="grid gap-3">
        <div className="paper-card p-4">
          <div className="eyebrow">Most frequently missed morning movement</div>
          <div className="font-display text-xl font-semibold text-bark mt-1" data-testid="text-missed-morning">
            {s.missedMorning ? `${s.missedMorning.name} · ${s.missedMorning.count}×` : 'None missed — lovely.'}
          </div>
        </div>
        <div className="paper-card p-4">
          <div className="eyebrow">Most frequently missed workout exercise</div>
          <div className="font-display text-xl font-semibold text-bark mt-1" data-testid="text-missed-exercise">
            {s.missedExercise ? `${s.missedExercise.name} · ${s.missedExercise.count}×` : 'None marked as missed.'}
          </div>
        </div>
      </section>

      <section className="rounded-[1.75rem] p-5 bg-gradient-to-br from-[hsl(20_34%_28%)] to-[hsl(16_38%_38%)] text-[hsl(40_60%_95%)] shadow-[0_20px_40px_-24px_hsl(16_45%_25%/.8)]">
        <div className="flex items-center gap-2 text-[hsl(40_60%_80%)]"><Feather className="size-4" /><span className="text-xs uppercase tracking-[0.18em] font-semibold">Gentle feedback</span></div>
        <ul className="mt-3 grid gap-3" data-testid="list-feedback">
          {feedback.map((f, i) => (
            <li key={i} className="flex gap-3 leading-relaxed">
              <TrendingUp className="size-4 mt-1 shrink-0 text-[hsl(40_60%_75%)]" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
