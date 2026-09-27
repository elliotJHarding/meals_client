import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import {
  AuthProvider,
  MealsApiProvider,
  createQueryClient,
  useAuth,
} from '@meals_client/core';
import * as SplashScreen from 'expo-splash-screen';
import { ShareIntentProvider } from 'expo-share-intent';

import { apiClientConfig, authAdapters } from '../platform/nativePlatform';
import { onReauthRequired } from '../platform/reauth';
import { takePendingJoin } from '../platform/pendingJoin';

// Granular @expo-google-fonts subpath imports — the form documented for the
// SDK-56-era packages. These names double as the React Native font-family
// strings used in styles (e.g. fontFamily: 'Lora_700Bold'); the theme bridge
// maps core's CSS font stacks onto exactly these names.
import { useFonts } from '@expo-google-fonts/lora/useFonts';
import { Lora_400Regular } from '@expo-google-fonts/lora/400Regular';
import { Lora_500Medium } from '@expo-google-fonts/lora/500Medium';
import { Lora_600SemiBold } from '@expo-google-fonts/lora/600SemiBold';
import { Lora_700Bold } from '@expo-google-fonts/lora/700Bold';
import { Montserrat_400Regular } from '@expo-google-fonts/montserrat/400Regular';
import { Montserrat_500Medium } from '@expo-google-fonts/montserrat/500Medium';
import { Montserrat_600SemiBold } from '@expo-google-fonts/montserrat/600SemiBold';
import { Montserrat_700Bold } from '@expo-google-fonts/montserrat/700Bold';

// One QueryClient for the app lifetime. Its defaults (staleTime 0, retry false,
// no refetch-on-focus) live in core's createQueryClient so web and native share
// identical server-state behaviour. Created at module scope, not per-render, so
// the cache survives re-renders.
const queryClient = createQueryClient();

// Hold the splash screen until the fonts are ready, so no screen flashes in the
// system font before swapping to Lora/Montserrat.
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Every weight the theme bridge's font roles reference (theme/fonts.ts:
  // fontRoles) is loaded here, so role === loaded-weight exactly — no role can
  // silently fall back to the system font. Lora 400/500/600/700 back display*,
  // Montserrat 400/500/600/700 back body*.
  const [fontsLoaded, fontError] = useFonts({
    Lora_400Regular,
    Lora_500Medium,
    Lora_600SemiBold,
    Lora_700Bold,
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Keep the splash screen up while fonts load. A font *error* still releases
  // the gate (above) and renders with the system fallback rather than hanging.
  if (!fontsLoaded && !fontError) {
    return null;
  }

  // Provider order mirrors apps/web/src/main.tsx: QueryClient, then the api-client
  // seam (native bearer config), then AuthProvider (native adapters), then the
  // navigator. AuthGate sits inside AuthProvider so it can read the auth state.
  // ShareIntentProvider is outermost so the share-target route can read the
  // shared content on both cold start and warm share. resetOnBackground is off:
  // a share must survive the app briefly backgrounding while the ingest POST is
  // in flight — the share screen resets the intent itself after a successful send
  // (see app/share.tsx).
  return (
    <ShareIntentProvider options={{ resetOnBackground: false }}>
      <QueryClientProvider client={queryClient}>
        <MealsApiProvider config={apiClientConfig}>
          <AuthProvider adapters={authAdapters}>
            <StatusBar style="dark" />
            <AuthGate />
          </AuthProvider>
        </MealsApiProvider>
      </QueryClientProvider>
    </ShareIntentProvider>
  );
}

/**
 * RequireAuth-equivalent for expo-router.
 *
 * Core's AuthProvider owns the user/loading state (bootstrap via whoAmI on mount).
 * This gate routes on that state: unauthenticated users to /login, authenticated
 * users away from /login into the tabs. It also subscribes to the re-auth surface
 * so a refresh-token failure (raised from the non-React axios interceptor) sends
 * the user back to /login with a clear reason rather than failing silently.
 *
 * While loading we render the Stack but suppress navigation, so nothing flashes
 * before whoAmI resolves.
 */
function AuthGate() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // A refresh failure can happen at any time (background request) — when it does,
  // core has already cleared the token via logout-on-clear paths; force the user
  // to the login screen so the re-connect-Google surface is shown.
  useEffect(() => {
    return onReauthRequired(() => {
      router.replace('/login');
    });
  }, [router]);

  useEffect(() => {
    if (loading) return;
    const onLoginScreen = segments[0] === 'login';
    if (!user && !onLoginScreen) {
      router.replace('/login');
    } else if (user && onLoginScreen) {
      // A deep-link join that arrived while signed out parks its uuid before
      // we send the user here; on successful sign-in resume it by routing to
      // the join screen (which runs the mutation) instead of the default tab,
      // so the invite is honoured rather than silently dropped. The join screen
      // clears the parked uuid as it runs, so this fires once.
      const pendingJoin = takePendingJoin();
      router.replace(pendingJoin ? `/join/${pendingJoin}` : '/');
    }
  }, [user, loading, segments, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="login" />
      <Stack.Screen name="share" options={{ presentation: 'modal' }} />
      <Stack.Screen name="join/[uuid]" />
    </Stack>
  );
}
