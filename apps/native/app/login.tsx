import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@meals_client/core';
import { theme } from '../theme';
import { credentialProvider } from '../platform/nativePlatform';
import { SignInCancelledError } from '../platform/googleAuth';
import { onReauthRequired, type ReauthReason } from '../platform/reauth';

// iOS sign-in is intentionally disabled: no iOS-type OAuth client is provisioned
// (see AUTH_SPIKE_NOTES.md). The button is shown but inert with a clear note, so
// the screen is honest about platform support rather than failing at runtime.
const IOS_SUPPORTED = false;

/**
 * Native sign-in screen.
 *
 * Android path is real: it runs the native Google sign-in (one consent yielding
 * idToken + serverAuthCode), the credential provider performs the authCode-bearing
 * /auth/login and stores the JWT pair, then core's useAuth().refreshUser() syncs
 * the user via whoAmI — no second /auth/login. The AuthGate redirects to the tabs
 * once `user` is set.
 *
 * iOS is a flagged TODO until an iOS OAuth client is provisioned.
 */
export default function LoginScreen() {
  const { refreshUser } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Surface the re-connect-Google state when arriving here after a refresh
  // failure — the SPEC principle is to never let an expired/invalid session fail
  // silently. The interceptor fires this before routing us back to /login.
  useEffect(() => {
    return onReauthRequired((reason: ReauthReason) => {
      setError(reauthMessage(reason));
    });
  }, []);

  const handleSignIn = async () => {
    setError(null);
    setBusy(true);
    try {
      // The provider runs native sign-in + the authCode /auth/login + token
      // storage (the single login POST); refreshUser() then resolves the user via
      // whoAmI against the now-stored bearer token — no redundant second login.
      await credentialProvider!.obtainCredential();
      await refreshUser();
      // Navigation is handled by AuthGate reacting to `user` becoming non-null.
    } catch (e) {
      if (e instanceof SignInCancelledError) {
        // User backed out of the sheet — not an error worth shouting about.
        return;
      }
      setError('Could not sign in with Google. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const isIos = Platform.OS === 'ios';
  const signInDisabled = busy || (isIos && !IOS_SUPPORTED);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.brand}>Grub</Text>
        <Text style={styles.tagline}>Plan the week. Shop once.</Text>

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          accessibilityRole="button"
          disabled={signInDisabled}
          onPress={handleSignIn}
          style={({ pressed }) => [
            styles.button,
            signInDisabled && styles.buttonDisabled,
            pressed && !signInDisabled && styles.buttonPressed,
          ]}
        >
          {busy ? (
            <ActivityIndicator color={theme.colors.paper} />
          ) : (
            <Text style={styles.buttonLabel}>Sign in with Google</Text>
          )}
        </Pressable>

        {isIos && !IOS_SUPPORTED && (
          // TODO(iOS auth): no iOS OAuth client is provisioned yet. Provision an
          // iOS-type client, set the bundle id + reversed-client-id iosUrlScheme
          // (app.json google-signin plugin), then flip IOS_SUPPORTED to true.
          <Text style={styles.note}>
            iOS sign-in is not available yet — coming soon.
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

function reauthMessage(_reason: ReauthReason): string {
  // Only 'refresh-failed' is emitted today (see platform/reauth.ts).
  return 'Your session expired. Please sign in again.';
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
  brand: {
    fontFamily: theme.fonts.displayBold,
    fontSize: 44,
    color: theme.colors.ink,
  },
  tagline: {
    fontFamily: theme.fonts.body,
    fontSize: 16,
    color: theme.colors.inkFaded,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xxl,
  },
  button: {
    backgroundColor: theme.colors.accent,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: 999,
    minWidth: 240,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonLabel: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 16,
    color: theme.colors.paper,
  },
  error: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  note: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.inkFaint,
    marginTop: theme.spacing.lg,
    textAlign: 'center',
  },
});
