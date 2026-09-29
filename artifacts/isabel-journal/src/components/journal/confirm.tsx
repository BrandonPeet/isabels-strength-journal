import { useState, type ReactNode } from 'react';
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

export function ConfirmDialog({
  open, onOpenChange, title, description, confirmLabel, onConfirm, danger, requireText, children,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  onConfirm: () => void | Promise<void>;
  danger?: boolean;
  requireText?: string;
  children?: ReactNode;
}) {
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const ok = !requireText || typed.trim().toUpperCase() === requireText;
  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!busy) { onOpenChange(o); if (!o) setTyped(''); } }}>
      <AlertDialogContent className="rounded-[1.75rem] border-card-border bg-card max-w-[calc(100vw-2rem)] sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-2xl text-bark">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-[0.95rem] leading-relaxed text-muted-foreground">{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {children}
        {requireText && (
          <label className="block">
            <span className="text-sm text-bark">Type <b>{requireText}</b> to confirm</span>
            <input
              className="field mt-1.5"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              autoCapitalize="characters"
              data-testid="input-confirm-text"
            />
          </label>
        )}
        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel className="min-h-12 rounded-2xl mt-0" disabled={busy} data-testid="button-confirm-cancel">Cancel</AlertDialogCancel>
          <button
            type="button"
            disabled={!ok || busy}
            data-testid="button-confirm-ok"
            onClick={async () => {
              setBusy(true);
              try {
                await onConfirm();
                setTyped('');
                onOpenChange(false);
              } finally {
                setBusy(false);
              }
            }}
            className={cn(
              'min-h-12 rounded-2xl px-5 font-semibold text-[hsl(40_60%_97%)] disabled:opacity-50 transition-opacity',
              danger ? 'bg-rose' : 'bg-primary',
            )}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
