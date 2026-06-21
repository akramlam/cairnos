import { useMemo, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import {
  addDays,
  addMonths,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight, Clock, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

/** Parse the datetime-local string (`yyyy-MM-ddTHH:mm`) into a Date, or null. */
function parse(value: string): Date | null {
  if (!value) return null;
  const d = parseISO(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

const toValue = (d: Date) => format(d, "yyyy-MM-dd'T'HH:mm");

/**
 * A premium date + time picker (calendar popover) that emits the same
 * `yyyy-MM-ddTHH:mm` string a native `<input type="datetime-local">` would,
 * so it's a drop-in replacement. Recolors with the active accent.
 */
export function DateTimePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const selected = parse(value);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<Date>(selected ?? new Date());

  const days = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(view), { weekStartsOn: 1 });
    return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  }, [view]);

  const pickDay = (day: Date) => {
    const h = selected ? selected.getHours() : 9;
    const m = selected ? selected.getMinutes() : 0;
    const d = new Date(day);
    d.setHours(h, m, 0, 0);
    onChange(toValue(d));
  };

  const setTime = (hhmm: string) => {
    const [hs, ms] = hhmm.split(':');
    const d = selected ? new Date(selected) : new Date();
    d.setHours(Number(hs ?? 0), Number(ms ?? 0), 0, 0);
    onChange(toValue(d));
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={cn(
            'flex h-9 w-full items-center gap-2 rounded-lg border border-border bg-foreground/[0.03] px-3 text-left text-sm shadow-sm transition-colors hover:border-foreground/20',
            !selected && 'text-muted-foreground',
          )}
        >
          <Calendar className="size-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 truncate">
            {selected ? format(selected, 'EEE, MMM d · h:mm a') : placeholder}
          </span>
          {selected && (
            <span
              role="button"
              tabIndex={-1}
              aria-label="Clear date"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
            >
              <X className="size-3.5" />
            </span>
          )}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          className="glass-strong z-50 w-[300px] rounded-xl border border-border p-3 shadow-2xl"
        >
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setView(subMonths(view, 1))}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
              aria-label="Previous month"
            >
              <ChevronLeft className="size-4" />
            </button>
            <div className="text-sm font-semibold">{format(view, 'MMMM yyyy')}</div>
            <button
              type="button"
              onClick={() => setView(addMonths(view, 1))}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
              aria-label="Next month"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground/60">
            {WEEKDAYS.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {days.map((day) => {
              const isSel = selected !== null && isSameDay(day, selected);
              const isToday = isSameDay(day, new Date());
              const outside = !isSameMonth(day, view);
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => pickDay(day)}
                  className={cn(
                    'flex size-9 items-center justify-center rounded-md text-sm transition-colors',
                    isSel
                      ? 'brand-gradient font-semibold text-white'
                      : 'hover:bg-foreground/[0.08]',
                    !isSel && outside && 'text-muted-foreground/40',
                    !isSel && !outside && isToday && 'font-semibold text-primary',
                  )}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
            <Clock className="size-4 shrink-0 text-muted-foreground" />
            <input
              type="time"
              value={selected ? format(selected, 'HH:mm') : '09:00'}
              onChange={(e) => setTime(e.target.value)}
              className="h-8 flex-1 rounded-md border border-border bg-foreground/[0.03] px-2 text-sm text-foreground"
            />
            <button
              type="button"
              onClick={() => pickDay(new Date())}
              className="rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
            >
              Today
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
