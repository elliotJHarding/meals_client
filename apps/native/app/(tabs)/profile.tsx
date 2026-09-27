import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useAuth } from '@meals_client/core';
import { theme } from '../../theme';
import { Screen } from '../../components/ui/Screen';
import { AppText, Button, LoadingState } from '../../components/ui';
import { Avatar } from '../../components/profile/Avatar';
import { FamilyGroupSection } from '../../components/profile/FamilyGroupSection';
import { GoogleConnectionSection } from '../../components/profile/GoogleConnectionSection';

/**
 * The profile tab: who you are, your family group, and your Google connection.
 * Native port of apps/web ProfileView.
 *
 * Identity + sign-out come from core's useAuth (the same AppUserDto the web view
 * reads). The family-group and Google-connection blocks are self-contained
 * sections, each driving its own core hooks (useFamilyGroup / useCalendar*), so
 * this screen only composes them and owns the identity header and logout.
 *
 * Sign-out mirrors the login screen's contract: core's logout() drops the
 * session, and the AuthGate in app/_layout reacts to `user` becoming null by
 * routing back to /login — so there is no navigation call here. While auth is
 * bootstrapping (loading), the screen shows the shared spinner.
 */
export default function ProfileScreen() {
  const { user, loading, logout } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const onLogout = async () => {
    setSigningOut(true);
    try {
      await logout();
      // Navigation handled by the AuthGate reacting to `user` becoming null.
    } finally {
      setSigningOut(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.identity}>
          <Avatar pictureUrl={user?.pictureUrl} name={user?.name} size={72} />
          <AppText variant="displayLarge">{user?.name ?? 'You'}</AppText>
        </View>

        <FamilyGroupSection />
        <GoogleConnectionSection />

        <Button
          label="Sign out"
          variant="secondary"
          onPress={onLogout}
          loading={signingOut}
          style={styles.logout}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xxl,
  },
  identity: {
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  logout: {
    marginTop: theme.spacing.xxl,
  },
});
