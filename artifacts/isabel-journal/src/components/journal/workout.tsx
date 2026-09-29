import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, Flag, History as HistoryIcon, RotateCcw, Timer } from 'lucide-react';
import { WORKOUTS, runPhaseForWeek, type ExerciseSlot, type PrepItem, type WorkoutNum } from '@/lib/program';
import type { DayEntry, ExerciseLog, Mark, RunLog, WorkoutLog } from '@/lib/types';
import { effectiveKey, formatSet, previousInstance, type Days } from '@/lib/logic';
import { fmtMonthDay, weekOf } from '@/lib/dates';
import { cn } from '@/lib/utils';
import { MarkToggle, Pill } from './bits';

export function NoteField({
  label, value, onChange, disabled, placeholder, testId, rows = 3,
}: {
  label: string; value: string; onChange: (v: string) => void; disabled?: boolean; placeholder?: string; testId: string; rows?: number;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-bark">{label}</span>
      <textarea
        className="field mt-1.5 resize-none leading-relaxed"
        rows={rows}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        data-testid={testId}
      />
    </label>
  );
}

export function PrepList({
  title, items, marks, onMark, disabled, testPrefix,
}: {
  title: string; items: PrepItem[]; marks: Record<string, Mark>; onMark: (id: string, v: Mark | undefined) => void; disabled?: boolean; testPrefix: string;
}) {
  const done = items.filter((i) => marks[i.id] === 'done').length;
  const [open, setOpen] = useState(true);
  return (
    <div className="paper-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left"
        data-testid={`button-toggle-${testPrefix}`}
      >
        <div>
          <div className="eyebrow">Warm-up</div>
          <div className="font-display text-xl font-semibold text-bark">{title}</div>
        </div>
        <div className="flex items-center gap-2">
          <Pill tone={done === items.length ? 'sage' : 'muted'}>{done}/{items.length}</Pill>
          <ChevronDown className={cn('size-5 text-muted-foreground transition-transform', open && 'rotate-180')} />
        </div>
      </button>
      {open && (
        <ul className="border-t border-border/70 divide-y divide-border/60">
          {items.map((i) => (
            <li key={i.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className={cn('font-medium text-bark leading-snug', marks[i.id] === 'done' && 'text-[hsl(100_20%_32%)]')}>{i.name}</div>
                <div className="text-sm text-muted-foreground">{i.prescription}</div>
              </div>
              <MarkToggle label={i.name} value={marks[i.id]} onChange={(v) => onMark(i.id, v)} disabled={disabled} testId={`${testPrefix}-${i.id}`} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ExerciseCard({
  slot, log, onChange, days, date, disabled,
}: {
  slot: ExerciseSlot; log?: ExerciseLog; onChange: (l: ExerciseLog) => void; days: Days; date: string; disabled?: boolean;
}) {
  const key = effectiveKey(slot, log);
  const prev = previousInstance(days, key, date);
  const sets = Array.from({ length: slot.sets }, (_, i) => log?.sets[i] ?? { reps: '', weight: '' });
  const base: ExerciseLog = log ?? { sets: [] };
  const name = slot.options ? slot.options.find((o) => o.key === key)!.name : slot.name;
  const setField = (i: number, f: 'reps' | 'weight', v: string) => {
    const next = sets.map((s, j) => (j === i ? { ...s, [f]: v } : s));
    onChange({ ...base, sets: next });
  };
  return (
    <article
      data-testid={`card-exercise-${slot.id}`}
      className={cn(
        'paper-card p-4 transition-colors',
        log?.status === 'done' && 'ring-2 ring-[hsl(100_20%_60%/.45)]',
        log?.status === 'missed' && 'ring-2 ring-[hsl(356_40%_70%/.35)]',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="font-display text-[1.45rem] leading-tight font-semibold text-bark">{name}</h4>
          <div className="text-[0.95rem] font-semibold text-terracotta mt-0.5">{slot.prescription}</div>
        </div>
        <MarkToggle
          label={name}
          value={log?.status}
          onChange={(v) => onChange({ ...base, sets, status: v })}
          disabled={disabled}
          testId={`exercise-${slot.id}`}
          doneLabel="Completed"
          missedLabel="Not completed"
        />
      </div>

      {slot.options && (
        <div className="grid grid-cols-2 gap-2 mt-3 p-1 rounded-2xl bg-muted" role="radiogroup" aria-label="Choose variation">
          {slot.options.map((o) => (
            <button
              key={o.key}
              type="button"
              role="radio"
              aria-checked={key === o.key}
              disabled={disabled}
              data-testid={`button-choice-${slot.id}-${o.key}`}
              onClick={() => onChange({ ...base, sets, choice: o.key })}
              className={cn('min-h-11 rounded-xl text-sm font-semibold transition-all', key === o.key ? 'bg-card text-bark shadow-sm' : 'text-muted-foreground')}
            >
              {o.name}
            </button>
          ))}
        </div>
      )}

      {prev && (
        <div className="mt-3 rounded-2xl bg-gold-soft/70 border border-[hsl(40_45%_80%)] px-3.5 py-2.5" data-testid={`text-last-session-${slot.id}`}>
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[hsl(36_45%_32%)]">
            <HistoryIcon className="size-3.5" /> Last session — {fmtMonthDay(prev.date)}
          </div>
          <ul className="mt-1 text-sm text-bark grid gap-0.5">
            {prev.sets.map((s, i) =>
              s.reps.trim() || s.weight.trim() ? (
                <li key={i}><span className="text-muted-foreground">Set {i + 1}:</span> {formatSet(s)}</li>
              ) : null,
            )}
          </ul>
        </div>
      )}

      <div className="mt-3 grid gap-2.5">
        {sets.map((s, i) => (
          <div key={i} className="grid grid-cols-[3.2rem_1fr_1fr] items-center gap-2">
            <div className="text-sm font-semibold text-muted-foreground">Set {i + 1}</div>
            <label className="block min-w-0">
              <span className="sr-only">Set {i + 1} reps or time</span>
              <input
                className="field"
                placeholder="Reps / Time"
                value={s.reps}
                disabled={disabled}
                onChange={(e) => setField(i, 'reps', e.target.value)}
                data-testid={`input-reps-${slot.id}-${i}`}
              />
            </label>
            <label className="block min-w-0 relative">
              <span className="sr-only">Set {i + 1} weight</span>
              <input
                className="field pr-9"
                placeholder="Weight"
                inputMode="decimal"
                value={s.weight}
                disabled={disabled}
                onChange={(e) => setField(i, 'weight', e.target.value)}
                data-testid={`input-weight-${slot.id}-${i}`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">lb</span>
            </label>
          </div>
        ))}
      </div>
    </article>
  );
}

function RunCard({ date, run, onChange, disabled }: { date: string; run: RunLog; onChange: (r: RunLog) => void; disabled?: boolean }) {
  const week = weekOf(date);
  const phase = runPhaseForWeek(week);
  const set = (p: Partial<RunLog>) => onChange({ ...run, ...p });
  const inp = (label: string, field: keyof RunLog, placeholder: string, mode?: 'decimal' | 'numeric') => (
    <label className="block">
      <span className="text-sm font-semibold text-bark">{label}</span>
      <input
        className="field mt-1"
        placeholder={placeholder}
        inputMode={mode}
        value={(run[field] as string) ?? ''}
        disabled={disabled}
        onChange={(e) => set({ [field]: e.target.value } as Partial<RunLog>)}
        data-testid={`input-run-${field}`}
      />
    </label>
  );
  return (
    <article className="rounded-[1.5rem] p-5 border border-[hsl(96_20%_78%)] bg-gradient-to-br from-[hsl(96_30%_94%)] via-[hsl(60_30%_94%)] to-[hsl(40_55%_92%)] shadow-[0_14px_30px_-20px_hsl(100_20%_25%/.5)]" data-testid="card-run">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="eyebrow flex items-center gap-1.5"><Timer className="size-3.5" /> Week {week}</div>
          <h4 className="font-display text-[1.6rem] font-semibold text-bark leading-tight">
            {phase ? 'Beginner Run' : 'Running Progression / Maintenance'}
          </h4>
        </div>
        <MarkToggle label="Run" value={run.status} onChange={(v) => set({ status: v })} disabled={disabled} testId="run" doneLabel="Completed" missedLabel="Not completed" />
      </div>

      {phase ? (
        <>
          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            {[
              ['Easy run', phase.run],
              ['Walk', phase.walk],
              ['Rounds', String(phase.rounds)],
            ].map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-card/80 border border-border/60 py-3 px-1">
                <div className="text-[0.7rem] uppercase tracking-wider font-semibold text-muted-foreground">{k}</div>
                <div className="font-display text-xl font-semibold text-bark leading-tight mt-0.5">{v}</div>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-3">{phase.weeks}. Finish with an easy cooldown walk, 5 minutes.</p>
          <div className="mt-4 grid grid-cols-[1fr_auto] items-end gap-2">
            {inp('Rounds completed', 'roundsCompleted', `e.g. ${phase.rounds}`, 'numeric')}
            <div className="pb-3 text-muted-foreground font-semibold">/ {phase.rounds}</div>
          </div>
        </>
      ) : (
        <>
          <ol className="mt-3 text-sm text-bark grid gap-1">
            <li>1. 5-minute easy walking warm-up</li>
            <li>2. 20 minutes of easy continuous running, or run/walk as needed</li>
            <li>3. 5-minute easy walking cooldown</li>
          </ol>
          <p className="text-xs text-muted-foreground mt-2">No need to add volume every week. The goal now is sustainable conditioning.</p>
          <div className="grid grid-cols-2 gap-2 mt-4 p-1 rounded-2xl bg-card/70" role="radiogroup" aria-label="Run style">
            {([['continuous', 'Easy Continuous Run'], ['runwalk', 'Run / Walk']] as const).map(([m, l]) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={run.mode === m}
                disabled={disabled}
                onClick={() => set({ mode: m })}
                data-testid={`button-run-mode-${m}`}
                className={cn('min-h-12 rounded-xl text-sm font-semibold', run.mode === m ? 'bg-sage text-[hsl(40_60%_97%)]' : 'text-bark')}
              >
                {l}
              </button>
            ))}
          </div>
          {run.mode === 'continuous' && (
            <div className="grid grid-cols-2 gap-2 mt-3">
              {inp('Total running time', 'totalTime', 'e.g. 20 min')}
              {inp('Distance (optional)', 'distance', 'e.g. 1.8 mi')}
            </div>
          )}
          {run.mode === 'runwalk' && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              {inp('Run', 'runInterval', '3 min')}
              {inp('Walk', 'walkInterval', '90 sec')}
              {inp('Rounds', 'rounds', '6', 'numeric')}
            </div>
          )}
        </>
      )}
      <div className="mt-3">
        <NoteField label="Run notes" value={run.notes ?? ''} onChange={(v) => set({ notes: v })} disabled={disabled} placeholder="Breathing felt much easier." testId="input-run-notes" rows={2} />
      </div>
    </article>
  );
}

export function WorkoutPanel({
  entry, days, disabled, onChange,
}: {
  entry: DayEntry; days: Days; disabled?: boolean; onChange: (fn: (w: WorkoutLog) => WorkoutLog) => void;
}) {
  const w = entry.workout!;
  const def = WORKOUTS[w.num as WorkoutNum];
  const completed = w.status === 'completed';
  const [justFinished, setJustFinished] = useState(false);
  let slots = 0;
  let doneSlots = 0;
  def.sections.forEach((s) => {
    if (s.kind === 'work') s.items.forEach((i) => { slots++; if (w.exercises[i.id]?.status === 'done') doneSlots++; });
  });

  return (
    <div className="grid gap-4" data-testid={`panel-workout-${w.num}`}>
      <div className="rounded-[1.75rem] p-5 relative overflow-hidden text-[hsl(40_60%_96%)] bg-gradient-to-br from-[hsl(20_34%_30%)] via-[hsl(16_40%_36%)] to-[hsl(14_48%_46%)] shadow-[0_20px_40px_-24px_hsl(16_45%_25%/.8)]">
        <svg viewBox="0 0 200 200" className="absolute -right-10 -top-8 w-48 opacity-20" aria-hidden="true">
          <path d="M30 180 C 40 90, 110 30, 190 20 C 180 110, 120 170, 30 180 Z" fill="hsl(40 60% 80%)" />
          <path d="M30 180 L 150 60" stroke="hsl(20 30% 30%)" strokeWidth="2" />
        </svg>
        <div className="relative">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-[0.18em] font-semibold text-[hsl(40_60%_82%)]">Workout {w.num} of 5</span>
            <span className={cn('text-[0.7rem] font-bold uppercase tracking-wider rounded-full px-2 py-0.5', completed ? 'bg-[hsl(96_30%_80%)] text-[hsl(100_30%_22%)]' : 'bg-[hsl(40_60%_90%/.2)] text-[hsl(40_60%_92%)]')} data-testid="status-workout">
              {completed ? 'Completed' : 'In progress'}
            </span>
          </div>
          <h3 className="font-display text-[2rem] leading-[1.05] font-semibold mt-2">{def.title}</h3>
          <p className="text-[0.95rem] text-[hsl(38_45%_85%)] mt-2 leading-relaxed">{def.description}</p>
          <div className="mt-4 h-1.5 rounded-full bg-[hsl(40_60%_90%/.2)] overflow-hidden">
            <div className="h-full rounded-full bg-[hsl(40_60%_75%)] origin-left transition-transform duration-500" style={{ transform: `scaleX(${slots ? doneSlots / slots : 0})` }} />
          </div>
          <div className="text-xs mt-1.5 text-[hsl(38_45%_82%)]">{doneSlots} of {slots} exercises checked off</div>
        </div>
      </div>

      {def.sections.map((s, idx) => {
        if (s.kind === 'prep')
          return (
            <PrepList
              key={idx}
              title={s.title}
              items={s.items}
              marks={w.prep}
              disabled={disabled}
              testPrefix={`prep-${idx}`}
              onMark={(id, v) => onChange((wl) => {
                const prep = { ...wl.prep };
                if (v) prep[id] = v; else delete prep[id];
                return { ...wl, prep };
              })}
            />
          );
        if (s.kind === 'run')
          return <RunCard key={idx} date={entry.date} run={w.run ?? {}} disabled={disabled} onChange={(r) => onChange((wl) => ({ ...wl, run: r }))} />;
        return (
          <section key={idx} className="grid gap-3">
            <div className="flex items-center gap-3 px-1 pt-2">
              <h3 className="eyebrow text-terracotta">{s.title}</h3>
              <div className="h-px flex-1 bg-border" />
            </div>
            {s.items.map((slot) => (
              <ExerciseCard
                key={slot.id}
                slot={slot}
                log={w.exercises[slot.id]}
                days={days}
                date={entry.date}
                disabled={disabled}
                onChange={(l) => onChange((wl) => ({ ...wl, exercises: { ...wl.exercises, [slot.id]: l } }))}
              />
            ))}
          </section>
        );
      })}

      <div className="paper-card p-4">
        <NoteField
          label="Workout notes"
          value={w.notes}
          disabled={disabled}
          onChange={(v) => onChange((wl) => ({ ...wl, notes: v }))}
          placeholder="hip thrust felt easy · right side weaker · great energy"
          testId="input-workout-notes"
        />
      </div>

      <AnimatePresence mode="wait">
        {!completed ? (
          <motion.div key="finish" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <button
              type="button"
              disabled={disabled}
              data-testid="button-finish-workout"
              onClick={() => {
                setJustFinished(true);
                onChange((wl) => ({ ...wl, status: 'completed', completedAt: new Date().toISOString() }));
              }}
              className="w-full min-h-[62px] rounded-[1.25rem] bg-sage text-[hsl(40_60%_97%)] text-lg font-semibold flex items-center justify-center gap-2 shadow-[0_14px_28px_-14px_hsl(100_25%_25%/.7)] active:scale-[0.99] disabled:opacity-60"
            >
              <Flag className="size-5" /> Finish Workout
            </button>
            <p className="text-center text-xs text-muted-foreground mt-2">Everything is already saved. Finishing marks Workout {w.num} complete and moves you to the next session.</p>
          </motion.div>
        ) : (
          <motion.div
            key="done"
            initial={justFinished ? { opacity: 0, scale: 0.96 } : false}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-[1.5rem] border border-[hsl(96_20%_75%)] bg-sage-soft p-5 text-center"
            data-testid="status-workout-complete"
          >
            <motion.div
              initial={justFinished ? { scale: 0, rotate: -30 } : false}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.1 }}
              className="size-14 mx-auto rounded-full bg-sage text-[hsl(40_60%_97%)] flex items-center justify-center"
            >
              <Check className="size-7" strokeWidth={3} />
            </motion.div>
            <div className="font-display text-2xl font-semibold text-bark mt-3">Workout {w.num} complete</div>
            <p className="text-sm text-[hsl(100_18%_30%)] mt-1">Well done. Next time: Workout {(w.num % 5) + 1}.</p>
            {!disabled && (
              <button
                type="button"
                onClick={() => { setJustFinished(false); onChange((wl) => ({ ...wl, status: 'in_progress', completedAt: undefined })); }}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground min-h-11 px-3 rounded-full hover:bg-card"
                data-testid="button-reopen-workout"
              >
                <RotateCcw className="size-4" /> Reopen workout
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
