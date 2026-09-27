import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { IngestReceiptRequestFormatEnum } from '@meals_client/core';
import { theme } from '../../theme';
import { AppText, Button, Card, TextField } from '../ui';

type UploadCardProps = {
  /** True while an ingest mutation is in flight — shows the working card. */
  working: boolean;
  /** Ingest the given raw content in the given format. */
  onIngest: (rawContent: string, format: IngestReceiptRequestFormatEnum) => void;
};

/**
 * The receipt entry surface, mirroring apps/web's `.upload-card`. Three states:
 *
 *  - working: a quiet "reading the receipt…" card while the ingest runs;
 *  - pasting: a multiline field plus cancel / ingest, sending TEXT format;
 *  - idle: the entry actions.
 *
 * Native parity note: web offers a `.eml` file picker as the primary action.
 * That needs `expo-document-picker` (not yet a dependency) and the OS share
 * sheet is the intended native entry point — both land in Phase 6 (see the
 * TODO below). For now paste is the one wired flow.
 */
export function UploadCard({ working, onIngest }: UploadCardProps) {
  const [pasting, setPasting] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [pickError, setPickError] = useState('');

  // Pick a .eml file, read its raw RFC822 text, and ingest it as EML — the same
  // path web's file input uses. DocumentPicker returns only a uri (never the
  // contents), so the file is read off disk with the new expo-file-system File
  // API. copyToCacheDirectory keeps the file readable immediately after picking.
  // .eml has no single universal MIME type, so the type list includes octet-
  // stream and */* alongside message/rfc822 so .eml files are actually
  // selectable.
  const pickEmlFile = async () => {
    setPickError('');
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['message/rfc822', 'application/octet-stream', '*/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const text = await new File(result.assets[0].uri).text();
      onIngest(text, IngestReceiptRequestFormatEnum.EML);
    } catch (error: unknown) {
      console.error('Picking .eml file failed', error);
      setPickError('Could not read that file');
    }
  };

  if (working) {
    return (
      <Card style={styles.working}>
        <AppText variant="display">reading the receipt…</AppText>
        <AppText variant="caption" style={styles.workingSub}>
          linking it to your week
        </AppText>
      </Card>
    );
  }

  if (pasting) {
    const cancel = () => {
      setPasting(false);
      setPastedText('');
    };
    return (
      <Card>
        <TextField
          autoFocus
          multiline
          numberOfLines={8}
          value={pastedText}
          onChangeText={setPastedText}
          placeholder="paste the order email text here"
        />
        <View style={styles.actions}>
          <Button label="cancel" variant="secondary" onPress={cancel} style={styles.action} />
          <Button
            label="ingest"
            disabled={pastedText.trim().length === 0}
            onPress={() => {
              onIngest(pastedText, IngestReceiptRequestFormatEnum.TEXT);
              setPastedText('');
            }}
            style={styles.action}
          />
        </View>
      </Card>
    );
  }

  // Idle: two ways in. The OS share sheet is the primary native entry (a user
  // shares the order email straight into Grub — handled by app/share.tsx); these
  // are the in-app entries. "pick a .eml file" reads a saved email as EML; "paste
  // the order email text" sends pasted body text as TEXT.
  return (
    <Card>
      <Button label="pick a .eml file" onPress={pickEmlFile} />
      <Button
        label="paste the order email text"
        variant="secondary"
        onPress={() => setPasting(true)}
        style={styles.secondAction}
      />
      {pickError ? (
        <AppText variant="body" color="error" style={styles.pickError}>
          {pickError}
        </AppText>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  working: {
    alignItems: 'center',
  },
  workingSub: {
    marginTop: theme.spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  action: {
    flex: 1,
  },
  secondAction: {
    marginTop: theme.spacing.sm,
  },
  pickError: {
    marginTop: theme.spacing.sm,
  },
});
