import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import type { PlanDto } from '@elliotJHarding/meals-api';
import { theme } from '../../theme';
import { AppText } from '../ui';

type DayBlockProps = {
  date: Date;
  plan: PlanDto | undefined;
  isToday: boolean;
  /** First row in the week — no top rule above it (mirrors web's `.day-block + .day-block`). */
  isFirst: boolean;
  onAdd: (text: string) => void;
  onRemove: (index: number) => void;
};

const DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

/**
 * One dated day row of the week: a fixed-width date column (day-of-week + number)
 * and the free-text entries for that day, each removable, plus an inline
 * add-a-meal affordance.
 *
 * Mirrors apps/web DayBlock: tapping "add a meal" reveals an inline input;
 * committing on submit/blur fires `onAdd`, Escape cancels. Empty trimmed text is
 * dropped without a save. The entry `key` matches web (`id ?? freeText-index`)
 * so optimistic rows with no id still key cleanly.
 */
export function DayBlock({ date, plan, isToday, isFirst, onAdd, onRemove }: DayBlockProps) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');

  const commit = () => {
    const text = draft.trim();
    setDraft('');
    setAdding(false);
    if (text.length > 0) {
      onAdd(text);
    }
  };

  const planMeals = plan?.planMeals ?? [];

  return (
    <View style={[styles.block, !isFirst && styles.blockDivided]}>
      <View style={styles.dayLabel}>
        <AppText
          variant="caption"
          style={[styles.dow, isToday && styles.todayText]}
        >
          {DOW[date.getDay()]}
        </AppText>
        <AppText style={[styles.num, isToday && styles.todayText]}>
          {date.getDate()}
        </AppText>
        {isToday ? <View style={styles.todayUnderline} /> : null}
      </View>

      <View style={styles.entries}>
        {planMeals.map((planMeal, index) => (
          <View
            key={planMeal.id ?? `${planMeal.freeText}-${index}`}
            style={styles.entryRow}
          >
            {planMeal.meal != null ? <View style={styles.linkedDot} /> : null}
            <AppText style={styles.entryText}>
              {planMeal.freeText ?? planMeal.meal?.name}
            </AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Remove entry"
              hitSlop={8}
              onPress={() => onRemove(index)}
              style={({ pressed }) => [styles.remove, pressed && styles.removePressed]}
            >
              <AppText style={styles.removeGlyph}>{'×'}</AppText>
            </Pressable>
          </View>
        ))}

        {adding ? (
          <View style={styles.entryRow}>
            <TextInput
              autoFocus
              value={draft}
              placeholder="what's cooking?"
              placeholderTextColor={theme.colors.inkFaint}
              onChangeText={setDraft}
              onBlur={commit}
              onSubmitEditing={commit}
              returnKeyType="done"
              blurOnSubmit
              style={styles.input}
            />
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={() => setAdding(true)}
            style={({ pressed }) => [styles.addEntry, pressed && styles.addEntryPressed]}
          >
            <AppText style={styles.addPlus}>+</AppText>
            <AppText style={styles.addLabel}>
              {planMeals.length === 0 ? 'add a meal' : 'add another'}
            </AppText>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    flexDirection: 'row',
    gap: 14,
    paddingTop: 14,
    paddingBottom: 10,
  },
  blockDivided: {
    borderTopColor: theme.colors.rule,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  dayLabel: {
    width: 56,
    alignItems: 'center',
    paddingTop: 2,
  },
  dow: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 1.8,
    color: theme.colors.inkFaded,
  },
  num: {
    fontFamily: theme.fonts.displayMedium,
    fontSize: 29,
    lineHeight: 33,
    color: theme.colors.ink,
  },
  todayText: {
    color: theme.colors.accent,
  },
  todayUnderline: {
    width: 22,
    height: 3,
    borderRadius: 2,
    backgroundColor: theme.colors.accent,
    marginTop: 2,
  },
  entries: {
    flex: 1,
    justifyContent: 'center',
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 7,
    paddingBottom: 6,
    borderBottomColor: theme.colors.rule,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  linkedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.sage,
  },
  entryText: {
    flex: 1,
    fontSize: 17,
    color: theme.colors.ink,
  },
  remove: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    opacity: 0.7,
  },
  removePressed: {
    opacity: 1,
  },
  removeGlyph: {
    fontSize: 18,
    lineHeight: 18,
    color: theme.colors.inkFaint,
  },
  input: {
    flex: 1,
    fontFamily: theme.fonts.body,
    fontSize: 17,
    color: theme.colors.ink,
    padding: 0,
  },
  addEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 7,
    paddingBottom: 6,
  },
  addEntryPressed: {
    opacity: 0.7,
  },
  addPlus: {
    fontFamily: theme.fonts.display,
    fontSize: 19,
    lineHeight: 19,
    color: theme.colors.inkFaint,
  },
  addLabel: {
    fontSize: 17,
    color: theme.colors.inkFaint,
  },
});
