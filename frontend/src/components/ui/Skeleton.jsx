import { cn } from '../../lib/cn';

export function Skeleton({ className }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded bg-soil-200/80', className)} />;
}

/** Loading placeholder mirroring the StatCard layout (design-system.md). */
export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-soil-200 dark:border-soil-200/60 bg-surface p-4 md:p-5">
      <Skeleton className="h-10 w-10 rounded-lg" />
      <Skeleton className="mt-3 h-4 w-24" />
      <Skeleton className="mt-2 h-7 w-16" />
    </div>
  );
}
