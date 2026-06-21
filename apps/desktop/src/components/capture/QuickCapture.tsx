import { Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUiStore } from '@/store/ui';
import { BrainDump } from './BrainDump';

export function QuickCapture() {
  const open = useUiStore((s) => s.quickCaptureOpen);
  const setOpen = useUiStore((s) => s.setQuickCaptureOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="max-w-xl"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            Quick capture
          </DialogTitle>
          <DialogDescription>Turn a messy brain dump into organized items.</DialogDescription>
        </DialogHeader>
        <BrainDump autoFocus onSaved={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
