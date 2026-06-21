# Design system

The visual language of **CairnOS** - a local-first AI productivity desktop app whose job is to **turn chaos into action.** This document is the single source of truth for the brand, design tokens, surfaces, components, and motion that make the product feel calm, fast, and premium.

---

## Brand

| Attribute  | Value                                                                 |
| ---------- | --------------------------------------------------------------------- |
| Name       | **CairnOS**                                                          |
| Tagline    | *Turn chaos into action.*                                             |
| Logo       | A gradient (blue → indigo → violet) tile with a layered white chevron "A" |

The logo mark is a rounded tile filled with the [brand gradient](#brand-gradient), with a layered white chevron forming the letter **A**. The chevron reads as both a letter and a "stack of layers being organized" - chaos becoming structure.

```
 ┌───────────────┐
 │      ╱╲       │   ← layered white chevron "A"
 │     ╱  ╲      │      on the blue→indigo→violet tile
 │    ╱ ── ╲     │
 └───────────────┘
```

**Voice & tone:** confident, quiet, and direct. The UI does the talking through clarity and motion, not through copy. Headings are large and assured; body text stays out of the way.

---

## Color tokens

CairnOS is **dark-first**. The palette is a deep neutral canvas lit by an electric blue → violet brand spectrum, with a small, unambiguous set of semantic colors.

### Core palette

| Token            | Hex       | Role                          |
| ---------------- | --------- | ----------------------------- |
| Electric Blue    | `#3B82F6` | Primary                       |
| Violet           | `#8B5CF6` | Accent                        |
| Indigo           | `#6366F1` | Ring / focus                  |
| Dark background   | `#0F1117` | App background                |
| Card             | `#14161F` | Card / elevated surface       |
| Muted text       | `#A1A1AA` | Secondary / muted text        |
| White            | `#F9FAFB` | Primary text / on-dark        |

### Semantic palette

| Token   | Hex       | Use                                  |
| ------- | --------- | ------------------------------------ |
| Success | `#34D399` | Confirmations, completed, healthy    |
| Warning | `#FBBF24` | Caution, due-soon, needs attention   |
| Danger  | `#F43F5E` | Errors, destructive actions, overdue |

### Brand gradient

The signature gradient - used on the logo tile, the primary `brand` button, the `Progress` fill, and accent flourishes.

```css
background: linear-gradient(135deg, #3B82F6 0%, #6366F1 48%, #8B5CF6 100%);
```

```
#3B82F6 ████████  #6366F1 ████████  #8B5CF6 ████████
 0%                48%                100%
```

> Use the gradient sparingly and intentionally. It signals *the primary action* or *brand identity* - overusing it dilutes its meaning.

---

## Typography

| Property   | Value                                                    |
| ---------- | -------------------------------------------------------- |
| Typeface   | **Inter** (bundled locally via `@fontsource-variable/inter`) |
| Tracking   | Tight - display headings use negative letter-spacing     |
| Display    | Large, **semibold** headings                             |

Inter is shipped locally as a variable font, so there are **no network font requests** - consistent with the local-first ethos. Display headings are large and semibold with tight tracking for a confident, modern feel; body copy stays at comfortable weights and sizes for long-form reading.

```tsx
// Display heading
<h1 className="text-4xl font-semibold tracking-tight text-foreground">
  Turn chaos into action.
</h1>
```

---

## Surfaces

CairnOS leans on **glassmorphism** over a deep, ambient canvas. Surfaces are translucent and layered, separated by hairline borders rather than heavy shadows.

### Glass utilities

| Utility         | Description                                                              |
| --------------- | ----------------------------------------------------------------------- |
| `.glass`        | Translucent layered background + `backdrop-blur` - default glass surface |
| `.glass-strong` | A heavier, more opaque glass for foreground panels (dialogs, popovers)   |

Both utilities combine a translucent layered background with `backdrop-blur` so content beneath shows through softly.

### Hairline borders

Borders are thin and low-contrast, drawn at:

```css
border-color: rgba(255, 255, 255, 0.08);
```

> **Always apply borders with an explicit color utility** - e.g. `border border-border`. Never rely on a default border color.

### Ambient aurora

A soft radial-gradient aurora sits behind the entire app via `body::before`, giving the dark canvas depth and a subtle sense of light without distracting from content.

```
        ╭─────────────────────────────╮
        │   ·  soft radial aurora  ·   │   body::before
        │ ╭───────────────────────╮ ·  │
        │ │   .glass surfaces      │    │   translucent + backdrop-blur
        │ ╰───────────────────────╯    │
        ╰─────────────────────────────╯
                 #0F1117 canvas
```

### Radius scale

| Token | Approx. value | Use                          |
| ----- | ------------- | ---------------------------- |
| `sm`  |               | Small controls, badges       |
| `md`  | ≈ `0.85rem`   | Default radius               |
| `lg`  |               | Cards, inputs                |
| `xl`  |               | Large panels                 |
| `2xl` |               | Dialogs, hero surfaces       |

### Surface helpers

| Helper        | Effect                                                              |
| ------------- | ------------------------------------------------------------------ |
| `.ring-glow`  | An indigo focus/emphasis glow around a surface or control          |
| `.card-hover` | A subtle lift + glow on hover for interactive cards                 |

---

## Tailwind v4 setup

Tokens are defined as **CSS variables** and mapped to Tailwind utilities. The app is **dark-first** - `<html class="dark">`.

1. Light tokens live in `:root`; dark tokens (the **default**) live in `.dark`.
2. `@theme inline` maps each CSS variable to a Tailwind utility name.

```css
:root {
  /* light theme tokens */
  --background: #ffffff;
  /* … */
}

.dark {
  /* dark theme tokens - the default */
  --background: #0F1117;
  --card: #14161F;
  --muted-foreground: #A1A1AA;
  --foreground: #F9FAFB;
  /* … */
}

@theme inline {
  --color-background: var(--background);
  --color-card: var(--card);
  --color-border: var(--border);
  /* … maps tokens → utilities like bg-background, bg-card, border-border */
}
```

Because tokens flow through `@theme inline`, utilities such as `bg-background`, `bg-card`, `text-muted-foreground`, and `border-border` automatically resolve to the active theme.

```html
<html class="dark">
  <!-- dark is the default; the app ships dark-first -->
</html>
```

> ## ⚠️ CALLOUT - never write unlayered universal-selector resets
>
> **NEVER** write an unlayered universal-selector CSS reset that touches `margin`, `padding`, or `border` - e.g.:
>
> ```css
> /* ☠️ DO NOT DO THIS */
> *, *::before, *::after { margin: 0; padding: 0; border: 0; }
> ```
>
> In Tailwind v4, **unlayered styles beat layered utilities regardless of specificity.** A single `* { padding: 0 }` silently kills every `px-*`, `py-*`, `mx-auto`, `gap-*`, etc. site-wide - the UI looks "randomly broken" even though the classes are present.
>
> Tailwind v4's **preflight already handles `box-sizing` and the necessary resets - leave it alone.** If a real reset is genuinely needed, wrap it in `@layer base { … }` so utilities still win:
>
> ```css
> @layer base {
>   /* any necessary reset goes here, inside a layer */
> }
> ```
>
> When debugging "spacing/centering doesn't work even though the classes are there," grep `globals.css` for `*, *::before, *::after` **first.**

---

## Components

shadcn-style primitives live in `src/components/ui`. They consume the design tokens, so they re-theme automatically.

### Button

**Variants:** `brand` (brand gradient) · `default` · `outline` · `ghost` · `subtle` · `destructive` · `link`
**Sizes:** `sm` · `default` · `lg` · `icon`

```tsx
<Button variant="brand" size="lg">Turn chaos into action</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost" size="icon"><Plus /></Button>
<Button variant="destructive">Delete</Button>
```

### Badge

**Variants:** `default` · `primary` · `violet` · `indigo` · `success` · `warning` · `danger` · `muted` · `outline`

```tsx
<Badge variant="success">Done</Badge>
<Badge variant="warning">Due soon</Badge>
<Badge variant="danger">Overdue</Badge>
```

### Primitive inventory

| Component        | Notes                                                  |
| ---------------- | ------------------------------------------------------ |
| `Button`         | Variants + sizes above                                 |
| `Card`           | Glass surface; pairs with `.card-hover`                |
| `Badge`          | Variants above                                         |
| `Input`          | Hairline border, focus ring (indigo)                   |
| `Textarea`       | Multi-line input                                       |
| `Select`         | Dropdown select                                        |
| `Dialog`         | Glass-strong modal with enter animation                |
| `Tabs`           | Segmented navigation                                   |
| `Checkbox`       | Boolean control                                        |
| `Switch`         | Toggle control                                         |
| `Progress`       | **Brand-gradient fill**                                |
| `Dropdown menu`  | Contextual actions                                     |
| `Tooltip`        | Hover/focus hints                                      |
| `Separator`      | Hairline divider                                       |
| `Skeleton`       | **Shimmer** loading placeholder                        |

---

## Motion

Motion is powered by **Framer Motion** and tuned to feel **subtle and premium** - never bouncy or attention-seeking. Movement communicates hierarchy and state; it should be felt more than noticed.

| Pattern                         | Where it's used                                           |
| ------------------------------- | --------------------------------------------------------- |
| Staggered page-load reveals     | `Stagger` / `StaggerItem` / `FadeIn` on page mount        |
| Card hover lift                 | Interactive cards (`.card-hover`)                         |
| Dialog enter animation          | `Dialog` opening                                          |
| Command-palette enter animation | ⌘/Ctrl+K palette opening                                  |
| Reminder toast pop-in           | Reminder/notification toasts                              |

```tsx
<Stagger>
  <StaggerItem><Card>…</Card></StaggerItem>
  <StaggerItem><Card>…</Card></StaggerItem>
</Stagger>

<FadeIn>
  <h1 className="text-4xl font-semibold tracking-tight">Today</h1>
</FadeIn>
```

**Principles**

- Reveals are **staggered**, not simultaneous - content arrives with rhythm.
- Hover states **lift** gently; they don't jump.
- Overlays (dialog, command palette) **enter**, they don't snap.
- Toasts **pop in** softly to draw the eye without alarming it.
