import { useRef, useState } from 'react';
import { Download, Share, ShieldAlert, Smartphone, Upload } from 'lucide-react';
import { useJournal } from '@/store/journal';
import { Switch } from '@/components/ui/switch';
import { ConfirmDialog } from '@/components/journal/confirm';
import { buildBackup, parseBackup, INVALID_BACKUP } from '@/lib/backup';
import { toKey } from '@/lib/dates';
import { DEFAULT_SETTINGS, dayHasContent, type DayEntry, type Settings } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { days, settings, updateSettings, restore } = useJournal();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<{ days: DayEntry[]; settings: Settings; name: string } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const count = Object.values(days).filter(dayHasContent).length;

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(buildBackup(days, settings), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `isabel-strength-journal-backup-${toKey(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast({ title: 'Backup downloaded', description: `${count} ${count === 1 ? 'day' : 'days'} included.` });
  };

  const onFile = async (f: File | undefined) => {
    setImportError(null);
    setPendingImport(null);
    if (!f) return;
    try {
      const parsed = parseBackup(await f.text());
      setPendingImport({ ...parsed, name: f.name });
    } catch {
      setImportError(INVALID_BACKUP);
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="grid gap-6">
      <section className="rise">
        <div className="eyebrow">Quietly in the background</div>
        <h1 className="font-display text-5xl font-semibold text-bark leading-none mt-1">Settings</h1>
        <p className="text-muted-foreground mt-2">Everything is stored privately on this device. No account, no internet needed.</p>
      </section>

      <section className="paper-card p-5 flex items-center justify-between gap-4">
        <div>
          <div className="font-semibold text-bark">Daily encouragement</div>
          <div className="text-sm text-muted-foreground">Scripture and gentle reminders on the Daily page</div>
        </div>
        <Switch checked={settings.showMessages} onCheckedChange={(v) => updateSettings({ showMessages: v })} aria-label="Show daily encouragement" data-testid="switch-messages" />
      </section>

      <section className="paper-card p-5 grid gap-3">
        <div>
          <div className="eyebrow">Backup</div>
          <p className="text-sm text-muted-foreground mt-1">Download a copy of the entire journal — daily logs, workouts, sets, runs, recovery, notes, settings and sequence position. Keep it in Files or email it to yourself.</p>
        </div>
        <button type="button" onClick={exportBackup} className="min-h-14 rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2" data-testid="button-export">
          <Download className="size-5" /> Export Backup
        </button>
        <button type="button" onClick={() => fileRef.current?.click()} className="min-h-14 rounded-2xl bg-card border border-border text-bark font-semibold flex items-center justify-center gap-2" data-testid="button-import">
          <Upload className="size-5" /> Import Backup
        </button>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} data-testid="input-import-file" />
        {importError && <p role="alert" className="rounded-2xl bg-rose-soft text-rose px-4 py-3 text-sm font-medium" data-testid="text-import-error">{importError}</p>}
      </section>

      <section className="rounded-[1.5rem] p-5 border border-[hsl(96_20%_78%)] bg-gradient-to-br from-[hsl(96_30%_94%)] to-[hsl(40_55%_93%)]" data-testid="card-install">
        <div className="flex items-center gap-2"><Smartphone className="size-5 text-sage" /><h2 className="font-display text-2xl font-semibold text-bark">Install Isabel’s Journal</h2></div>
        <ol className="mt-3 grid gap-2 text-bark">
          <li className="flex gap-3"><b className="font-display text-xl text-terracotta w-4">1</b> Open this page in Safari.</li>
          <li className="flex gap-3"><b className="font-display text-xl text-terracotta w-4">2</b> <span>Tap the Share button <Share className="inline size-4 -mt-1" />.</span></li>
          <li className="flex gap-3"><b className="font-display text-xl text-terracotta w-4">3</b> Choose “Add to Home Screen.”</li>
          <li className="flex gap-3"><b className="font-display text-xl text-terracotta w-4">4</b> Tap “Add.”</li>
        </ol>
        <p className="text-sm text-muted-foreground mt-3">Once installed, Isabel can open the journal from her Home Screen like an app — even without internet.</p>
      </section>

      <section className="pt-4 border-t border-border">
        {!showReset ? (
          <button type="button" onClick={() => setShowReset(true)} className="text-sm text-muted-foreground underline underline-offset-4 min-h-11" data-testid="button-show-reset">
            Advanced: reset journal data
          </button>
        ) : (
          <div className="rounded-[1.25rem] border border-[hsl(356_35%_82%)] bg-rose-soft/60 p-4">
            <div className="flex items-center gap-2 text-rose font-semibold"><ShieldAlert className="size-5" /> Reset Journal Data</div>
            <p className="text-sm text-bark mt-1.5">Permanently erases every entry on this device. Export a backup first — this cannot be undone.</p>
            <button type="button" onClick={() => setResetOpen(true)} className="mt-3 min-h-12 px-5 rounded-2xl border border-rose text-rose font-semibold bg-card" data-testid="button-reset">
              Reset all data…
            </button>
          </div>
        )}
      </section>

      <ConfirmDialog
        open={!!pendingImport}
        onOpenChange={(o) => !o && setPendingImport(null)}
        title="Import backup?"
        description="Importing this backup will replace the journal currently stored on this device. Continue?"
        confirmLabel="Replace & Import"
        onConfirm={async () => {
          if (!pendingImport) return;
          try {
            await restore(pendingImport.days, pendingImport.settings);
            toast({ title: 'Backup restored', description: `${pendingImport.days.length} days imported.` });
          } catch {
            toast({ title: 'Import failed', description: 'Nothing was changed. Your existing journal is intact.', variant: 'destructive' });
          }
        }}
      >
        {pendingImport && <p className="text-sm text-muted-foreground">File: {pendingImport.name} · {pendingImport.days.length} days</p>}
      </ConfirmDialog>

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        danger
        requireText="RESET"
        title="Erase the whole journal?"
        description={`This will permanently delete ${count} saved ${count === 1 ? 'day' : 'days'} from this device, including every workout, set, run and note.`}
        confirmLabel="Erase everything"
        onConfirm={async () => {
          try {
            await restore([], DEFAULT_SETTINGS);
            setShowReset(false);
            toast({ title: 'Journal reset', description: 'A fresh start.' });
          } catch {
            toast({ title: 'Reset failed', description: 'Nothing was deleted.', variant: 'destructive' });
          }
        }}
      />
    </div>
  );
}
