import { cn } from '@/lib/utils';

/** The CairnOS mark: a gradient tile with three stacked "stones" (a cairn). */
export function CairnMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cairn-mark" x1="2" y1="2" x2="38" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3B82F6" />
          <stop offset="0.5" stopColor="#6366F1" />
          <stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#cairn-mark)" />
      <ellipse cx="20" cy="29" rx="9.5" ry="4.1" fill="#fff" />
      <ellipse cx="20" cy="20.5" rx="6.6" ry="3.4" fill="#fff" fillOpacity="0.9" />
      <ellipse cx="20" cy="13.2" rx="4.1" ry="2.6" fill="#fff" fillOpacity="0.8" />
    </svg>
  );
}

export function CairnLogo({
  className,
  collapsed = false,
}: {
  className?: string;
  collapsed?: boolean;
}) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <CairnMark className="size-8 shrink-0 drop-shadow-[0_4px_12px_rgba(99,102,241,0.45)]" />
      {!collapsed && <span className="text-[1.05rem] font-semibold tracking-tight">CairnOS</span>}
    </div>
  );
}
