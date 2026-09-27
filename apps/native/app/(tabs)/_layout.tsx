import { Tabs } from 'expo-router';
import { Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../theme';

// The four-tab shell, in the same order as apps/web's primary nav:
// Week (index), Library, Shop, Profile. Icons are plain emoji glyphs so the
// shell carries no extra dependency — @expo/vector-icons can replace them later
// without changing this layout's shape.
const TABS = [
  { name: 'index', title: 'Week', glyph: '\u{1F4C5}' }, // calendar
  { name: 'library', title: 'Library', glyph: '\u{1F4D6}' }, // open book
  { name: 'shop', title: 'Shop', glyph: '\u{1F6D2}' }, // shopping trolley
  { name: 'profile', title: 'Profile', glyph: '\u{1F464}' }, // bust in silhouette
] as const;

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  // A fixed ~64px bar (core's nav height) plus the device's bottom safe-area
  // inset, so the row of labels never sits under the home indicator / gesture
  // bar. Height grows by the inset; the inset is also added as bottom padding.
  const barHeight = theme.layout.navHeight + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.inkFaded,
        tabBarStyle: [
          styles.tabBar,
          { height: barHeight, paddingBottom: insets.bottom },
        ],
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      {TABS.map(({ name, title, glyph }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ color }) => (
              <Text style={[styles.tabGlyph, { color }]}>{glyph}</Text>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: theme.colors.paper,
    borderTopColor: theme.colors.rule,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: theme.spacing.xs,
  },
  tabItem: {
    paddingVertical: theme.spacing.xs,
  },
  tabLabel: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 11,
  },
  tabGlyph: {
    fontSize: 22,
  },
});
