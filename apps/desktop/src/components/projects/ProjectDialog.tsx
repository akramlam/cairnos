import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { PRIORITIES, PROJECT_COLORS } from '@cairn/shared';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Field } from '@/components/shared/Field';
import { useCreateProject } from '@/lib/queries';
import { useUiStore } from '@/store/ui';
import { cn } from '@/lib/utils';

const EMPTY = {
  name: '',
  description: '',
  objective: '',
  priority: 'medium',
  color: PROJECT_COLORS[0].value as string,
};

export function ProjectDialog() {
  const open = useUiStore((s) => s.newProjectOpen);
  const setOpen = useUiStore((s) => s.setNewProjectOpen);
  const create = useCreateProject();
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (open) setForm(EMPTY);
  }, [open]);

  function submit() {
    if (!form.name.trim()) return;
    create.mutate(
      {
        name: form.name.trim(),
        description: form.description.trim() || null,
        objective: form.objective.trim() || null,
        priority: form.priority,
        color: form.color,
      },
      { onSuccess: () => setOpen(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Name">
            <Input
              autoFocus
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Project name"
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
          </Field>
          <Field label="Objective">
            <Input
              value={form.objective}
              onChange={(e) => setForm({ ...form, objective: e.target.value })}
              placeholder="What does done look like?"
            />
          </Field>
          <Field label="Description">
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="min-h-[70px]"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Priority">
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p} className="capitalize">
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Color">
              <div className="flex flex-wrap items-center gap-2 pt-1.5">
                {PROJECT_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setForm({ ...form, color: c.value })}
                    className={cn(
                      'flex size-6 items-center justify-center rounded-full ring-2 ring-transparent transition',
                      form.color === c.value && 'ring-foreground/60',
                    )}
                    style={{ backgroundColor: c.value }}
                    aria-label={c.name}
                  >
                    {form.color === c.value && <Check className="size-3.5 text-white" />}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="brand" onClick={submit} disabled={!form.name.trim() || create.isPending}>
            Create project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
