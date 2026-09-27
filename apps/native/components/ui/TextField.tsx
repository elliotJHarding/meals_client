import { forwardRef } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { theme } from '../../theme';
import { AppText } from './AppText';

type TextFieldProps = TextInputProps & {
  /** Optional caption above the input. */
  label?: string;
  /** Error message shown below; also recolours the border. */
  error?: string;
};

/**
 * A bordered text input on the raised-paper surface, used for free-text week
 * entry and receipt paste. Forwards its ref so a screen can focus it; grows for
 * multiline use when `multiline` is passed.
 */
export const TextField = forwardRef<TextInput, TextFieldProps>(
  function TextField({ label, error, style, multiline, ...rest }, ref) {
    return (
      <View style={styles.wrap}>
        {label ? (
          <AppText variant="caption" style={styles.label}>
            {label}
          </AppText>
        ) : null}
        <TextInput
          ref={ref}
          multiline={multiline}
          placeholderTextColor={theme.colors.inkFaint}
          style={[
            styles.input,
            multiline && styles.multiline,
            error ? styles.inputError : null,
            style,
          ]}
          {...rest}
        />
        {error ? (
          <AppText variant="caption" color="error" style={styles.error}>
            {error}
          </AppText>
        ) : null}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  label: {
    marginBottom: theme.spacing.xs,
  },
  input: {
    backgroundColor: theme.colors.paperRaised,
    borderColor: theme.colors.rule,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    color: theme.colors.ink,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: 'top',
    paddingTop: theme.spacing.sm,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  error: {
    marginTop: theme.spacing.xs,
  },
});
