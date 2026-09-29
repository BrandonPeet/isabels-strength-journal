import { ChevronLeft, ChevronRight, CornerDownLeft, Leaf as LeafIcon, Moon, Sparkles, Undo2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useJournal } from '@/store/journal';
import { ENCOURAGEMENTS, MORNING_ROUTINE, WORKOUT_SHORT, WORKOUTS } from '@/lib/program';
import { END_KEY, START_KEY, addDays, dayOfWeek, daysBetween, fmtLong, weekOf, weekRange, fmtShortMD } from '@/lib/dates';
import { morningPct, nextSession, recoveryIndex, unfinishedBefore, weekStats, workoutForDate } from '@/lib/logic';
import { emptyDay, type DayType, type Mark } from '@/lib/types';
import { MarkToggle, SectionTitle, Sprig, StatCard, YesNo, Pill } from '@/components/journal/bits';
import { NoteField, WorkoutPanel } from '@/components/journal/workout';
import { cn } from '@/lib/utils';
import sprigImg from '@/assets/sprig.png';

const DAY_TYPES: { v: DayType; label: string; hint: string }[] = [
  { v: 'planned', label: 'Planned Recovery', hint: 'A rest day you meant to take' },
  { v: 'needed', label: 'Needed Recovery', hint: 'Your body asked for rest' },
  { v: 'skipped', label: 'Skipped Workout', hint: 'Life happened — that is okay' },
];

export default function Daily() {
  const { days, today, journalToday, viewDate, setViewDate, updateDay, isEditable, settings, archived } = useJournal();
  const date = viewDate;
  const entry = days[date] ?? emptyDay(date);
  const editable = isEditable(date);
  const isToday = date === journalToday;
  const week = weekOf(date);
  const stats = weekStats(days, week);
  const next = nextSession(days, journalToday);
  const quote = ENCOURAGEMENTS[((daysBetween(START_KEY, date) % ENCOURAGEMENTS.length) + ENCOURAGEMENTS.length) % ENCOURAGEMENTS.length];
  const beforeStart = today < START_KEY;
  const pct = morningPct(entry);
  const recIdx = entry.trained === 'no' && (entry.dayType === 'planned' || entry.dayType === 'needed') ? recoveryIndex(days, date, week) : 0;
  const upcoming = workoutForDate(days, date);
  const unfinished = unfinishedBefore(days, date);
  const range = weekRange(week);

  const setMorningItem = (id: string, v: Mark | undefined) =>
    updateDay(date, (d) => {
      const items = { ...d.morningItems };
      if (v) items[id] = v; else delete items[id];
      return { ...d, morningItems: items };
    });

  const answerTrained = (v: 'yes' | 'no') =>
    updateDay(date, (d) => {
      if (v === 'yes') {
        // Resolve the older session first; never create a second workout for it.
        if (unfinished && !d.workout) return d;
        const workout = d.workout ?? {
          num: workoutForDate(days, date),
          status: 'in_progress' as const,
          startedAt: new Date().toISOString(),
          prep: {},
          exercises: {},
          notes: '',
        };
        return { ...d, trained: 'yes', workout };
      }
      // keep any logged workout data (never silently lose records); it simply stops counting
      return { ...d, trained: 'no' };
    });

  return (
    <div className="grid gap-6">
      {/* 1. Date */}
      <section className="rise relative">
        <img src={sprigImg} alt="" aria-hidden="true" className="absolute -right-6 -top-6 w-40 sm:w-52 opacity-80 pointer-events-none select-none" />
        <p className="text-sm font-semibold text-terracotta relative" data-testid="text-today">Today is {fmtLong(today)}</p>
        <h1 className="font-display text-[2.6rem] sm:text-5xl leading-[1] font-semibold text-bark mt-2 relative max-w-[80%]" data-testid="text-view-date">
          {isToday && !beforeStart && !archived ? 'A faithful day' : fmtLong(date).split(',')[0]}
          <span className="block text-[1.35rem] sm:text-2xl italic font-medium text-muted-foreground mt-1.5">
            {isToday && !beforeStart && !archived ? fmtLong(date).replace(/, \d{4}$/, '') : fmtLong(date).split(', ').slice(1).join(', ')}
          </span>
        </h1>
        <div className="flex items-center gap-2 mt-3 relative">
          <Pill tone="gold">Week {week} · Day {dayOfWeek(date)} of 7</Pill>
          <span className="text-xs text-muted-foreground">{fmtShortMD(range.start)} – {fmtShortMD(range.end)}</span>
        </div>

        <div className="grid grid-cols-[auto_1fr_auto] gap-2 mt-4 relative">
          <button
            type="button"
            aria-label="Previous day"
            disabled={date <= START_KEY}
            onClick={() => setViewDate(addDays(date, -1))}
            data-testid="button-prev-day"
            className="min-h-12 px-4 rounded-2xl bg-card border border-border flex items-center gap-1 text-sm font-semibold text-bark disabled:opacity-40"
          >
            <ChevronLeft className="size-4" /> Previous Day
          </button>
          {!isToday ? (
            <button
              type="button"
              onClick={() => setViewDate(null)}
              data-testid="button-return-today"
              className="min-h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-1.5 px-2"
            >
              <CornerDownLeft className="size-4" /> Return to Today
            </button>
          ) : <div />}
          <button
            type="button"
            aria-label="Next day"
            disabled={date >= journalToday}
            onClick={() => setViewDate(addDays(date, 1))}
            data-testid="button-next-day"
            className="min-h-12 px-4 rounded-2xl bg-card border border-border flex items-center gap-1 text-sm font-semibold text-bark disabled:opacity-40"
          >
            Next Day <ChevronRight className="size-4" />
          </button>
        </div>
      </section>

      {beforeStart && (
        <div className="rounded-[1.25rem] border border-[hsl(40_45%_75%)] bg-gold-soft px-4 py-3.5 text-sm text-[hsl(30_40%_26%)] leading-relaxed" data-testid="banner-before-start">
          <b>The journal begins Tuesday, September 29, 2026</b> — {daysBetween(today, START_KEY)} days from now. You are looking at Day 1. Anything logged here is saved to Day 1.
        </div>
      )}
      {archived && (
        <div className="rounded-[1.25rem] border border-[hsl(40_45%_75%)] bg-gold-soft px-4 py-3.5 text-sm text-[hsl(30_40%_26%)] leading-relaxed" data-testid="banner-archive">
          <b>Your year is complete.</b> The journal ended on {fmtLong(END_KEY)} and is now a read-only archive. Every entry is preserved.
        </div>
      )}

      {/* 2. Encouragement */}
      {settings.showMessages && (
        <motion.figure
          key={date}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative pl-5 border-l-2 border-[hsl(40_52%_60%)]"
          data-testid="text-encouragement"
        >
          <blockquote className="font-display italic text-[1.35rem] leading-snug text-bark">“{quote.text}”</blockquote>
          {quote.source && <figcaption className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mt-1.5">— {quote.source}</figcaption>}
        </motion.figure>
      )}

      {/* 3. Progress cards */}
      <section className="grid grid-cols-2 gap-3 rise" aria-label={`Week ${week} progress`}>
        <StatCard testId="stat-morning" tone="gold" label="Morning Routine" value={stats.morningPct === null ? '—' : `${Math.round(stats.morningPct * 100)}%`} sub={`${stats.morningLogged} of ${range.days.length} days logged`} />
        <StatCard testId="stat-workouts" tone="sage" label="Workouts" value={<>{stats.workouts}<span className="text-lg text-muted-foreground"> / 5</span></>} sub={`Week ${week}`} />
        <StatCard testId="stat-recovery" tone="clay" label="Recovery Days" value={<>{stats.recovery}<span className="text-lg text-muted-foreground"> / 2</span></>} sub={stats.extraRecovery ? `${stats.extraRecovery} beyond plan` : 'Two are planned'} />
        <StatCard testId="stat-next" tone="terracotta" label="Next Session" value={`Workout ${next}`} sub={WORKOUT_SHORT[next]} />
      </section>

      {/* 4. Morning routine */}
      <section className="paper-card p-5">
        <SectionTitle eyebrow="Morning routine" title="Did you do your morning routine?" />
        <YesNo testId="morning" value={entry.morning} disabled={!editable} onChange={(v) => updateDay(date, (d) => ({ ...d, morning: v }))} />
        {entry.morning === 'no' && (
          <p className="mt-3 text-sm text-muted-foreground">Recorded as missed. Tomorrow is another quiet chance. You can change this anytime.</p>
        )}
        {entry.morning === 'yes' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
            <div className="flex items-center justify-between mt-5 mb-1">
              <span className="eyebrow">Your seven movements</span>
              <Pill tone={pct === 1 ? 'sage' : 'muted'} testId="text-morning-pct">{Math.round((pct ?? 0) * 100)}%</Pill>
            </div>
            <ol className="divide-y divide-border/60">
              {MORNING_ROUTINE.map((m, i) => (
                <li key={m.id} className="flex items-center gap-3 py-3">
                  <span className={cn('font-display text-xl w-5 text-center', entry.morningItems[m.id] === 'done' ? 'text-sage' : 'text-[hsl(30_25%_68%)]')}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-bark leading-snug">{m.name}</div>
                    <div className="text-sm text-muted-foreground">{m.prescription}</div>
                  </div>
                  <MarkToggle label={m.name} value={entry.morningItems[m.id]} onChange={(v) => setMorningItem(m.id, v)} disabled={!editable} testId={`morning-${m.id}`} />
                </li>
              ))}
            </ol>
            <div className="mt-3">
              <NoteField label="Morning notes" value={entry.morningNotes} disabled={!editable} onChange={(v) => updateDay(date, (d) => ({ ...d, morningNotes: v }))} placeholder="hips felt stiff · felt great · calves tight" testId="input-morning-notes" rows={2} />
            </div>
          </motion.div>
        )}
      </section>

      {/* 5. Training question */}
      <section className="paper-card p-5">
        <SectionTitle eyebrow="Training" title="Did you work out today?" />
        {unfinished?.workout && (
          <div className="rounded-2xl bg-gold-soft border border-[hsl(40_45%_80%)] p-4 mb-5" data-testid="notice-unfinished-workout">
            <p className="text-sm font-semibold text-bark">You have an unfinished workout from {fmtShortMD(unfinished.date)}.</p>
            <p className="font-display text-xl font-semibold text-bark mt-1">{WORKOUTS[unfinished.workout.num].title}</p>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button
                type="button"
                disabled={!isEditable(unfinished.date)}
                onClick={() => {
                  setViewDate(unfinished.date);
                  requestAnimationFrame(() => document.querySelector(`[data-testid="panel-workout-${unfinished.workout!.num}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
                }}
                data-testid="button-resume-workout"
                className="min-h-12 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-60"
              >
                Resume Workout
              </button>
              <button
                type="button"
                disabled={!isEditable(unfinished.date)}
                onClick={() => updateDay(unfinished.date, (d) => d.workout?.status === 'in_progress' ? { ...d, workout: { ...d.workout, leftUnfinished: true } } : d)}
                data-testid="button-leave-unfinished"
                className="min-h-12 rounded-2xl bg-card border border-border text-bark text-sm font-semibold disabled:opacity-60"
              >
                Leave Unfinished
              </button>
            </div>
            {!entry.workout && <p className="text-xs text-muted-foreground mt-2">Resolve this session before starting another workout.</p>}
          </div>
        )}
        {!entry.trained && (
          <p className="text-sm text-muted-foreground -mt-1 mb-3">
            Up next: <b className="text-bark">Workout {upcoming}</b> — {WORKOUTS[upcoming].title}
          </p>
        )}
        <YesNo testId="trained" value={entry.trained} disabled={!editable} disableYes={!!unfinished && !entry.workout} onChange={answerTrained} />
        {entry.trained === 'no' && (
          <div className="mt-5">
            <div className="eyebrow mb-2">What kind of day was it?</div>
            <div className="grid gap-2" role="radiogroup">
              {DAY_TYPES.map((t) => {
                const active = entry.dayType === t.v;
                return (
                  <button
                    key={t.v}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    disabled={!editable}
                    onClick={() => updateDay(date, (d) => ({ ...d, dayType: t.v }))}
                    data-testid={`button-daytype-${t.v}`}
                    className={cn(
                      'min-h-[60px] rounded-2xl border px-4 flex items-center gap-3 text-left transition-all active:scale-[0.99] disabled:opacity-60',
                      active && t.v !== 'skipped' && 'bg-clay-soft border-clay',
                      active && t.v === 'skipped' && 'bg-rose-soft border-[hsl(356_35%_75%)]',
                      !active && 'bg-card border-border',
                    )}
                  >
                    <span className={cn('size-9 rounded-full flex items-center justify-center shrink-0', t.v === 'skipped' ? 'bg-rose-soft text-rose' : 'bg-clay-soft text-[hsl(26_30%_35%)]')}>
                      {t.v === 'planned' ? <Moon className="size-4" /> : t.v === 'needed' ? <LeafIcon className="size-4" /> : <Undo2 className="size-4" />}
                    </span>
                    <span>
                      <span className="block font-semibold text-bark tracking-wide uppercase text-sm">{t.label}</span>
                      <span className="block text-xs text-muted-foreground">{t.hint}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            {recIdx > 0 && recIdx <= 2 && (
              <p className="mt-3 text-sm text-[hsl(26_30%_32%)]" data-testid="text-recovery-note">Recovery day {recIdx} of 2 this week. Rest is part of the plan — Workout {upcoming} will be waiting.</p>
            )}
            {recIdx >= 3 && (
              <p className="mt-3 rounded-2xl bg-clay-soft px-4 py-3 text-sm text-[hsl(26_30%_28%)] leading-relaxed" data-testid="text-recovery-extra">
                This is recovery day {recIdx} this week. Two recovery days are planned, so this additional recovery day will count toward missed workout consistency.
              </p>
            )}
            {entry.dayType === 'skipped' && (
              <p className="mt-3 text-sm text-muted-foreground">No problem. Your sequence waits right where you left it: Workout {upcoming}.</p>
            )}
            {entry.workout && (
              <p className="mt-3 text-xs text-muted-foreground">A workout was started on this day. It is kept safely and will return if you switch back to Yes.</p>
            )}
          </div>
        )}
      </section>

      {/* 6. Workout */}
      {entry.trained === 'yes' && entry.workout && (
        <WorkoutPanel
          entry={entry}
          days={days}
          disabled={!editable || !!entry.workout.leftUnfinished}
          onChange={(fn) => updateDay(date, (d) => (d.workout ? { ...d, workout: fn(d.workout) } : d))}
        />
      )}

      {/* 7. Daily notes */}
      <section className="paper-card p-5 relative overflow-hidden">
        <Sprig className="absolute -right-4 -bottom-2 w-32 text-[hsl(96_18%_70%)] opacity-60 pointer-events-none" />
        <div className="flex items-center gap-2 mb-2"><Sparkles className="size-4 text-gold" /><span className="eyebrow">Daily notes</span></div>
        <NoteField label="Anything to remember about today?" value={entry.notes} disabled={!editable} onChange={(v) => updateDay(date, (d) => ({ ...d, notes: v }))} placeholder="Slept well, walked with the family, felt strong…" testId="input-daily-notes" />
      </section>
    </div>
  );
}
