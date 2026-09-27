import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { theme } from '../../theme';
import { AppText } from '../ui';

type AvatarProps = {
  pictureUrl?: string;
  name?: string;
  /** Diameter in px. Defaults to 40 (the web member-row size). */
  size?: number;
};

/**
 * Round profile avatar — the native port of apps/web Avatar.
 *
 * Renders the Google profile picture when present, falling back to the name's
 * initials when there is no URL or the image fails to load (Google profile URLs
 * expire, exactly the web fallback). The circle, ring and initials all draw
 * from the shared palette so it moves with the theme.
 */
export function Avatar({ pictureUrl, name, size = 40 }: AvatarProps) {
  const [broken, setBroken] = useState(false);
  const dimension = { width: size, height: size, borderRadius: size / 2 };

  if (pictureUrl && !broken) {
    return (
      <Image
        accessibilityLabel={name}
        source={{ uri: pictureUrl }}
        style={[styles.avatar, dimension]}
        onError={() => setBroken(true)}
      />
    );
  }

  return (
    <View
      accessibilityLabel={name}
      style={[styles.avatar, styles.initials, dimension]}
    >
      <AppText
        variant="bodyStrong"
        color="accent"
        style={{ fontSize: size * 0.4 }}
      >
        {initialsOf(name)}
      </AppText>
    </View>
  );
}

/**
 * First letters of the first two words: "Alex Harding" -> "AH", "Alex" -> "A",
 * empty -> "?". Mirrors the web Avatar's initials rule exactly.
 */
function initialsOf(name?: string): string {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: theme.colors.accentSoft,
  },
  initials: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
