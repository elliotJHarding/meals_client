import { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { theme } from '../../theme';
import { AppText } from './AppText';

/**
 * Centred spinner for the brief window while a screen's query resolves.
 * Fills its parent so it can drop straight into a Screen's content area.
 */
export function LoadingState() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={theme.colors.accent} />
    </View>
  );
}

type EmptyStateProps = {
  /** What's absent, e.g. "No meals planned yet." */
  title: string;
  /** Optional one-line nudge on how to fill it. */
  message?: string;
  /** Optional action (e.g. a Button) rendered below the message. */
  children?: ReactNode;
};

/**
 * Centred empty placeholder for a screen or list with no data — the resting
 * state before the user adds their first meal / receipt / library item.
 */
export function EmptyState({ title, message, children }: EmptyStateProps) {
  return (
    <View style={styles.center}>
      <AppText variant="display" style={styles.title}>
        {title}
      </AppText>
      {message ? (
        <AppText variant="caption" style={styles.message}>
          {message}
        </AppText>
      ) : null}
      {children ? <View style={styles.action}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  title: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  action: {
    marginTop: theme.spacing.lg,
  },
});
