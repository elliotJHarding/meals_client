import { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { theme } from '../../theme';

type CardProps = {
  children: ReactNode;
  style?: ViewStyle;
};

/**
 * A raised-paper surface bounded by the rule colour — the container for list
 * rows and grouped content (meals, library items, shop lines). Uses the
 * `paperRaised` token against the screen's `paper` so cards read as lifted
 * without a shadow.
 */
export function Card({ children, style }: CardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.paperRaised,
    borderColor: theme.colors.rule,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: theme.spacing.md,
  },
});
