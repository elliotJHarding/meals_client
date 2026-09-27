import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, ChevronLeft, ChevronRight } from '../ui';
import { theme } from '../../theme';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

type WeekBarProps = {
  /** Monday of the week being shown. */
  weekStart: Date;
  /** Show the "today" pill — false when the visible week already contains today. */
  showToday: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
};

/**
 * The fixed top bar of the Week screen — month name, year and the week
 * controls (today pill + prev/next chevrons). Pinned above the swipeable week
 * body rather than scrolling with it, so the month/controls stay put and the
 * top safe-area space is used deliberately (was previously empty, with this
 * header scrolling away inside the list). Mirrors apps/web's `.week-header`.
 */
export function WeekBar({ weekStart, showToday, onPrev, onNext, onToday }: WeekBarProps) {
  const year = weekStart.getFullYear();

  return (
    <View style={styles.bar}>
      <View style={styles.title}>
        <AppText variant="displayLarge" style={styles.month}>
          {MONTHS[weekStart.getMonth()]}
        </AppText>
        <AppText style={styles.year}>{year}</AppText>
      </View>
      <View style={styles.nav}>
        {showToday ? (
          <Pressable
            accessibilityRole="button"
            onPress={onToday}
            style={({ pressed }) => [styles.todayPill, pressed && styles.pressed]}
          >
            <AppText style={styles.todayLabel}>today</AppText>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous week"
          onPress={onPrev}
          style={({ pressed }) => [styles.arrow, pressed && styles.arrowPressed]}
        >
          <ChevronLeft size={22} color={theme.colors.inkFaded} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next week"
          onPress={onNext}
          style={({ pressed }) => [styles.arrow, pressed && styles.arrowPressed]}
        >
          <ChevronRight size={22} color={theme.colors.inkFaded} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: theme.spacing.md,
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
  // Same size as the month, but upright Montserrat against Lora italic
  year: {
    fontFamily: theme.fonts.body,
    fontSize: 30,
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
  pressed: {
    opacity: 0.7,
  },
});
