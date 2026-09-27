import { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import PagerView, { type PagerViewOnPageSelectedEvent } from 'react-native-pager-view';
import { formatDate } from '@meals_client/core';

import { Calendar, Meal, Screen } from '../../components/ui';
import { WeekBar } from '../../components/week/WeekBar';
import { WeekList } from '../../components/week/WeekList';
import { addDays, mondayOf, weeksBetween } from '../../components/week/dates';
import { theme } from '../../theme';

type Mode = 'meals' | 'calendar';

// A fixed set of week pages mounted once, centred on the reference week. HALF
// weeks of swipe in each direction is far beyond any realistic use of a meal
// planner, so the window never has to slide — which is what lets navigation be
// purely declarative: `activeIndex` is the single source of truth and the pager
// position follows it, with no imperative recentre/snap reconciliation.
const HALF = 26;
const SLOTS = 2 * HALF + 1;

// Only the active page and its immediate neighbours mount a WeekList (each owns
// a per-week query); every other slot is a same-size empty View. pager-view
// mounts all children, so this — not the slot count — is what bounds the number
// of in-flight week queries to ~3. Neighbours are pre-mounted, so the page you
// swipe to is already populated on arrival.
const RENDER_RADIUS = 1;

/**
 * The Week screen — the app's home / daily-use surface, ported from apps/web's
 * WeekView. A fixed WeekBar (month + week controls) sits above a horizontally
 * swipeable body of weeks.
 *
 * Swipe is a `PagerView` over a fixed window of weeks centred on the week the
 * screen mounted in. `activeIndex` tracks the visible page and is the only
 * state; the chevrons and the "today" pill drive the pager with `setPage`, whose
 * `onPageSelected` echo simply updates `activeIndex`. There is no anchor,
 * recentre, or programmatic-snap suppression — navigation is fully declarative,
 * so "today" lands deterministically. Each page is a `WeekList` owning its own
 * per-week query; off-window pages render empty until swiped near.
 */
export default function WeekScreen() {
  // Fixed at mount: the centre of the window. Week for slot i is this plus
  // (i - HALF) weeks. mondayOf keeps it aligned with the per-week query keys.
  const [referenceMonday] = useState(() => mondayOf(new Date()));
  const [activeIndex, setActiveIndex] = useState(HALF);
  // Screen-level so it survives page swipes (each WeekList is memoised per week);
  // defaults to meals and is not persisted across reload.
  const [mode, setMode] = useState<Mode>('meals');
  const pagerRef = useRef<PagerView>(null);

  const pages = useMemo(
    () => Array.from({ length: SLOTS }, (_, i) => addDays(referenceMonday, (i - HALF) * 7)),
    [referenceMonday],
  );

  // Recomputed each render so a midnight rollover into a new week during a long
  // session still points "today" at the right slot.
  const todayIndex = HALF + weeksBetween(referenceMonday, mondayOf(new Date()));
  const visibleWeek = pages[activeIndex];

  const onPageSelected = (event: PagerViewOnPageSelectedEvent) => {
    setActiveIndex(event.nativeEvent.position);
  };

  return (
    <Screen>
      <WeekBar
        weekStart={visibleWeek}
        showToday={activeIndex !== todayIndex}
        onPrev={() => pagerRef.current?.setPage(activeIndex - 1)}
        onNext={() => pagerRef.current?.setPage(activeIndex + 1)}
        onToday={() => pagerRef.current?.setPage(todayIndex)}
      />
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={HALF}
        onPageSelected={onPageSelected}
      >
        {pages.map((pageWeek, i) => (
          <View key={formatDate(pageWeek)} style={styles.pageHost}>
            {Math.abs(i - activeIndex) <= RENDER_RADIUS ? (
              <WeekList weekStart={pageWeek} mode={mode} />
            ) : null}
          </View>
        ))}
      </PagerView>

      {/* Floating bottom-centre pill: meals (default) ⇄ calendar. Sits just
          above the tab bar; the empty area passes touches through (box-none)
          so only the pill itself is interactive. */}
      <View style={styles.modeSwitch} pointerEvents="box-none">
        <View style={styles.modeSwitchPill}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Show meals"
            accessibilityState={{ selected: mode === 'meals' }}
            onPress={() => setMode('meals')}
            style={[styles.modeButton, mode === 'meals' && styles.modeButtonActive]}
          >
            <Meal size={20} color={mode === 'meals' ? theme.colors.accent : theme.colors.inkFaded} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Show calendar"
            accessibilityState={{ selected: mode === 'calendar' }}
            onPress={() => setMode('calendar')}
            style={[styles.modeButton, mode === 'calendar' && styles.modeButtonActive]}
          >
            <Calendar size={20} color={mode === 'calendar' ? theme.colors.accent : theme.colors.inkFaded} />
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pager: {
    flex: 1,
  },
  pageHost: {
    flex: 1,
  },
  modeSwitch: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: theme.spacing.lg,
    alignItems: 'center',
  },
  modeSwitchPill: {
    flexDirection: 'row',
    gap: 2,
    padding: 4,
    borderRadius: 999,
    backgroundColor: theme.colors.paperRaised,
    borderColor: theme.colors.rule,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  modeButton: {
    width: 52,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  modeButtonActive: {
    backgroundColor: theme.colors.accentSoft,
  },
});
