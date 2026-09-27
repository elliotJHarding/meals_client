/**
 * Design tokens for the Meals client, shared across web and native.
 *
 * Single source of truth, mirrored from apps/web/src/styles/theme.css :root.
 * Plain TS — no CSS, no react-native imports — so a web CSS-var emitter and a
 * native StyleSheet can both consume the same values.
 *
 * Palette/type/layout values are byte-identical to theme.css. Each token also
 * carries its `--kebab-case` CSS-variable name so a web emitter can regenerate
 * the `:root` block from this object and keep web styling unchanged.
 *
 * Note on `contentMaxWidth`: this is the 640px `max-width` on `#root`
 * (theme.css line 53), NOT a `:root` custom property — there is no
 * `--content-max-width` in the stylesheet. It is included here as a real
 * layout value, but a CSS-var emitter should skip it (cssVar is null).
 */

/** Page background, sage paper. */
export const palette = {
  paper: '#f3f4ed',
  paperRaised: '#e7eeda',
  ink: '#272b20',
  inkFaded: '#76806a',
  inkFaint: '#a8b29a',
  rule: '#d8e0c8',
  accent: '#50652c',
  accentSoft: '#d2eca5',
  sage: '#6b9992',
  sageSoft: '#e1ebe9',
  error: '#a4452c',
} as const;

/** Font-family stacks. Lora/Montserrat are loaded elsewhere, not in theme.css. */
export const type = {
  fontDisplay: "'Lora', 'Georgia', serif",
  fontBody: "'Montserrat', 'Helvetica Neue', sans-serif",
} as const;

/** Layout dimensions. Values keep their CSS units (px); strip for native if needed. */
export const layout = {
  /** --nav-height: bottom-nav height. */
  navHeight: '64px',
  /** #root max-width (not a :root var — see module note). */
  contentMaxWidth: '640px',
} as const;

/** The full token set, grouped by concern. */
export const tokens = {
  palette,
  type,
  layout,
} as const;

/**
 * Maps each token key to the `--kebab-case` CSS custom property it backs in
 * theme.css, or null where no `:root` var exists. A web emitter can walk this
 * to regenerate the `:root` block from `tokens`.
 */
export const cssVarNames = {
  palette: {
    paper: '--paper',
    paperRaised: '--paper-raised',
    ink: '--ink',
    inkFaded: '--ink-faded',
    inkFaint: '--ink-faint',
    rule: '--rule',
    accent: '--accent',
    accentSoft: '--accent-soft',
    sage: '--sage',
    sageSoft: '--sage-soft',
    error: '--error',
  },
  type: {
    fontDisplay: '--font-display',
    fontBody: '--font-body',
  },
  layout: {
    navHeight: '--nav-height',
    contentMaxWidth: null,
  },
} as const;

export type Palette = typeof palette;
export type Type = typeof type;
export type Layout = typeof layout;
export type Tokens = typeof tokens;

export type PaletteToken = keyof Palette;
export type TypeToken = keyof Type;
export type LayoutToken = keyof Layout;
