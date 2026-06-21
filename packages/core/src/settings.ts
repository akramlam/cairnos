import { getDb, schema, isDatabaseEmpty } from '@cairn/db';
import type { SettingsInput } from '@cairn/shared';

export interface AppSettings {
  displayName: string;
  theme: 'dark' | 'light' | 'system';
  notificationsEnabled: boolean;
  reminderLeadMinutes: number;
  classifier: 'rules' | 'ollama';
  ollamaHost: string;
  ollamaModel: string;
  onboarded: boolean;
  accent: string;
}

const DEFAULTS: AppSettings = {
  displayName: 'Akram',
  theme: 'dark',
  notificationsEnabled: true,
  reminderLeadMinutes: 10,
  classifier: 'rules',
  ollamaHost: 'http://localhost:11434',
  ollamaModel: 'qwen3:8b',
  onboarded: false,
  accent: 'cairn',
};

export function getSettings(): AppSettings {
  const db = getDb();
  const rows = db.select().from(schema.settings).all();
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const onboardedRaw = map.get('onboarded');
  return {
    displayName: map.get('displayName') ?? DEFAULTS.displayName,
    theme: (map.get('theme') as AppSettings['theme']) ?? DEFAULTS.theme,
    notificationsEnabled: map.get('notificationsEnabled')
      ? map.get('notificationsEnabled') === 'true'
      : DEFAULTS.notificationsEnabled,
    reminderLeadMinutes: map.get('reminderLeadMinutes')
      ? Number(map.get('reminderLeadMinutes'))
      : DEFAULTS.reminderLeadMinutes,
    classifier: (map.get('classifier') as AppSettings['classifier']) ?? DEFAULTS.classifier,
    ollamaHost: map.get('ollamaHost') ?? DEFAULTS.ollamaHost,
    ollamaModel: map.get('ollamaModel') ?? DEFAULTS.ollamaModel,
    // An explicit flag wins; otherwise a database that already has content is
    // treated as onboarded so existing installs never see the welcome screen.
    onboarded: onboardedRaw !== undefined ? onboardedRaw === 'true' : !isDatabaseEmpty(),
    accent: map.get('accent') ?? DEFAULTS.accent,
  };
}

export function updateSettings(input: SettingsInput): AppSettings {
  const db = getDb();
  const entries: Record<string, string> = {};
  if (input.displayName !== undefined) entries.displayName = input.displayName;
  if (input.theme !== undefined) entries.theme = input.theme;
  if (input.notificationsEnabled !== undefined)
    entries.notificationsEnabled = String(input.notificationsEnabled);
  if (input.reminderLeadMinutes !== undefined)
    entries.reminderLeadMinutes = String(input.reminderLeadMinutes);
  if (input.classifier !== undefined) entries.classifier = input.classifier;
  if (input.ollamaHost !== undefined) entries.ollamaHost = input.ollamaHost;
  if (input.ollamaModel !== undefined) entries.ollamaModel = input.ollamaModel;
  if (input.onboarded !== undefined) entries.onboarded = String(input.onboarded);
  if (input.accent !== undefined) entries.accent = input.accent;

  for (const [key, value] of Object.entries(entries)) {
    db.insert(schema.settings)
      .values({ key, value })
      .onConflictDoUpdate({ target: schema.settings.key, set: { value } })
      .run();
  }
  return getSettings();
}
