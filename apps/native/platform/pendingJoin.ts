/**
 * The pending family-group join.
 *
 * A `grub://join/<uuid>` deep link can land while the user is signed out. The
 * AuthGate then sends them to /login, which unmounts the join screen — so the
 * uuid has to be held somewhere outside the screen until sign-in completes, or
 * it is silently lost (exactly the gap web's RequireAuth has: it redirects to
 * /login without preserving the target, so an unauthenticated /join tap drops
 * the uuid). Native closes that gap by parking the uuid here.
 *
 * This is a tiny module-scoped holder, NOT secure-store: the uuid is not a
 * credential, it is a transient navigation target. It only needs to survive the
 * /join -> /login -> back hop within a single app session; if the app is killed
 * mid-flow the user simply re-taps the invite link, so there is no need to
 * persist it across launches. Keeping it in memory mirrors how reauth.ts holds
 * its transient signal without storage.
 */
let pendingJoinUuid: string | null = null;

/** Park a join uuid to resume after the user signs in. */
export function setPendingJoin(uuid: string): void {
  pendingJoinUuid = uuid;
}

/**
 * Take the parked join uuid, clearing it in the same call so a resume runs at
 * most once (the screen also guards with a once-only ref). Returns null if none
 * is pending.
 */
export function takePendingJoin(): string | null {
  const uuid = pendingJoinUuid;
  pendingJoinUuid = null;
  return uuid;
}

/** Whether a join is currently parked, without consuming it. */
export function hasPendingJoin(): boolean {
  return pendingJoinUuid !== null;
}
