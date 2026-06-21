import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('relative overflow-hidden rounded-md bg-foreground/[0.04]', className)} {...props}>
      <div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-foreground/10 to-transparent"
        style={{ animation: 'cairn-shimmer 1.6s infinite' }}
      />
    </div>
  );
}
