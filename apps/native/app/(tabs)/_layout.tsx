import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@meals_client/core';
import { theme } from '../../theme';
import { Book, Calendar, Cart } from '../../components/ui';
import { Avatar } from '../../components/profile/Avatar';

// The four-tab shell, in the same order as apps/web's primary nav:
// Week (index), Library, Shop, Profile. The three content tabs reuse the line
// icons ported from apps/web (components/ui/icons); Profile shows the user's
// Avatar, matching apps/web's BottomNav exactly.
const TABS = [
  { name: 'index', title: 'Week', Icon: Calendar },
  { name: 'library', title: 'Library', Icon: Book },
  { name: 'shop', title: 'Shop', Icon: Cart },
] as const;

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

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
      {TABS.map(({ name, title, Icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ color }) => <Icon size={24} color={color} />,
          }}
        />
      ))}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          // Match apps/web: the profile nav item is the user's avatar (initials
          // fallback when there's no picture), not an icon.
          tabBarIcon: () => (
            <Avatar pictureUrl={user?.pictureUrl} name={user?.name} size={24} />
          ),
        }}
      />
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
});
