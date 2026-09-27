import { View, Text, StyleSheet } from 'react-native';
import { Link, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';

// Catch-all for unmatched routes (e.g. a stale deep link). Gives the user a way
// back to the Week tab rather than a dead end.
export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <SafeAreaView style={styles.screen}>
        <View style={styles.content}>
          <Text style={styles.title}>This page doesn't exist.</Text>
          <Link href="/" style={styles.link}>
            Go to your week
          </Link>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.paper,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  title: {
    fontFamily: theme.fonts.displaySemiBold,
    fontSize: 22,
    color: theme.colors.ink,
    textAlign: 'center',
  },
  link: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 16,
    color: theme.colors.accent,
    marginTop: theme.spacing.lg,
  },
});
