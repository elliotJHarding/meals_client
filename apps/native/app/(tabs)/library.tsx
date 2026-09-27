import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useMeals } from '@meals_client/core';
import { theme } from '../../theme';
import { AppText, EmptyState, LoadingState, Screen } from '../../components/ui';
import { MealRow } from '../../components/library/MealRow';

/**
 * The meal library (mirrors apps/web's LibraryView). A read-mostly list of the
 * meals ingestion has gathered, sorted alphabetically. The sort and all server
 * state come from core's `useMeals` — this screen owns only which row is
 * expanded.
 */
export default function LibraryScreen() {
  // useMeals returns the library already sorted alphabetically (the sort lives
  // in the hook's `select`), so this screen never re-sorts or re-fetches.
  const { data: meals, isLoading, isError } = useMeals();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (isLoading) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <EmptyState
          title="Couldn't open the library."
          message="Something went wrong fetching your meals. Pull back in a moment."
        />
      </Screen>
    );
  }

  const library = meals ?? [];

  if (library.length === 0) {
    return (
      <Screen>
        <Header count={0} />
        <EmptyState
          title="An empty larder."
          message="Meals you write into the week will gather here on their own — no filing required."
        />
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <FlatList
        data={library}
        keyExtractor={(meal) => String(meal.id ?? meal.name)}
        ListHeaderComponent={<Header count={library.length} />}
        renderItem={({ item }) => {
          const id = item.id ?? null;
          return (
            <MealRow
              meal={item}
              expanded={expandedId !== null && expandedId === id}
              onToggle={() =>
                setExpandedId((current) => (current === id ? null : id))
              }
            />
          );
        }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

/** Title + count line, matching web's `.week-header` / `.week-subtitle`. */
function Header({ count }: { count: number }) {
  return (
    <View style={styles.header}>
      <AppText variant="displayLarge">Library</AppText>
      <AppText variant="caption" style={styles.subtitle}>
        {count === 0
          ? 'NOTHING IN HERE YET'
          : `${count} MEALS YOU COOK`}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    marginTop: theme.spacing.xs,
    letterSpacing: 1.4,
  },
});
