/**
 * Native theme bridge.
 *
 * Re-shapes the shared design tokens from @meals_client/core into a form React
 * Native's StyleSheet can consume, without duplicating any literal values:
 *
 *  - colors: core `palette` is already plain hex strings, which RN accepts
 *    verbatim — re-exported as a typed `colors` object (one source of truth with
 *    web; change a hex in core/tokens.ts and both platforms move together).
 *  - fonts: RN cannot use CSS font *stacks* (core `type.fontDisplay` is
 *    "'Lora', 'Georgia', serif"), so font *family names* come from ./fonts,
 *    which match the @expo-google-fonts registered names exactly.
 *  - layout: core `layout` values keep CSS px units ('64px'); RN wants unitless
 *    numbers, so they are parsed here rather than re-typed.
 *  - spacing: a small native-only scale (no core equivalent — web spaces via
 *    CSS, not a shared token), kept here so screens share one set of step values.
 */

import { palette, layout } from '@meals_client/core';
import { fontFamilies, fontRoles } from './fonts';

/** Strip a CSS px suffix to the unitless number RN style props expect. */
const px = (value: string): number => Number.parseFloat(value);

/**
 * Colors for RN style props. Same hex strings as web — sourced from core
 * `palette`, never re-typed here.
 */
export const colors = { ...palette } as const;

export type Colors = typeof colors;
export type ColorToken = keyof Colors;

/**
 * Layout dimensions as unitless numbers, parsed from core `layout`'s px values.
 *
 * `contentMaxWidth` is the web `#root` cap (640px); on native it is the max
 * width a centered content column should take on wide tablets.
 */
export const layoutDimensions = {
  navHeight: px(layout.navHeight),
  contentMaxWidth: px(layout.contentMaxWidth),
} as const;

export type LayoutDimensions = typeof layoutDimensions;

/**
 * Native spacing scale (4px base). Native-only: web has no shared spacing token,
 * so this introduces no divergence — it is a fresh source of truth for RN.
 */
export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export type Spacing = typeof spacing;
export type SpacingToken = keyof Spacing;

/** The assembled native theme — the object screens import from. */
export const theme = {
  colors,
  fonts: fontRoles,
  fontFamilies,
  layout: layoutDimensions,
  spacing,
} as const;

export type Theme = typeof theme;

export { fontFamilies, fontRoles } from './fonts';
export type { FontFamilyKey, FontFamilyName, FontRole } from './fonts';
