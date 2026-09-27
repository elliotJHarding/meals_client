import { useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';
import {
  useCreateFamilyGroup,
  useFamilyGroup,
  useJoinFamilyGroup,
} from '@meals_client/core';
import { theme } from '../../theme';
import { AppText, Button, Card, TextField } from '../ui';
import { Avatar } from './Avatar';

type Mode = 'idle' | 'join';

/**
 * The family-group block: who shares the week, plus invite-by-code and
 * join-by-code. Native port of apps/web ProfileView's FamilyGroupSection.
 *
 * Server state comes entirely from core: useFamilyGroup maps "no group" to
 * null (so members = group?.users ?? []), useCreateFamilyGroup lazily mints a
 * group on first invite and seeds the cache, useJoinFamilyGroup joins by code
 * and seeds the cache — the list here updates without any local group state.
 *
 * Native differs from web in one place by necessity: web copies a
 * `${origin}/join/{uuid}` deep link to the clipboard, but native has no web
 * origin configured (config carries only the API host) and the join deep link
 * is Phase 7. So invite shares the group code via the OS share sheet; the
 * recipient pastes it into the join field below — the same code-based flow the
 * server already backs, with no new dependency or unbuilt deep link.
 */
export function FamilyGroupSection() {
  const { data: group, isError } = useFamilyGroup();
  const createFamilyGroup = useCreateFamilyGroup();
  const joinFamilyGroup = useJoinFamilyGroup();

  const [mode, setMode] = useState<Mode>('idle');
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);

  const members = group?.users ?? [];

  const onInvite = async () => {
    // A group only exists once invited; create one on first invite. The create
    // mutation returns the new group's uuid and seeds the cache.
    const uuid = group?.uuid ?? (await createFamilyGroup.mutateAsync());
    if (!uuid) return;
    await Share.share({
      message: `Join my Grub family group with this code: ${uuid}`,
    });
  };

  const onJoin = async () => {
    const code = joinCode.trim();
    if (!code) return;
    setJoinError(null);
    try {
      await joinFamilyGroup.mutateAsync(code);
      setJoinCode('');
      setMode('idle');
    } catch {
      setJoinError('That code did not work. Check it and try again.');
    }
  };

  const cancelJoin = () => {
    setMode('idle');
    setJoinCode('');
    setJoinError(null);
  };

  return (
    <View style={styles.section}>
      <AppText variant="displaySmall">Family group</AppText>

      <Card style={styles.members}>
        {members.length === 0 ? (
          <AppText variant="caption">
            Just you for now — invite someone to share the week.
          </AppText>
        ) : (
          members.map((member, index) => (
            <View
              key={member.name ?? index}
              style={[styles.memberRow, index > 0 && styles.memberDivider]}
            >
              <Avatar
                pictureUrl={member.pictureUrl}
                name={member.name}
                size={36}
              />
              <AppText variant="body">{member.name ?? 'Member'}</AppText>
            </View>
          ))
        )}
      </Card>

      {isError ? (
        <AppText variant="caption" color="error" style={styles.note}>
          Could not load your family group.
        </AppText>
      ) : null}

      {mode === 'idle' ? (
        <View style={styles.actions}>
          <Button
            label="Invite someone"
            onPress={onInvite}
            loading={createFamilyGroup.isPending}
            style={styles.action}
          />
          <Button
            label="Have a code"
            variant="secondary"
            onPress={() => setMode('join')}
            style={styles.action}
          />
        </View>
      ) : (
        <View style={styles.actions}>
          <TextField
            placeholder="Paste an invite code"
            value={joinCode}
            onChangeText={setJoinCode}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            error={joinError ?? undefined}
          />
          <View style={styles.joinButtons}>
            <Button
              label="Join"
              onPress={onJoin}
              loading={joinFamilyGroup.isPending}
              disabled={joinCode.trim() === ''}
              style={styles.action}
            />
            <Button
              label="Cancel"
              variant="secondary"
              onPress={cancelJoin}
              style={styles.action}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  members: {
    gap: theme.spacing.none,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  memberDivider: {
    borderTopColor: theme.colors.rule,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  note: {
    marginTop: -theme.spacing.sm,
  },
  actions: {
    gap: theme.spacing.sm,
  },
  joinButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  action: {
    flex: 1,
  },
});
