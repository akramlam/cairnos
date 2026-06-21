import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-border bg-foreground/5 text-foreground',
        primary: 'border-transparent bg-primary/15 text-[#93c5fd]',
        violet: 'border-transparent bg-[#8b5cf6]/15 text-[#c4b5fd]',
        indigo: 'border-transparent bg-[#6366f1]/15 text-[#a5b4fc]',
        success: 'border-transparent bg-emerald-500/15 text-emerald-300',
        warning: 'border-transparent bg-amber-500/15 text-amber-300',
        danger: 'border-transparent bg-rose-500/15 text-rose-300',
        muted: 'border-border bg-transparent text-muted-foreground',
        outline: 'border-border bg-transparent text-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
