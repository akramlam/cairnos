import { Activity, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import { FadeIn } from '@/components/shared/motion';
import { BrainDump } from '@/components/capture/BrainDump';
import { useActivity } from '@/lib/queries';
import { fromNow } from '@/lib/format';

export function Inbox() {
  const activity = useActivity();

  return (
    <div>
      <PageHeader
        title="Inbox"
        description="Brain-dump everything on your mind, then let CairnOS organize it into action."
      />
      <div className="grid gap-5 lg:grid-cols-3">
        <FadeIn className="lg:col-span-2">
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg brand-gradient">
                <Sparkles className="size-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Brain dump</h3>
                <p className="text-xs text-muted-foreground">Write naturally - one line or many.</p>
              </div>
            </div>
            <BrainDump autoFocus />
          </Card>
        </FadeIn>

        <FadeIn delay={0.08}>
          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <Activity className="size-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Recent activity</h3>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {activity.data && activity.data.length > 0 ? (
                activity.data.map((log) => (
                  <div key={log.id} className="rounded-lg px-2 py-2 hover:bg-foreground/[0.03]">
                    <div className="text-sm">{log.summary}</div>
                    <div className="text-xs text-muted-foreground">{fromNow(log.createdAt)}</div>
                  </div>
                ))
              ) : (
                <div className="px-2 py-8 text-center text-sm text-muted-foreground">
                  No activity yet.
                </div>
              )}
            </div>
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}
