import { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';

type ScreenPlaceholderProps = {
  /** Display heading — rendered in Lora over the paper background. */
  title: string;
  /** One-line note on what this screen will hold once wired up. */
  subtitle?: string;
  children?: ReactNode;
};

/**
 * The shared shell for the four tab screens in Phase 2.
 *
 * Each tab is currently a shell: paper background, an ink Lora heading, and a
 * faded note. The real data and hooks land in Phase 5; until then this keeps
 * the four screens visually consistent and reduces them to a title + note.
 *
 * `edges` excludes the bottom so content does not pad against the tab bar,
 * which already owns the bottom safe-area inset (see (tabs)/_layout.tsx).
 */
export function ScreenPlaceholder({
  title,
  subtitle,
  children,
}: ScreenPlaceholderProps) {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.paper,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    width: '100%',
    maxWidth: theme.layout.contentMaxWidth,
    alignSelf: 'center',
  },
  title: {
    fontFamily: theme.fonts.displayBold,
    fontSize: 32,
    color: theme.colors.ink,
  },
  subtitle: {
    fontFamily: theme.fonts.body,
    fontSize: 15,
    color: theme.colors.inkFaded,
    marginTop: theme.spacing.sm,
  },
});
