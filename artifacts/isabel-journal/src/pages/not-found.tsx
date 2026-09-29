import { Link } from 'wouter';
import { EmptyState } from '@/components/journal/bits';

export default function NotFound() {
  return (
    <div className="pt-6">
      <EmptyState title="This page wandered off" body="There is nothing here, but today’s entry is just a tap away.">
        <Link href="/" className="inline-flex min-h-12 items-center px-6 rounded-2xl bg-primary text-primary-foreground font-semibold" data-testid="link-back-daily">
          Back to Daily
        </Link>
      </EmptyState>
    </div>
  );
}
