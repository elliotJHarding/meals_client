import { useState } from 'react';

type AvatarProps = {
  pictureUrl?: string;
  name?: string;
  size?: number;
};

// Initials from the name: first letters of the first two words, e.g.
// "Alex Harding" -> "AH", "Alex" -> "A". The signed-in user may have no
// pictureUrl, so this is the fallback the v1 avatar never had.
function initialsOf(name?: string): string {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  const letters = words.slice(0, 2).map((w) => w[0]);
  return letters.join('').toUpperCase();
}

export default function Avatar({ pictureUrl, name, size = 40 }: AvatarProps) {
  // Fall back to initials when there is no URL, or when the image 404s
  // (Google profile URLs expire).
  const [broken, setBroken] = useState(false);
  const dimension = { width: size, height: size };

  if (pictureUrl && !broken) {
    return (
      <img
        className="avatar"
        src={pictureUrl}
        alt={name ?? ''}
        style={dimension}
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
      />
    );
  }

  return (
    <span
      className="avatar avatar-initials"
      style={{ ...dimension, fontSize: size * 0.4 }}
      aria-label={name ?? ''}
    >
      {initialsOf(name)}
    </span>
  );
}
