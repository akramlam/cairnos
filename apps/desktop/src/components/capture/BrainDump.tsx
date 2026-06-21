import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Bell,
  FileText,
  FolderKanban,
  Lightbulb,
  ListChecks,
  Loader2,
  Sparkles,
} from 'lucide-react';
import type { ExtractedItem, ItemType } from '@cairn/shared';
import { api } from '@/lib/api';
import { useSaveBrainDump } from '@/lib/queries';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PriorityBadge } from '@/components/shared/badges';
import { cn } from '@/lib/utils';

type ReviewItem = ExtractedItem & { include: boolean };

const TYPE_META: Record<ItemType, { label: string; icon: typeof ListChecks; tint: string }> = {
  task: { label: 'Task', icon: ListChecks, tint: 'text-[#93c5fd]' },
  project: { label: 'Project', icon: FolderKanban, tint: 'text-[#a5b4fc]' },
  idea: { label: 'Idea', icon: Lightbulb, tint: 'text-[#c4b5fd]' },
  note: { label: 'Note', icon: FileText, tint: 'text-emerald-300' },
  reminder: { label: 'Reminder', icon: Bell, tint: 'text-amber-300' },
};

const EXAMPLE =
  'tomorrow finish the launch deck, fix the signup bug, idea for referral rewards, remind me to email the team, prepare the Monday demo';

export function BrainDump({ onSaved, autoFocus }: { onSaved?: () => void; autoFocus?: boolean }) {
  const [text, setText] = useState('');
  const [items, setItems] = useState<ReviewItem[] | null>(null);
  const [classifying, setClassifying] = useState(false);
  const save = useSaveBrainDump();

  async function classify() {
    if (!text.trim()) return;
    setClassifying(true);
    try {
      const res = await api.braindump.classify(text);
      if (res.items.length === 0) {
        toast.message('Nothing to extract', { description: 'Try a few tasks, ideas, or reminders.' });
        return;
      }
      setItems(res.items.map((i) => ({ ...i, include: true })));
    } catch {
      toast.error('Could not reach the engine. Is it running?');
    } finally {
      setClassifying(false);
    }
  }

  function update(id: string, patch: Partial<ReviewItem>) {
    setItems((prev) => prev?.map((i) => (i.id === id ? { ...i, ...patch } : i)) ?? null);
  }

  async function commit() {
    const chosen = items?.filter((i) => i.include) ?? [];
    if (chosen.length === 0) return;
    try {
      await save.mutateAsync({
        items: chosen.map(({ include: _omit, ...rest }) => rest),
        sourceText: text,
      });
      toast.success(`Saved ${chosen.length} item${chosen.length > 1 ? 's' : ''}`, {
        description: 'Turned chaos into action.',
      });
      setText('');
      setItems(null);
      onSaved?.();
    } catch {
      toast.error('Could not save items.');
    }
  }

  const includedCount = items?.filter((i) => i.include).length ?? 0;

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {!items ? (
          <motion.div
            key="input"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-3"
          >
            <Textarea
              autoFocus={autoFocus}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Dump everything on your mind…"
              className="min-h-[140px] text-[0.95rem] leading-relaxed"
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') classify();
              }}
            />
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setText(EXAMPLE)}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Try an example
              </button>
              <Button variant="brand" onClick={classify} disabled={!text.trim() || classifying} className="gap-2">
                {classifying ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                {classifying ? 'Organizing…' : 'Organize'}
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="review"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <button
                onClick={() => setItems(null)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="size-3.5" /> Back to edit
              </button>
              <span className="text-xs text-muted-foreground">
                {items.length} detected · {includedCount} selected
              </span>
            </div>

            <div className="max-h-[46vh] space-y-2 overflow-y-auto pr-1">
              {items.map((item, idx) => {
                const Meta = TYPE_META[item.type];
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                    className={cn(
                      'glass rounded-lg p-3 transition-opacity',
                      !item.include && 'opacity-45',
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={item.include}
                        onCheckedChange={(v) => update(item.id, { include: Boolean(v) })}
                        className="mt-1"
                      />
                      <div className="min-w-0 flex-1 space-y-2">
                        <Input
                          value={item.title}
                          onChange={(e) => update(item.id, { title: e.target.value })}
                          className="h-8 border-transparent bg-transparent px-0 text-sm font-medium focus-visible:border-border focus-visible:bg-foreground/[0.03] focus-visible:px-2"
                        />
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Select
                            value={item.type}
                            onValueChange={(v) => update(item.id, { type: v as ItemType })}
                          >
                            <SelectTrigger className="h-7 w-[130px] text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(TYPE_META).map(([key, meta]) => (
                                <SelectItem key={key} value={key}>
                                  <span className="flex items-center gap-2">
                                    <meta.icon className={cn('size-3.5', meta.tint)} />
                                    {meta.label}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <PriorityBadge priority={item.priority} />
                          {item.dueDateLabel && (
                            <Badge variant="primary" className="capitalize">
                              {item.dueDateLabel}
                            </Badge>
                          )}
                          {item.projectSuggestion && (
                            <Badge variant="indigo">{item.projectSuggestion}</Badge>
                          )}
                          {item.tags.map((t) => (
                            <Badge key={t} variant="muted">
                              #{t}
                            </Badge>
                          ))}
                          <span className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground">
                            <span className="h-1 w-10 overflow-hidden rounded-full bg-foreground/10">
                              <span
                                className="block h-full brand-gradient"
                                style={{ width: `${Math.round(item.confidence * 100)}%` }}
                              />
                            </span>
                            {Math.round(item.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button variant="ghost" onClick={() => setItems(null)}>
                Cancel
              </Button>
              <Button
                variant="brand"
                onClick={commit}
                disabled={includedCount === 0 || save.isPending}
                className="gap-2"
              >
                {save.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                Save {includedCount} item{includedCount === 1 ? '' : 's'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
