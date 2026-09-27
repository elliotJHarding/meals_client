import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { formatDate, useWeekPlans } from '@meals_client/core';

import { AppText, LoadingState, Screen } from '../../components/ui';
import { DayBlock } from '../../components/week/DayBlock';
import { theme } from '../../theme';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Monday-normalise a date to 00:00 of that week's Monday (matches apps/web). */
const mondayOf = (date: Date): Date => {
  const monday = new Date(date);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return monday;
};

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * The Week screen — the app's home / daily-use surface, ported from apps/web's
 * WeekView. Renders a Monday-normalised seven-day week of dated day blocks, each
 * holding free-text meal entries shared across the family group.
 *
 * All server state and mutations come from core's `useWeekPlans(weekStart)`:
 *  - `planFor(date)` selects a day's plan from the per-week cache.
 *  - `addEntry` / `removeEntry` are the optimistic mutations — they write the
 *    new entry into the cache before the network resolves and roll back on
 *    error. `saveState` surfaces that lifecycle ('saving' / 'error').
 *
 * The per-week query key means revisiting a week renders instantly from cache;
 * `loading` only blocks render for the very first week ever loaded, so paging
 * between weeks fills in day blocks rather than flashing a full-page loader.
 */
export default function WeekScreen() {
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const { planFor, loading, saveState, addEntry, removeEntry } = useWeekPlans(weekStart);

  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekEnd = weekDates[6];
  const todayKey = formatDate(new Date());
  const onCurrentWeek = weekDates.some((date) => formatDate(date) === todayKey);

  const range =
    weekStart.getMonth() === weekEnd.getMonth()
      ? `${weekStart.getDate()}–${weekEnd.getDate()} ${weekStart.getFullYear()}`
      : `${weekStart.getDate()} ${MONTHS[weekStart.getMonth()].slice(0, 3)} – ${weekEnd.getDate()} ${MONTHS[weekEnd.getMonth()].slice(0, 3)} ${weekEnd.getFullYear()}`;

  const header = (
    <View style={styles.header}>
      <View style={styles.title}>
        <AppText variant="displayLarge" style={styles.month}>
          {MONTHS[weekStart.getMonth()]}
        </AppText>
        <AppText style={styles.range}>{range}</AppText>
      </View>
      <View style={styles.nav}>
        {!onCurrentWeek ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setWeekStart(mondayOf(new Date()))}
            style={({ pressed }) => [styles.todayPill, pressed && styles.pressed]}
          >
            <AppText style={styles.todayLabel}>today</AppText>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous week"
          onPress={() => setWeekStart((current) => addDays(current, -7))}
          style={({ pressed }) => [styles.arrow, pressed && styles.arrowPressed]}
        >
          <AppText style={styles.arrowGlyph}>{'‹'}</AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next week"
          onPress={() => setWeekStart((current) => addDays(current, 7))}
          style={({ pressed }) => [styles.arrow, pressed && styles.arrowPressed]}
        >
          <AppText style={styles.arrowGlyph}>{'›'}</AppText>
        </Pressable>
      </View>
    </View>
  );

  return (
    <Screen>
      {saveState !== 'idle' ? (
        <View style={[styles.saving, saveState === 'error' && styles.savingError]}>
          <AppText
            style={[styles.savingLabel, saveState === 'error' && styles.savingErrorLabel]}
          >
            {saveState === 'saving' ? 'saving…' : "couldn't save"}
          </AppText>
        </View>
      ) : null}

      {loading ? (
        <>
          {header}
          <LoadingState />
        </>
      ) : (
        <FlatList
          data={weekDates}
          keyExtractor={(date) => formatDate(date)}
          ListHeaderComponent={header}
          renderItem={({ item: date, index }) => (
            <DayBlock
              date={date}
              plan={planFor(date)}
              isToday={formatDate(date) === todayKey}
              isFirst={index === 0}
              onAdd={(text) => addEntry(date, text)}
              onRemove={(entryIndex) => removeEntry(date, entryIndex)}
            />
          )}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  title: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexShrink: 1,
    gap: theme.spacing.sm,
  },
  month: {
    fontFamily: theme.fonts.displayMedium,
    fontSize: 30,
    fontStyle: 'italic',
  },
  range: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: theme.colors.inkFaded,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  todayPill: {
    borderColor: theme.colors.accent,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginRight: theme.spacing.xs,
  },
  todayLabel: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: theme.colors.accent,
  },
  arrow: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowPressed: {
    backgroundColor: theme.colors.accentSoft,
  },
  arrowGlyph: {
    fontFamily: theme.fonts.body,
    fontSize: 24,
    lineHeight: 28,
    color: theme.colors.inkFaded,
  },
  pressed: {
    opacity: 0.7,
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
