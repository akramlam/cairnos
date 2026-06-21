import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-[transform,background-color,border-color,box-shadow,filter] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/55 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        // Gradient pill with a crisp top highlight + soft colored lift.
        brand:
          'brand-gradient text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_6px_20px_-8px_rgba(99,102,241,0.7)] hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_10px_26px_-8px_rgba(99,102,241,0.85)] hover:brightness-[1.06] active:brightness-95',
        default:
          'border border-border bg-secondary text-secondary-foreground shadow-sm hover:border-foreground/15 hover:bg-secondary/70',
        outline:
          'border border-border bg-transparent text-foreground hover:border-foreground/20 hover:bg-foreground/[0.05]',
        ghost: 'text-foreground hover:bg-foreground/[0.06]',
        subtle:
          'border border-transparent bg-foreground/[0.05] text-foreground hover:bg-foreground/[0.09]',
        destructive:
          'bg-destructive text-destructive-foreground shadow-[0_6px_20px_-10px_var(--destructive)] hover:brightness-110 active:brightness-95',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-8 rounded-md px-3 text-xs',
        default: 'h-9 px-4',
        lg: 'h-11 rounded-xl px-6 text-[0.95rem]',
        icon: 'size-9',
        'icon-sm': 'size-8 rounded-md',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
