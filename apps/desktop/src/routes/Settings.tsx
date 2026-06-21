import { useEffect, useState } from 'react';
import { Check, Cpu, Download, Loader2, Server, Terminal } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/PageHeader';
import { Field } from '@/components/shared/Field';
import { FadeIn } from '@/components/shared/motion';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useSettings, useUpdateSettings } from '@/lib/queries';
import { api, type AiStatus } from '@/lib/api';
import { ACCENT_PRESETS } from '@/lib/accent';
import { cn } from '@/lib/utils';

export function Settings() {
  const settings = useSettings();
  const update = useUpdateSettings();

  const [displayName, setDisplayName] = useState('');
  const [reminderLead, setReminderLead] = useState('');
  const [exporting, setExporting] = useState(false);

  // AI engine
  const [aiBackend, setAiBackend] = useState<'rules' | 'ollama'>('rules');
  const [ollamaHost, setOllamaHost] = useState('');
  const [ollamaModel, setOllamaModel] = useState('');
  const [aiStatus, setAiStatus] = useState<AiStatus | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (settings.data) {
      setDisplayName(settings.data.displayName);
      setReminderLead(String(settings.data.reminderLeadMinutes));
      setAiBackend(settings.data.classifier);
      setOllamaHost(settings.data.ollamaHost);
      setOllamaModel(settings.data.ollamaModel);
    }
  }, [settings.data]);

  async function testAi() {
    setTesting(true);
    try {
      const status = await api.aiStatus(ollamaHost.trim());
      setAiStatus(status);
      if (status.reachable) {
        if (status.models.length && !status.models.includes(ollamaModel)) {
          setOllamaModel(status.models[0] ?? ollamaModel);
        }
        toast.success(`Connected - ${status.models.length} model(s) available`);
      } else {
        toast.error('Could not reach Ollama at that address');
      }
    } catch {
      toast.error('Could not reach Ollama');
    } finally {
      setTesting(false);
    }
  }

  function saveAi() {
    update.mutate({
      classifier: aiBackend,
      ollamaHost: ollamaHost.trim(),
      ollamaModel: ollamaModel.trim(),
    });
  }

  async function handleExport() {
    try {
      setExporting(true);
      const data = await api.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cairn-export.json';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Exported your data');
    } catch {
      toast.error('Could not export your data');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <PageHeader title="Settings" description="Make CairnOS yours." />

      <div className="mx-auto max-w-2xl space-y-5">
        {/* 1) Profile */}
        <FadeIn>
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>How CairnOS greets you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Display name">
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                />
              </Field>
              <div className="flex justify-end">
                <Button
                  variant="brand"
                  disabled={update.isPending || !displayName.trim()}
                  onClick={() => update.mutate({ displayName: displayName.trim() })}
                >
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        {/* 2) Notifications */}
        <FadeIn delay={0.04}>
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Stay ahead of what matters.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label>Enable notifications</Label>
                  <p className="text-xs text-muted-foreground">
                    Get a heads-up when reminders are due.
                  </p>
                </div>
                <Switch
                  checked={settings.data?.notificationsEnabled ?? false}
                  onCheckedChange={(v) => update.mutate({ notificationsEnabled: Boolean(v) })}
                />
              </div>

              <Separator />

              <Field
                label="Reminder lead time (minutes)"
                hint="How far in advance you'll be reminded."
              >
                <Input
                  type="number"
                  min={0}
                  value={reminderLead}
                  onChange={(e) => setReminderLead(e.target.value)}
                  placeholder="10"
                />
              </Field>
              <div className="flex justify-end">
                <Button
                  variant="brand"
                  disabled={update.isPending || reminderLead.trim() === ''}
                  onClick={() => update.mutate({ reminderLeadMinutes: Number(reminderLead) })}
                >
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        {/* 3) Appearance */}
        <FadeIn delay={0.08}>
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Tune the look of your workspace.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Field label="Theme">
                <Select
                  value={settings.data?.theme ?? 'dark'}
                  onValueChange={(v) =>
                    update.mutate({ theme: v as 'dark' | 'light' | 'system' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field
                label="Accent color"
                hint="Recolors buttons, links, and highlights across the app."
              >
                <div className="flex flex-wrap gap-2.5 pt-1">
                  {ACCENT_PRESETS.map((a) => {
                    const active = (settings.data?.accent ?? 'cairn') === a.key;
                    return (
                      <button
                        key={a.key}
                        type="button"
                        onClick={() => update.mutate({ accent: a.key })}
                        aria-label={a.name}
                        title={a.name}
                        className={cn(
                          'flex size-7 items-center justify-center rounded-full ring-2 ring-transparent ring-offset-2 ring-offset-background transition hover:scale-105',
                          active && 'ring-foreground/50',
                        )}
                        style={{ backgroundColor: a.swatch }}
                      >
                        {active && <Check className="size-3.5 text-white" />}
                      </button>
                    );
                  })}
                </div>
              </Field>
            </CardContent>
          </Card>
        </FadeIn>

        {/* 4) AI engine */}
        <FadeIn delay={0.1}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="size-4 text-primary" />
                AI engine
              </CardTitle>
              <CardDescription>Choose how your brain dumps get organized.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label>Use local AI</Label>
                  <p className="text-xs text-muted-foreground">
                    Run a real model on your own machine/server via Ollama. Off = fast offline rules.
                  </p>
                </div>
                <Switch
                  checked={aiBackend === 'ollama'}
                  onCheckedChange={(v) => setAiBackend(v ? 'ollama' : 'rules')}
                />
              </div>

              {aiBackend === 'ollama' && (
                <>
                  <Separator />
                  <Field label="Ollama host" hint="e.g. http://10.13.13.14:11434">
                    <Input
                      value={ollamaHost}
                      onChange={(e) => setOllamaHost(e.target.value)}
                      placeholder="http://localhost:11434"
                    />
                  </Field>
                  <Field label="Model">
                    {aiStatus?.reachable && aiStatus.models.length ? (
                      <Select value={ollamaModel} onValueChange={setOllamaModel}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {aiStatus.models.map((m) => (
                            <SelectItem key={m} value={m}>
                              {m}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={ollamaModel}
                        onChange={(e) => setOllamaModel(e.target.value)}
                        placeholder="qwen3:8b"
                      />
                    )}
                  </Field>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      onClick={testAi}
                      disabled={testing || !ollamaHost.trim()}
                      className="gap-1.5"
                    >
                      {testing ? <Loader2 className="size-4 animate-spin" /> : null}
                      Test connection
                    </Button>
                    {aiStatus && (
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span
                          className={`size-2 rounded-full ${aiStatus.reachable ? 'bg-emerald-400' : 'bg-rose-400'}`}
                        />
                        {aiStatus.reachable
                          ? `reachable · ${aiStatus.models.length} models`
                          : 'unreachable'}
                      </span>
                    )}
                  </div>
                </>
              )}

              <div className="flex justify-end">
                <Button variant="brand" disabled={update.isPending} onClick={saveAi}>
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        {/* 5) MCP server */}
        <FadeIn delay={0.14}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="size-4 text-primary" />
                MCP server
              </CardTitle>
              <CardDescription>Bring Claude Code into your workspace.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                The local MCP server lets Claude Code read and modify your projects, tasks, and
                reminders.
              </p>
              <div className="flex items-center gap-2 rounded-lg bg-foreground/[0.03] px-3 py-2.5">
                <Terminal className="size-3.5 shrink-0 text-muted-foreground" />
                <code className="rounded bg-foreground/5 px-2 py-1 font-mono text-xs">pnpm mcp:dev</code>
              </div>
              <Separator />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="size-2 shrink-0 rounded-full bg-amber-400/80 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                Configure in Claude Code - see docs/mcp-setup.md
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        {/* 5) Data */}
        <FadeIn delay={0.16}>
          <Card>
            <CardHeader>
              <CardTitle>Data</CardTitle>
              <CardDescription>Your data lives on your machine. Always.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <Label>Database location</Label>
                  <p className="font-mono text-xs text-muted-foreground">
                    %APPDATA%\Cairn\cairn.db (Windows)
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <Label>Export</Label>
                  <p className="text-xs text-muted-foreground">
                    Download a full JSON snapshot of everything.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="gap-1.5"
                  disabled={exporting}
                  onClick={handleExport}
                >
                  <Download className="size-4" />
                  Export data as JSON
                </Button>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}
