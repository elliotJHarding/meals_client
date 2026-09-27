import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import type { Calendar } from '@elliotJHarding/meals-api';
import {
  queryKeys,
  useCalendarAuthorized,
  useCalendars,
  useUpdateActiveCalendars,
} from '@meals_client/core';
import { theme } from '../../theme';
import { credentialProvider } from '../../platform/nativePlatform';
import { SignInCancelledError } from '../../platform/googleAuth';
import { AppText, Button, Card } from '../ui';

/**
 * The Google connection block: the offline-grant status and the calendars the
 * week reads. Native port of apps/web ProfileView's CalendarSection, reframed
 * around the offline grant because that is what the SPEC's nightly sweep and
 * the invalid_grant re-auth surface care about.
 *
 * Status is core's useCalendarAuthorized — tri-state like web: undefined while
 * in flight (render no dot yet), then a boolean. Any error maps to false (not
 * connected), the same offline-grant signal the server marks on invalid_grant.
 * useCalendars runs only once authorised; useUpdateActiveCalendars toggles the
 * active flag optimistically.
 *
 * Reconnect differs from web by platform: web full-page redirects to a consent
 * URL (useCalendarAuthUrl + window.location). Native has no DOM and no
 * in-app-browser dependency; instead it re-runs the same offline-grant Google
 * sign-in the login screen uses (credentialProvider.obtainCredential requests
 * the calendar + Gemini scopes with offlineAccess), then invalidates the
 * calendar queries so the status and list refresh. This re-establishes exactly
 * the grant the nightly sweep needs.
 */
export function GoogleConnectionSection() {
  const queryClient = useQueryClient();
  const { data: authorized } = useCalendarAuthorized();
  const { data: calendars = [] } = useCalendars(authorized === true);
  const updateActiveCalendars = useUpdateActiveCalendars();

  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  const onReconnect = async () => {
    setConnectError(null);
    setConnecting(true);
    try {
      await credentialProvider!.obtainCredential();
      // The grant is re-established server-side; refresh both calendar queries
      // so the status dot and the list reflect it.
      await queryClient.invalidateQueries({ queryKey: queryKeys.calendar.authorized });
      await queryClient.invalidateQueries({ queryKey: queryKeys.calendar.list });
    } catch (e) {
      if (e instanceof SignInCancelledError) return;
      setConnectError('Could not reconnect Google. Please try again.');
    } finally {
      setConnecting(false);
    }
  };

  const onToggle = (calendar: Calendar) => {
    // Pass the full intended list (toggle applied); the mutation writes it
    // optimistically into the cache and reverts on failure.
    const updated = calendars.map((c) =>
      c.id === calendar.id ? { ...c, active: !c.active } : c,
    );
    updateActiveCalendars.mutate(updated);
  };

  return (
    <View style={styles.section}>
      <View style={styles.head}>
        <AppText variant="displaySmall">Google</AppText>
        {authorized !== undefined ? (
          <View style={styles.status}>
            <View
              style={[
                styles.dot,
                { backgroundColor: authorized ? theme.colors.accent : theme.colors.error },
              ]}
            />
            <AppText variant="caption" color={authorized ? 'accent' : 'error'}>
              {authorized ? 'connected' : 'not connected'}
            </AppText>
          </View>
        ) : null}
      </View>

      {authorized === false ? (
        <View style={styles.disconnected}>
          <AppText variant="caption">
            Reconnect Google so the week can read your calendar and run AI features.
          </AppText>
          <Button
            label="Reconnect Google"
            onPress={onReconnect}
            loading={connecting}
          />
          {connectError ? (
            <AppText variant="caption" color="error">
              {connectError}
            </AppText>
          ) : null}
        </View>
      ) : null}

      {authorized === true && calendars.length === 0 ? (
        <AppText variant="caption">No calendars found on your Google account.</AppText>
      ) : null}

      {authorized === true && calendars.length > 0 ? (
        <Card style={styles.calendarList}>
          {calendars.map((calendar, index) => (
            <Pressable
              key={calendar.id ?? index}
              accessibilityRole="switch"
              accessibilityState={{ checked: !!calendar.active }}
              onPress={() => onToggle(calendar)}
              style={[styles.calendarRow, index > 0 && styles.calendarDivider]}
            >
              <View
                style={[styles.swatch, { backgroundColor: calendar.colour ?? theme.colors.rule }]}
              />
              <AppText variant="body" style={styles.calendarName}>
                {calendar.name ?? 'Calendar'}
              </AppText>
              <View
                style={[
                  styles.toggle,
                  calendar.active ? styles.toggleOn : styles.toggleOff,
                ]}
              >
                <View
                  style={[
                    styles.knob,
                    calendar.active ? styles.knobOn : styles.knobOff,
                  ]}
                />
              </View>
            </Pressable>
          ))}
        </Card>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  disconnected: {
    gap: theme.spacing.sm,
  },
  calendarList: {
    gap: theme.spacing.none,
  },
  calendarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  calendarDivider: {
    borderTopColor: theme.colors.rule,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  swatch: {
    width: 14,
    height: 14,
    borderRadius: 4,
  },
  calendarName: {
    flex: 1,
  },
  toggle: {
    width: 40,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: 'center',
  },
  toggleOn: {
    backgroundColor: theme.colors.accent,
  },
  toggleOff: {
    backgroundColor: theme.colors.rule,
  },
  knob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.paper,
  },
  knobOn: {
    alignSelf: 'flex-end',
  },
  knobOff: {
    alignSelf: 'flex-start',
  },
});
