import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { File } from 'expo-file-system';
import { useShareIntentContext } from 'expo-share-intent';
import { type ReceiptIngestionResultDto } from '@elliotJHarding/meals-api';
import {
  useIngestReceipt,
  ingestErrorMessage,
  IngestReceiptRequestFormatEnum,
} from '@meals_client/core';
import { theme } from '../theme';
import { AppText, Button, Card, LoadingState, Screen } from '../components/ui';
import { IngestionResult } from '../components/shop/IngestionResult';

/**
 * Share-target screen — the OS share-sheet entry into receipt ingestion.
 *
 * Reached via app/+native-intent.ts, which redirects the share deep link here.
 * The shared content comes from the share-intent native module through
 * `useShareIntentContext()` (the provider is mounted at the root in
 * app/_layout.tsx). The hook handles cold start (app launched by the share) and
 * warm share (app already running) uniformly, so this screen does not branch on
 * launch mode.
 *
 * Two shapes of shared content are handled:
 *  - shared body text (Android "Share email text", iOS shared text) -> TEXT
 *  - a shared .eml file (shareIntent.files[0].path) -> read raw RFC822 -> EML
 *
 * The user previews what was shared, then confirms; ingestion goes through the
 * core `useIngestReceipt` mutation (NOT a bespoke call), exactly like the Shop
 * screen's paste/file paths. On success we reset the share intent (so it is not
 * reprocessed) and route to the Shop tab; failures are surfaced, never silent.
 */
export default function ShareScreen() {
  const router = useRouter();
  const { hasShareIntent, shareIntent, resetShareIntent, error } = useShareIntentContext();
  const ingestReceipt = useIngestReceipt();

  // The raw receipt content extracted from the share, and the format the server
  // should parse it as. null while we are still reading a shared file.
  const [content, setContent] = useState<string | null>(null);
  const [format, setFormat] = useState<IngestReceiptRequestFormatEnum>(
    IngestReceiptRequestFormatEnum.TEXT,
  );
  const [readError, setReadError] = useState('');
  const [ingestErr, setIngestErr] = useState('');
  const [result, setResult] = useState<ReceiptIngestionResultDto | null>(null);

  // Extract the shared content. A shared .eml arrives as a file path we must read
  // off disk (raw RFC822 -> EML); shared body text is already in shareIntent.text
  // (-> TEXT). Runs whenever the surfaced share changes.
  useEffect(() => {
    let cancelled = false;
    setReadError('');

    const file = shareIntent.files?.[0];
    if (file?.path) {
      setFormat(IngestReceiptRequestFormatEnum.EML);
      new File(file.path)
        .text()
        .then((text) => {
          if (!cancelled) setContent(text);
        })
        .catch((e: unknown) => {
          if (cancelled) return;
          console.error('Reading shared file failed', e);
          setReadError('Could not read the shared file');
        });
    } else if (shareIntent.text) {
      setFormat(IngestReceiptRequestFormatEnum.TEXT);
      setContent(shareIntent.text);
    } else {
      setContent(null);
    }

    return () => {
      cancelled = true;
    };
  }, [shareIntent]);

  const close = useCallback(() => {
    resetShareIntent();
    router.replace('/(tabs)/shop');
  }, [resetShareIntent, router]);

  const confirm = useCallback(async () => {
    if (!content) return;
    setIngestErr('');
    try {
      const outcome = await ingestReceipt.mutateAsync({ rawContent: content, format });
      setResult(outcome);
      // Clear the native + React share state so this share is not reprocessed on
      // the next foreground (provider has resetOnBackground off).
      resetShareIntent();
    } catch (e: unknown) {
      console.error('Share ingestion failed', e);
      setIngestErr(ingestErrorMessage(e) ?? 'Something went wrong reading the receipt');
    }
  }, [content, format, ingestReceipt, resetShareIntent]);

  // Nothing shared (e.g. the user reached this route directly, or the intent was
  // already consumed): offer a way back rather than a dead modal.
  if (!hasShareIntent && !result) {
    return (
      <Screen>
        <View style={styles.centred}>
          <AppText variant="display">Nothing shared</AppText>
          <AppText variant="caption" style={styles.gap}>
            share an order email into Grub to add a shop
          </AppText>
          <Button label="close" variant="secondary" onPress={close} style={styles.gap} />
        </View>
      </Screen>
    );
  }

  if (result) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <AppText variant="displayLarge">added your shop</AppText>
          <View style={styles.gap}>
            <IngestionResult result={result} />
          </View>
          <Button label="done" onPress={close} style={styles.action} />
        </ScrollView>
      </Screen>
    );
  }

  if (ingestReceipt.isPending) {
    return (
      <Screen>
        <View style={styles.centred}>
          <AppText variant="display">reading the receipt…</AppText>
          <AppText variant="caption" style={styles.gap}>
            linking it to your week
          </AppText>
          <View style={styles.gap}>
            <LoadingState />
          </View>
        </View>
      </Screen>
    );
  }

  // Reading the shared file (no content yet, no read error): brief spinner.
  if (content === null && !readError && !error) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  const surfacedError = readError || error || '';
  const previewLabel =
    format === IngestReceiptRequestFormatEnum.EML
      ? `shared file: ${shareIntent.files?.[0]?.fileName ?? 'email'}`
      : 'shared email text';

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppText variant="displayLarge">add this shop?</AppText>
        <AppText variant="caption" style={styles.subtitle}>
          {previewLabel}
        </AppText>

        {surfacedError ? (
          <AppText variant="body" color="error" style={styles.gap}>
            {surfacedError}
          </AppText>
        ) : null}

        {ingestErr ? (
          <AppText variant="body" color="error" style={styles.gap}>
            {ingestErr}
          </AppText>
        ) : null}

        {content ? (
          <Card style={styles.preview}>
            <AppText variant="caption" numberOfLines={12}>
              {content.slice(0, 1500)}
            </AppText>
          </Card>
        ) : null}

        <View style={styles.actions}>
          <Button label="cancel" variant="secondary" onPress={close} style={styles.action} />
          <Button
            label="add shop"
            disabled={!content}
            onPress={confirm}
            style={styles.action}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: theme.spacing.xl,
  },
  centred: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    marginTop: theme.spacing.xs,
  },
  gap: {
    marginTop: theme.spacing.md,
  },
  preview: {
    marginTop: theme.spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xl,
  },
  action: {
    flex: 1,
  },
});
