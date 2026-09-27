import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { theme } from '../../theme';
import { AppText } from './AppText';

type ButtonProps = {
  label: string;
  onPress: () => void;
  /** Filled accent (default) or a quiet outline for secondary actions. */
  variant?: 'primary' | 'secondary';
  /** Show a spinner and block presses while an action is in flight. */
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

/**
 * The app's pill button. `primary` fills with the accent token; `secondary` is
 * an accent outline on the paper background. Loading swaps the label for a
 * spinner and disables the press, so callers drive one busy flag.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const isPrimary = variant === 'primary';
  const blocked = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: blocked, busy: loading }}
      disabled={blocked}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        blocked && styles.blocked,
        pressed && !blocked && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={isPrimary ? theme.colors.paper : theme.colors.accent}
        />
      ) : (
        <AppText
          variant="bodyStrong"
          color={isPrimary ? 'paper' : 'accent'}
        >
          {label}
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primary: {
    backgroundColor: theme.colors.accent,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderColor: theme.colors.accent,
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.85,
  },
  blocked: {
    opacity: 0.5,
  },
});
