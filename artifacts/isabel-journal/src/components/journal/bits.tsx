import { Check, X } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { Mark } from '@/lib/types';

export function Sprig({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 60" className={className} fill="none" aria-hidden="true">
      <path d="M4 52 C 30 44, 60 30, 116 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      {[
        [22, 46, -30], [36, 40, 20], [50, 34, -35], [62, 28, 25], [76, 22, -40], [88, 17, 20], [100, 12, -45],
      ].map(([x, y, r], i) => (
        <ellipse
          key={i}
          cx={x}
          cy={y - (i % 2 ? -5 : 5)}
          rx="7"
          ry="2.6"
          transform={`rotate(${r} ${x} ${y - (i % 2 ? -5 : 5)})`}
          fill="currentColor"
          opacity={0.35 + (i % 3) * 0.15}
        />
      ))}
      <circle cx="114" cy="8" r="2.2" fill="hsl(40 52% 55%)" />
    </svg>
  );
}

export function Leaf({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M4 20 C 4 10, 10 4, 20 4 C 20 14, 14 20, 4 20 Z" fill="currentColor" opacity=".85" />
      <path d="M4 20 L 15 9" stroke="hsl(40 60% 97%)" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

export function SectionTitle({ eyebrow, title, right }: { eyebrow?: string; title: string; right?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3 mb-3 px-1">
      <div>
        {eyebrow && <div className="eyebrow mb-0.5">{eyebrow}</div>}
        <h2 className="font-display text-[1.7rem] leading-tight text-bark font-semibold">{title}</h2>
      </div>
      {right}
    </div>
  );
}

/** Large Yes / No question buttons */
export function YesNo({
  value, onChange, disabled, yesLabel = 'Yes', noLabel = 'No', testId,
}: {
  value?: 'yes' | 'no';
  onChange: (v: 'yes' | 'no') => void;
  disabled?: boolean;
  yesLabel?: string;
  noLabel?: string;
  testId: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-3" role="radiogroup">
      {(['yes', 'no'] as const).map((v) => {
        const active = value === v;
        const yes = v === 'yes';
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            data-testid={`button-${testId}-${v}`}
            onClick={() => onChange(v)}
            className={cn(
              'min-h-[58px] rounded-2xl border text-[1.05rem] font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100',
              active && yes && 'bg-sage text-[hsl(40_60%_97%)] border-sage shadow-[0_8px_20px_-10px_hsl(100_20%_30%/.6)]',
              active && !yes && 'bg-rose text-[hsl(40_60%_97%)] border-rose shadow-[0_8px_20px_-10px_hsl(356_40%_30%/.6)]',
              !active && 'bg-card border-border text-bark hover:bg-secondary/60',
            )}
          >
            <motion.span
              key={String(active)}
              initial={active ? { scale: 0.4, rotate: -20 } : false}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 18 }}
              className="inline-flex"
            >
              {yes ? <Check className="size-5" strokeWidth={2.6} /> : <X className="size-5" strokeWidth={2.6} />}
            </motion.span>
            {yes ? yesLabel : noLabel}
          </button>
        );
      })}
    </div>
  );
}

/** Compact complete / not-completed toggle for list items */
export function MarkToggle({
  value, onChange, disabled, testId, doneLabel = 'Complete', missedLabel = 'Not completed', label,
}: {
  value?: Mark;
  onChange: (v: Mark | undefined) => void;
  disabled?: boolean;
  testId: string;
  doneLabel?: string;
  missedLabel?: string;
  label: string;
}) {
  return (
    <div className="flex gap-2 shrink-0" role="group" aria-label={label}>
      <button
        type="button"
        disabled={disabled}
        aria-pressed={value === 'done'}
        aria-label={`${label}: ${doneLabel}`}
        data-testid={`button-${testId}-done`}
        onClick={() => onChange(value === 'done' ? undefined : 'done')}
        className={cn(
          'size-12 rounded-full border flex items-center justify-center transition-all active:scale-90 disabled:opacity-60',
          value === 'done' ? 'bg-sage border-sage text-[hsl(40_60%_97%)]' : 'bg-card border-border text-sage/80 hover:bg-sage-soft',
        )}
      >
        <motion.span
          key={value === 'done' ? 'on' : 'off'}
          initial={value === 'done' ? { scale: 0.3 } : false}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 600, damping: 15 }}
          className="inline-flex"
        >
          <Check className="size-5" strokeWidth={2.8} />
        </motion.span>
      </button>
      <button
        type="button"
        disabled={disabled}
        aria-pressed={value === 'missed'}
        aria-label={`${label}: ${missedLabel}`}
        data-testid={`button-${testId}-missed`}
        onClick={() => onChange(value === 'missed' ? undefined : 'missed')}
        className={cn(
          'size-12 rounded-full border flex items-center justify-center transition-all active:scale-90 disabled:opacity-60',
          value === 'missed' ? 'bg-rose border-rose text-[hsl(40_60%_97%)]' : 'bg-card border-border text-rose/70 hover:bg-rose-soft',
        )}
      >
        <X className="size-5" strokeWidth={2.8} />
      </button>
    </div>
  );
}

export function StatCard({
  label, value, sub, tone = 'default', testId,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: 'default' | 'sage' | 'clay' | 'terracotta' | 'rose' | 'gold';
  testId: string;
}) {
  const tones = {
    default: 'from-[hsl(40_70%_98.5%)] to-[hsl(38_50%_95%)]',
    sage: 'from-[hsl(96_30%_94%)] to-[hsl(96_22%_88%)]',
    clay: 'from-[hsl(34_45%_93%)] to-[hsl(32_35%_86%)]',
    terracotta: 'from-[hsl(18_60%_93%)] to-[hsl(14_45%_86%)]',
    rose: 'from-[hsl(356_50%_96%)] to-[hsl(356_35%_90%)]',
    gold: 'from-[hsl(44_70%_93%)] to-[hsl(40_50%_85%)]',
  } as const;
  return (
    <div
      data-testid={testId}
      className={cn('rounded-[1.25rem] border border-card-border bg-gradient-to-br p-3.5 shadow-[0_8px_20px_-16px_hsl(20_40%_25%/.45)] min-w-0', tones[tone])}
    >
      <div className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground leading-tight">{label}</div>
      <div className="font-display text-[1.9rem] leading-none mt-1.5 text-bark font-semibold truncate">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1 leading-snug">{sub}</div>}
    </div>
  );
}

export function EmptyState({ title, body, children }: { title: string; body: string; children?: ReactNode }) {
  return (
    <div className="paper-card px-6 py-10 text-center relative overflow-hidden">
      <Sprig className="w-40 mx-auto text-sage mb-4" />
      <h3 className="font-display text-2xl text-bark font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-2 max-w-xs mx-auto leading-relaxed">{body}</p>
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

export function Pill({ tone, children, testId }: { tone: 'sage' | 'rose' | 'clay' | 'gold' | 'muted'; children: ReactNode; testId?: string }) {
  const t = {
    sage: 'bg-sage-soft text-[hsl(100_25%_28%)] border-[hsl(96_20%_78%)]',
    rose: 'bg-rose-soft text-[hsl(356_40%_38%)] border-[hsl(356_35%_85%)]',
    clay: 'bg-clay-soft text-[hsl(26_30%_30%)] border-[hsl(32_28%_76%)]',
    gold: 'bg-gold-soft text-[hsl(36_50%_28%)] border-[hsl(40_45%_75%)]',
    muted: 'bg-muted text-muted-foreground border-border',
  }[tone];
  return (
    <span data-testid={testId} className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold', t)}>
      {children}
    </span>
  );
}
