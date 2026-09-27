import { getShareExtensionKey } from 'expo-share-intent';

/**
 * expo-router native-intent hook.
 *
 * The share-intent native module surfaces a shared item by deep-linking into the
 * app with a url carrying `dataUrl=<shareExtensionKey>`. expo-router resolves
 * incoming system paths through this `redirectSystemPath` export, so this is the
 * one place we can intercept that url and route it to our share-target screen.
 * Returning `/share` lands the user on the confirm-and-ingest flow, which reads
 * the actual shared content via `useShareIntentContext()`.
 *
 * `initial` is true for the cold-start redirect (app launched by the share) and
 * false for a warm one (app already running). We route the same way for both —
 * the share screen handles both uniformly via the hook.
 *
 * Any other path (the normal app launch, normal deep links) is passed straight
 * through unchanged, so this never interferes with ordinary navigation.
 */
export function redirectSystemPath({
  path,
  initial,
}: {
  path: string;
  initial: boolean;
}): string {
  void initial;
  try {
    if (path.includes(`dataUrl=${getShareExtensionKey()}`)) {
      return '/share';
    }
  } catch {
    // Defensive: never let a parse failure here break ordinary deep-link routing.
    return path;
  }
  // `grub://join/<uuid>` (and the future https app link) needs no rewrite: it
  // falls through here unchanged and expo-router resolves /join/<uuid> to the
  // app/join/[uuid].tsx route. See DEEPLINKS.md for the full link inventory and
  // the decision that no offline-consent CALLBACK deep link is needed (native
  // sign-in reconnect supersedes it).
  return path;
}
