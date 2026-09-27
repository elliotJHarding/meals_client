import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';
import { theme } from '../../theme';

/**
 * Type-scale variants. `display*` map to Lora (headings), `body*` to Montserrat
 * — the same role split core's `type` tokens carry. Each variant fixes a font
 * role (so weight === a loaded font, never a system fallback), a size and an
 * ink colour; pass `color`/`style` to override per use.
 */
export type AppTextVariant =
  | 'displayLarge'
  | 'display'
  | 'displaySmall'
  | 'body'
  | 'bodyStrong'
  | 'caption';

type AppTextProps = TextProps & {
  variant?: AppTextVariant;
  /** Override the variant's default ink colour with any palette token. */
  color?: keyof typeof theme.colors;
};

/**
 * The single text component for the app. Screens pick a `variant` rather than
 * hand-assembling fontFamily/fontSize/color, so the type scale stays in one place.
 */
export function AppText({
  variant = 'body',
  color,
  style,
  ...rest
}: AppTextProps) {
  const colorStyle: TextStyle | undefined = color
    ? { color: theme.colors[color] }
    : undefined;
  return <Text style={[styles[variant], colorStyle, style]} {...rest} />;
}

const styles = StyleSheet.create({
  displayLarge: {
    fontFamily: theme.fonts.displayBold,
    fontSize: 32,
    color: theme.colors.ink,
  },
  display: {
    fontFamily: theme.fonts.displaySemiBold,
    fontSize: 24,
    color: theme.colors.ink,
  },
  displaySmall: {
    fontFamily: theme.fonts.displayMedium,
    fontSize: 18,
    color: theme.colors.ink,
  },
  body: {
    fontFamily: theme.fonts.body,
    fontSize: 15,
    color: theme.colors.ink,
  },
  bodyStrong: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 15,
    color: theme.colors.ink,
  },
  caption: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.inkFaded,
  },
});
