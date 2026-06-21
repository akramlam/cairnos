import { useState } from 'react';
import { Plus, StickyNote } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Field } from '@/components/shared/Field';
import { Stagger, StaggerItem } from '@/components/shared/motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote } from '@/lib/queries';
import { fromNow } from '@/lib/format';
import type { Note } from '@cairn/shared';

type NoteForm = { title: string; body: string };

const EMPTY_FORM: NoteForm = { title: '', body: '' };

export function Notes() {
  const notes = useNotes();
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [form, setForm] = useState<NoteForm>(EMPTY_FORM);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = (note: Note) => {
    setEditing(note);
    setForm({ title: note.title, body: note.body });
    setOpen(true);
  };

  const close = () => setOpen(false);

  const title = form.title.trim();
  const canSave = title.length > 0 && !createNote.isPending && !updateNote.isPending;

  const handleSave = () => {
    if (!canSave) return;
    const data = { title, body: form.body };
    if (editing) {
      updateNote.mutate({ id: editing.id, data }, { onSuccess: close });
    } else {
      createNote.mutate(data, { onSuccess: close });
    }
  };

  const handleDelete = () => {
    if (!editing) return;
    deleteNote.mutate(editing.id);
    close();
  };

  return (
    <div>
      <PageHeader title="Notes" description="Quick thoughts and references.">
        <Button variant="brand" onClick={openCreate} className="gap-1.5">
          <Plus className="size-4" /> New note
        </Button>
      </PageHeader>

      {notes.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : notes.data && notes.data.length > 0 ? (
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notes.data.map((note) => (
            <StaggerItem key={note.id}>
              <Card
                onClick={() => openEdit(note)}
                className="card-hover flex h-full cursor-pointer flex-col gap-2 p-4"
              >
                <h3 className="font-medium leading-snug">{note.title}</h3>
                {note.body && (
                  <p className="line-clamp-4 whitespace-pre-wrap text-sm text-muted-foreground">
                    {note.body}
                  </p>
                )}
                <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2">
                  {note.tags.map((tag) => (
                    <Badge key={tag} variant="muted">
                      {tag}
                    </Badge>
                  ))}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {fromNow(note.updatedAt)}
                  </span>
                </div>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      ) : (
        <EmptyState
          icon={StickyNote}
          title="No notes yet"
          description="Capture a quick thought or reference to keep it close at hand."
          action={
            <Button variant="brand" onClick={openCreate} className="gap-1.5">
              <Plus className="size-4" /> New note
            </Button>
          }
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit note' : 'New note'}</DialogTitle>
            <DialogDescription>
              {editing
                ? 'Update this thought or reference.'
                : 'Jot down a quick thought or reference.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Field label="Title">
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Note title"
                autoFocus
              />
            </Field>
            <Field label="Body">
              <Textarea
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                placeholder="Write whatever you need to remember…"
                className="min-h-[180px]"
              />
            </Field>
          </div>

          <DialogFooter className="sm:justify-between">
            {editing ? (
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            ) : (
              <span className="hidden sm:block" />
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={close}>
                Cancel
              </Button>
              <Button variant="brand" onClick={handleSave} disabled={!canSave}>
                Save
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
