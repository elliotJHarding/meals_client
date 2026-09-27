import { memo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { formatDate, queryKeys, useCalendarEvents, useWeekPlans } from '@meals_client/core';
import { AppText, Button, EmptyState, LoadingState } from '../ui';
import { DayBlock } from './DayBlock';
import { addDays } from './dates';
import { theme } from '../../theme';
import { credentialProvider } from '../../platform/nativePlatform';
import { SignInCancelledError } from '../../platform/googleAuth';

type WeekListProps = {
  /** Monday of the week this page renders. */
  weekStart: Date;
  /** Whether this page shows meals or that day's calendar events. */
  mode: 'meals' | 'calendar';
};

/**
 * One week's scrollable list of day blocks — the swipeable page body of the
 * Week screen. Each page owns its own `useWeekPlans(weekStart)`, so the per-week
 * TanStack cache key means an off-screen adjacent week is fetched as the page
 * mounts and the centred week renders instantly from cache when swiped to.
 *
 * `saveState` and the optimistic `addEntry`/`removeEntry` mutations are scoped
 * to this page's week, so the "saving…" indicator reflects edits to the week the
 * user is actually looking at.
 */
function WeekListComponent({ weekStart, mode }: WeekListProps) {
  const { planFor, loading, saveState, addEntry, removeEntry } = useWeekPlans(weekStart);
  const { eventsFor, authorized } = useCalendarEvents(weekStart);

  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const todayKey = formatDate(new Date());

  const dayList = (
    <FlatList
      data={weekDates}
      keyExtractor={(date) => formatDate(date)}
      renderItem={({ item: date, index }) => (
        <DayBlock
          date={date}
          isToday={formatDate(date) === todayKey}
          isFirst={index === 0}
          mode={mode}
          plan={mode === 'meals' ? planFor(date) : undefined}
          events={mode === 'calendar' ? eventsFor(date) : undefined}
          onAdd={(text) => addEntry(date, text)}
          onRemove={(entryIndex) => removeEntry(date, entryIndex)}
        />
      )}
      contentContainerStyle={styles.list}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    />
  );

  const body = () => {
    if (mode === 'calendar') {
      // Tri-state: undefined while the authorised check is in flight, false →
      // prompt to connect, true → the week's events.
      if (authorized === undefined) return <LoadingState />;
      if (authorized === false) return <ConnectCalendarPrompt />;
      const hasAnyEvent = weekDates.some((date) => eventsFor(date).length > 0);
      if (!hasAnyEvent) return <EmptyState title="No events this week" />;
      return dayList;
    }
    return loading ? <LoadingState /> : dayList;
  };

  return (
    <View style={styles.page}>
      {saveState !== 'idle' ? (
        <View style={[styles.saving, saveState === 'error' && styles.savingError]}>
          <AppText
            style={[styles.savingLabel, saveState === 'error' && styles.savingErrorLabel]}
          >
            {saveState === 'saving' ? 'saving…' : "couldn't save"}
          </AppText>
        </View>
      ) : null}

      {body()}
    </View>
  );
}

/**
 * Shown in calendar mode when the offline grant is missing. Reuses the same
 * Google offline-grant sign-in the Profile screen's GoogleConnectionSection
 * uses (credentialProvider.obtainCredential requests the calendar + Gemini
 * scopes), then invalidates the calendar queries so the week refreshes.
 */
function ConnectCalendarPrompt() {
  const queryClient = useQueryClient();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onConnect = async () => {
    setError(null);
    setConnecting(true);
    try {
      await credentialProvider!.obtainCredential();
      await queryClient.invalidateQueries({ queryKey: queryKeys.calendar.authorized });
      await queryClient.invalidateQueries({ queryKey: queryKeys.calendar.list });
    } catch (e) {
      if (e instanceof SignInCancelledError) return;
      setError('Could not connect Google. Please try again.');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <EmptyState
      title="Connect your calendar"
      message="Connect Google so the week can show what you have on."
    >
      <Button label="Connect Google" onPress={onConnect} loading={connecting} />
      {error ? (
        <AppText variant="caption" color="error">
          {error}
        </AppText>
      ) : null}
    </EmptyState>
  );
}

/**
 * Memoised on the week's *value* (not the Date reference): the windowed pager in
 * the Week screen keeps the same weeks mounted across a swipe and only changes
 * which page is active, so a page whose week is unchanged must not re-render —
 * even though its `weekStart` prop is a fresh Date object each render.
 */
export const WeekList = memo(
  WeekListComponent,
  (prev, next) =>
    prev.mode === next.mode && formatDate(prev.weekStart) === formatDate(next.weekStart),
);

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  list: {
    // Clear the floating mode-switch pill (which sits just above the tab bar)
    // so the last day's last row is never hidden behind it.
    paddingBottom: theme.spacing.xxl + 56,
  },
  saving: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.md,
    zIndex: 20,
    backgroundColor: theme.colors.paperRaised,
    borderColor: theme.colors.rule,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  savingError: {
    backgroundColor: theme.colors.error,
    borderColor: theme.colors.error,
  },
  savingLabel: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    color: theme.colors.inkFaded,
  },
  savingErrorLabel: {
    color: theme.colors.paper,
  },
});
