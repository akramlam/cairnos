/**
 * User-selectable accent ("principal color"). Each preset overrides the CSS
 * variables the whole UI is built on (--primary, --ring, --gradient-brand), so
 * switching one recolors buttons, links, focus rings, and brand gradients live
 * - in both light and dark themes.
 */
export interface AccentPreset {
  key: string;
  name: string;
  /** Representative dot color shown in the picker. */
  swatch: string;
  primary: string;
  ring: string;
  gradient: [string, string, string];
}

export const ACCENT_PRESETS: AccentPreset[] = [
  { key: 'cairn', name: 'CairnOS', swatch: '#6366f1', primary: '#3b82f6', ring: '#6366f1', gradient: ['#3b82f6', '#6366f1', '#8b5cf6'] },
  { key: 'indigo', name: 'Indigo', swatch: '#6366f1', primary: '#6366f1', ring: '#6366f1', gradient: ['#4f46e5', '#6366f1', '#818cf8'] },
  { key: 'violet', name: 'Violet', swatch: '#8b5cf6', primary: '#8b5cf6', ring: '#8b5cf6', gradient: ['#7c3aed', '#8b5cf6', '#a78bfa'] },
  { key: 'blue', name: 'Blue', swatch: '#3b82f6', primary: '#3b82f6', ring: '#3b82f6', gradient: ['#2563eb', '#3b82f6', '#60a5fa'] },
  { key: 'cyan', name: 'Cyan', swatch: '#06b6d4', primary: '#06b6d4', ring: '#06b6d4', gradient: ['#0891b2', '#06b6d4', '#22d3ee'] },
  { key: 'emerald', name: 'Emerald', swatch: '#10b981', primary: '#10b981', ring: '#10b981', gradient: ['#059669', '#10b981', '#34d399'] },
  { key: 'amber', name: 'Amber', swatch: '#f59e0b', primary: '#f59e0b', ring: '#f59e0b', gradient: ['#d97706', '#f59e0b', '#fbbf24'] },
  { key: 'rose', name: 'Rose', swatch: '#f43f5e', primary: '#f43f5e', ring: '#f43f5e', gradient: ['#e11d48', '#f43f5e', '#fb7185'] },
];

export const DEFAULT_ACCENT = 'cairn';

/** Apply an accent preset by overriding CSS variables on the document root. */
export function applyAccent(key: string): void {
  const preset = ACCENT_PRESETS.find((p) => p.key === key) ?? ACCENT_PRESETS[0];
  if (!preset) return;
  const s = document.documentElement.style;
  s.setProperty('--primary', preset.primary);
  s.setProperty('--ring', preset.ring);
  s.setProperty(
    '--gradient-brand',
    `linear-gradient(135deg, ${preset.gradient[0]} 0%, ${preset.gradient[1]} 48%, ${preset.gradient[2]} 100%)`,
  );
}
