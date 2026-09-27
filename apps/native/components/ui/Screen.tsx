import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { theme } from '../../theme';

type ScreenProps = {
  children: ReactNode;
  /**
   * Safe-area edges to inset. Defaults to top/left/right — the bottom is owned
   * by the tab bar (see (tabs)/_layout.tsx), so tab screens must not also pad it.
   */
  edges?: readonly Edge[];
  /** Pad the content column with the standard horizontal gutter. Default true. */
  padded?: boolean;
  style?: ViewStyle;
};

/**
 * The paper-background safe-area shell every screen sits in.
 *
 * Centres a content column capped at `theme.layout.contentMaxWidth` so wide
 * tablets get a readable measure rather than full-bleed text, mirroring web's
 * `#root` max-width.
 */
export function Screen({
  children,
  edges = ['top', 'left', 'right'],
  padded = true,
  style,
}: ScreenProps) {
  return (
    <SafeAreaView style={styles.screen} edges={edges}>
      <View style={[styles.content, padded && styles.padded, style]}>
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
    width: '100%',
    maxWidth: theme.layout.contentMaxWidth,
    alignSelf: 'center',
  },
  padded: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
});
