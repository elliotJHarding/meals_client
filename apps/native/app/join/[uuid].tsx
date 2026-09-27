import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth, useJoinFamilyGroup } from '@meals_client/core';
import { theme } from '../../theme';
import { AppText, Button, LoadingState, Screen } from '../../components/ui';
import { setPendingJoin, takePendingJoin } from '../../platform/pendingJoin';

/**
 * Join-a-family-group deep link — the target of `grub://join/<uuid>` (and, once
 * the domain association is provisioned in Phase 8, `https://grubplanner.co.uk/
 * join/<uuid>`). expo-router maps this file to both the in-app route /join/:uuid
 * and the external deep link, with no manual linking config: the `grub://` prefix
 * is derived from app.json's `scheme`, and +native-intent.ts passes the path
 * through unchanged so expo-router resolves it here.
 *
 * It joins the group via the SAME core mutation the profile paste-a-code path
 * uses (useJoinFamilyGroup), feeding it the uuid from the URL instead of a typed
 * field. No bespoke axios — the mutation seeds the ['familyGroup'] cache on
 * success exactly as the profile join does.
 *
 * Auth handling — the gap this route must close itself: web's RequireAuth
 * redirects an unauthenticated /join tap to /login WITHOUT preserving the uuid,
 * so the join is silently dropped. Native's AuthGate is the same bare redirect,
 * so this screen parks the uuid (platform/pendingJoin) before the gate sends the
 * user to /login; after sign-in the AuthGate routes back to /join/<uuid> and the
 * mutation runs. A once-only ref mirrors web's `joined` guard against React 18's
 * dev double-invoke and any re-render.
 *
 * Cold start: when the app is launched by the link, useAuth().loading is true
 * until whoAmI resolves. We hold on the loading state and decide
 * authenticated-vs-resume only once loading === false, so a logged-in user is
 * never mis-routed to /login (AuthGate likewise suppresses navigation while
 * loading).
 */
export default function JoinGroupScreen() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const { user, loading } = useAuth();
  const router = useRouter();
  const joinFamilyGroup = useJoinFamilyGroup();

  // Once-only guard: the mutation must fire at most once even under React 18's
  // dev double-invoke or any re-render after `user` settles. Mirrors web's ref.
  const joined = useRef(false);

  const [status, setStatus] = useState<'joining' | 'done' | 'error'>('joining');

  useEffect(() => {
    // Cold-start auth timing: do not decide anything until whoAmI has resolved.
    if (loading) return;

    // A malformed or missing uuid (route hit without a code) — nothing to join.
    if (!uuid) {
      setStatus('error');
      return;
    }

    // Signed out: park the uuid so it survives the /login hop, then let the
    // AuthGate redirect to /login. The gate routes back here after sign-in.
    if (!user) {
      setPendingJoin(uuid);
      return;
    }

    if (joined.current) return;
    joined.current = true;

    // Clear any parked copy of this join now we are running it, so AuthGate does
    // not try to resume it again after we navigate away.
    takePendingJoin();

    joinFamilyGroup
      .mutateAsync(uuid)
      .then(() => {
        setStatus('done');
        router.replace('/(tabs)/profile');
      })
      .catch(() => {
        setStatus('error');
      });
  }, [loading, user, uuid, joinFamilyGroup, router]);

  // Signed out and waiting on the AuthGate to take us to /login, or still
  // bootstrapping auth on cold start: a neutral spinner, no decision shown yet.
  if (loading || (!user && status === 'joining')) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  if (status === 'error') {
    return (
      <Screen>
        <View style={styles.centred}>
          <AppText variant="display">Could not join that group</AppText>
          <AppText variant="caption" style={styles.gap}>
            {uuid
              ? 'The invite link did not work. Ask for a fresh one, or paste the code on your profile.'
              : 'This invite link is missing its code.'}
          </AppText>
          <Button
            label="Go to profile"
            variant="secondary"
            onPress={() => router.replace('/(tabs)/profile')}
            style={styles.gap}
          />
        </View>
      </Screen>
    );
  }

  // status === 'joining' with a user, or the brief 'done' frame before the
  // replace to /profile lands.
  return (
    <Screen>
      <View style={styles.centred}>
        <AppText variant="display">Joining the group…</AppText>
        <View style={styles.gap}>
          <LoadingState />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centred: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  gap: {
    marginTop: theme.spacing.md,
  },
});
