import { StyleSheet, View } from 'react-native';
import { type ReceiptIngestionResultDto } from '@elliotJHarding/meals-api';
import { theme } from '../../theme';
import { AppText, Card } from '../ui';

type IngestionResultProps = {
  result: ReceiptIngestionResultDto;
};

/**
 * The post-ingest summary, mirroring apps/web's `.ingestion-result`: a headline
 * of item count and receipt total, then one row per linked meal (flagging new
 * library meals and confidence), and a tail count of items not tied to a meal.
 *
 * Web animates this in with framer-motion; native drops the animation (no DOM
 * motion lib in this app) and keeps the same information and order.
 */
export function IngestionResult({ result }: IngestionResultProps) {
  const itemCount = result.receipt?.groceryItems?.length ?? 0;
  const total = result.receipt?.total;
  const linkedMeals = result.linkedMeals ?? [];
  const unlinkedCount = (result.unlinkedItems ?? []).length;

  return (
    <View style={styles.section}>
      <AppText variant="display">
        {itemCount} items ·{' '}
        {total != null ? `£${total.toFixed(2)}` : 'receipt read'}
      </AppText>

      {linkedMeals.map((link) => (
        <Card key={`${String(link.date)}-${link.mealName}`} style={styles.meal}>
          <View style={styles.mealHead}>
            <AppText variant="bodyStrong">{link.mealName}</AppText>
            {link.newMeal ? (
              <AppText variant="caption" color="accent">
                new in library
              </AppText>
            ) : null}
          </View>
          <AppText variant="caption">
            {link.ingredientsAdded ?? 0} ingredients learned
            {link.confidence ? ` · ${link.confidence} confidence` : ''}
          </AppText>
        </Card>
      ))}

      {unlinkedCount > 0 ? (
        <AppText variant="caption" style={styles.unlinked}>
          {unlinkedCount} items not tied to meals (snacks, staples, household)
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: theme.spacing.sm,
  },
  meal: {
    gap: theme.spacing.xs,
  },
  mealHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  unlinked: {
    marginTop: theme.spacing.xs,
  },
});
