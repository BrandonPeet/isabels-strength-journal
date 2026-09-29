import { useEffect, type ReactNode } from 'react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { JournalProvider } from '@/store/journal';
import { Shell } from '@/components/journal/shell';
import { Sprig } from '@/components/journal/bits';
import Daily from '@/pages/daily';
import Weekly from '@/pages/weekly';
import Progress from '@/pages/progress';
import History from '@/pages/history';
import SettingsPage from '@/pages/settings';

function Router() {
  const [loc] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [loc]);
  return (
    <Shell>
      <RoutedErrorBoundary>
        <Switch>
          <Route path="/" component={Daily} />
          <Route path="/weekly" component={Weekly} />
          <Route path="/progress" component={Progress} />
          <Route path="/history" component={History} />
          <Route path="/settings" component={SettingsPage} />
          <Route component={NotFound} />
        </Switch>
      </RoutedErrorBoundary>
    </Shell>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function LoadingScreen() {
  return (
    <div className="min-h-[100dvh] max-w-2xl mx-auto px-4 pt-20 grid gap-4 content-start" aria-busy="true" aria-label="Opening your journal">
      <div className="skeleton-soft h-5 w-56" />
      <div className="skeleton-soft h-14 w-72" />
      <div className="grid grid-cols-2 gap-3 mt-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton-soft h-24" />)}
      </div>
      <div className="skeleton-soft h-48 mt-2" />
    </div>
  );
}

function LoadFailed({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-5">
      <div className="paper-card max-w-md p-7 text-center">
        <Sprig className="w-36 mx-auto text-clay mb-3" />
        <h1 className="font-display text-3xl font-semibold text-bark">Your journal couldn’t be opened</h1>
        <p className="text-muted-foreground mt-3 leading-relaxed">
          Your saved entries have not been touched. Nothing will be written until the journal loads correctly.
        </p>
        <p className="text-xs text-rose mt-3 break-words" data-testid="text-load-error">{message}</p>
        <button type="button" onClick={retry} className="mt-5 min-h-12 px-6 rounded-2xl bg-primary text-primary-foreground font-semibold" data-testid="button-retry-load">
          Try again
        </button>
        <p className="text-xs text-muted-foreground mt-4">If this keeps happening, close other tabs of the journal, or make sure Private Browsing is off.</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <TooltipProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <JournalProvider loading={<LoadingScreen />} failed={(m, r) => <LoadFailed message={m} retry={r} />}>
          <Router />
        </JournalProvider>
      </WouterRouter>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
