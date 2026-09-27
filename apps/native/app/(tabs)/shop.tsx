import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { type ReceiptDto, type ReceiptIngestionResultDto } from '@elliotJHarding/meals-api';
import {
  useReceipts,
  useIngestReceipt,
  ingestErrorMessage,
  type IngestReceiptRequestFormatEnum,
} from '@meals_client/core';
import { theme } from '../../theme';
import { AppText, LoadingState, Screen } from '../../components/ui';
import { UploadCard } from '../../components/shop/UploadCard';
import { IngestionResult } from '../../components/shop/IngestionResult';

/**
 * Shop — receipt ingestion plus the past-receipts list, the native port of
 * apps/web ShopView.
 *
 * Server state comes entirely from core: `useReceipts` for the list and
 * `useIngestReceipt` for the upload. The list re-fetches itself after a
 * successful ingest (the mutation invalidates ['receipts']); a list fetch error
 * is benign (an empty list), matching the web view's `data: receipts = []`.
 *
 * The whole screen is one FlatList of past receipts — the header carries the
 * title, the upload card, any ingest error, and the result summary — so it
 * scrolls as a unit and clears the bottom tab bar.
 */
export default function ShopScreen() {
  const insets = useSafeAreaInsets();
  // A list-fetch failure is non-fatal: receipts stays [] (an empty list is
  // acceptable, matching web's `data: receipts = []`), so we don't read isError.
  const { data: receipts = [], isLoading } = useReceipts();
  const ingestReceipt = useIngestReceipt();

  const [errorMessage, setErrorMessage] = useState('');
  const [result, setResult] = useState<ReceiptIngestionResultDto | null>(null);

  const working = ingestReceipt.isPending;

  const ingest = async (rawContent: string, format: IngestReceiptRequestFormatEnum) => {
    setErrorMessage('');
    setResult(null);
    try {
      const outcome = await ingestReceipt.mutateAsync({ rawContent, format });
      setResult(outcome);
    } catch (error: unknown) {
      console.error('Ingestion failed', error);
      setErrorMessage(ingestErrorMessage(error) ?? 'Something went wrong reading the receipt');
    }
  };

  // The bottom tab bar is a fixed nav height plus the safe-area inset (see
  // (tabs)/_layout.tsx); pad the list by that so the last row clears it.
  const bottomClearance = theme.layout.navHeight + insets.bottom + theme.spacing.lg;

  const header = (
    <View style={styles.header}>
      <AppText variant="displayLarge">Shop</AppText>
      <AppText variant="caption" style={styles.subtitle}>
        drop in the order email after each shop
      </AppText>

      <View style={styles.uploadBlock}>
        <UploadCard working={working} onIngest={ingest} />
      </View>

      {errorMessage ? (
        <AppText variant="body" color="error" style={styles.error}>
          {errorMessage}
        </AppText>
      ) : null}

      {result ? (
        <View style={styles.resultBlock}>
          <IngestionResult result={result} />
        </View>
      ) : null}

      {receipts.length > 0 ? (
        <AppText variant="caption" style={styles.pastShops}>
          past shops
        </AppText>
      ) : null}
    </View>
  );

  return (
    <Screen padded={false}>
      {isLoading ? (
        <LoadingState />
      ) : (
        <FlatList<ReceiptDto>
          data={receipts}
          keyExtractor={(receipt) => String(receipt.id)}
          ListHeaderComponent={header}
          renderItem={({ item }) => <ReceiptRow receipt={item} />}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: bottomClearance },
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
  );
}

function ReceiptRow({ receipt }: { receipt: ReceiptDto }) {
  return (
    <View style={styles.row}>
      <AppText variant="body" style={styles.rowDate}>
        {receipt.orderDate ? String(receipt.orderDate) : '—'}
      </AppText>
      <AppText variant="caption" style={styles.rowItems}>
        {receipt.groceryItems?.length ?? 0} items
      </AppText>
      <AppText variant="bodyStrong" style={styles.rowTotal}>
        {receipt.total != null ? `£${receipt.total.toFixed(2)}` : ''}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  header: {
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    marginTop: theme.spacing.xs,
  },
  uploadBlock: {
    marginTop: theme.spacing.lg,
  },
  error: {
    marginTop: theme.spacing.md,
  },
  resultBlock: {
    marginTop: theme.spacing.xl,
  },
  pastShops: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomColor: theme.colors.rule,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowDate: {
    flex: 1,
  },
  rowItems: {
    marginHorizontal: theme.spacing.md,
  },
  rowTotal: {
    minWidth: 64,
    textAlign: 'right',
  },
});
