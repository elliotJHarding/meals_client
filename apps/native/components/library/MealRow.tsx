import { Image, Pressable, StyleSheet, View } from 'react-native';
import type { MealDto } from '@elliotJHarding/meals-api';
import { theme } from '../../theme';
import { AppText } from '../ui';

type MealRowProps = {
  meal: MealDto;
  expanded: boolean;
  onToggle: () => void;
};

/**
 * One library entry: the meal's name with an ingredient count, expanding on tap
 * to reveal its details line and ingredient list. Mirrors apps/web's
 * `.meal-card` — name in the display face, a dotted leader filling the gap to a
 * right-aligned count, and the name/count tinting to accent while expanded.
 *
 * The detail line composes the same fields web does (serves · effort · prep),
 * dropping any that are absent, since a library meal is built by ingestion and
 * may not carry all of them yet.
 */
export function MealRow({ meal, expanded, onToggle }: MealRowProps) {
  const ingredients = meal.ingredients ?? [];
  const details = [
    meal.serves != null ? `serves ${meal.serves}` : null,
    meal.effort?.toLowerCase(),
    meal.prepTimeMinutes != null ? `${meal.prepTimeMinutes} min` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const activeColor = expanded ? 'accent' : undefined;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      onPress={onToggle}
      style={styles.card}
    >
      <View style={styles.row}>
        {meal.image?.url ? (
          <Image source={{ uri: meal.image.url }} style={styles.thumb} />
        ) : null}
        <AppText
          variant="displaySmall"
          color={activeColor}
          style={styles.name}
          numberOfLines={2}
        >
          {meal.name}
        </AppText>
        <View style={styles.leader} />
        {ingredients.length > 0 ? (
          <AppText variant="displaySmall" color={activeColor ?? 'inkFaded'}>
            {ingredients.length}
          </AppText>
        ) : null}
      </View>

      {expanded && ingredients.length > 0 ? (
        <View style={styles.ingredients}>
          {details ? (
            <AppText variant="caption" style={styles.details}>
              {details.toUpperCase()}
            </AppText>
          ) : null}
          {ingredients.map((ingredient) => (
            <AppText
              key={ingredient.id ?? ingredient.name}
              variant="caption"
              style={styles.ingredient}
            >
              {'·  '}
              {ingredient.name}
            </AppText>
          ))}
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm + 3,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.rule,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm + 2,
  },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: 6,
    flexShrink: 0,
  },
  name: {
    flexShrink: 1,
  },
  // The web leader is a dotted line filling the gap; RN has no dotted
  // background, so this is a thin rule in the faint-ink tone — same role,
  // flexing to push the count to the right edge.
  leader: {
    flex: 1,
    minWidth: 24,
    height: StyleSheet.hairlineWidth,
    marginHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.inkFaint,
  },
  ingredients: {
    paddingTop: theme.spacing.xs,
    paddingLeft: theme.spacing.md,
  },
  details: {
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  ingredient: {
    paddingVertical: 1,
  },
});
