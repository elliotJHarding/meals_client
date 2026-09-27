import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FamilyGroupDto } from '@elliotJHarding/meals-api';
import { queryKeys } from './keys';
import { useMealsApi } from './provider';

/**
 * The caller's family group, or null when they have none ("just you"). The web
 * view treats any error as a null group, so the queryFn maps failure to null
 * rather than throwing. Consumers derive `members = group?.users ?? []`.
 */
export function useFamilyGroup() {
  const { familyGroupApi } = useMealsApi();
  return useQuery<FamilyGroupDto | null>({
    queryKey: queryKeys.familyGroup,
    queryFn: async () => {
      try {
        return (await familyGroupApi.getFamilyGroup()).data;
      } catch {
        return null;
      }
    },
  });
}

/**
 * Creates a family group for the caller. The server returns the new group's
 * uuid as a BARE JSON string despite the generated FamilyGroupDto return type,
 * so the response is cast `as unknown as string` — preserved here.
 *
 * On success it seeds `['familyGroup']` with `{ uuid, users: existing ?? [] }`
 * so the cache reflects the new group immediately; the view derives the invite
 * link `${origin}/join/${uuid}`. Called lazily on first invite.
 */
export function useCreateFamilyGroup() {
  const { familyGroupApi } = useMealsApi();
  const queryClient = useQueryClient();

  return useMutation<string, unknown, void>({
    mutationFn: async () =>
      (await familyGroupApi.createFamilyGroup()).data as unknown as string,
    onSuccess: (uuid) => {
      queryClient.setQueryData<FamilyGroupDto | null>(queryKeys.familyGroup, (existing) => ({
        uuid,
        users: existing?.users ?? [],
      }));
    },
  });
}

/**
 * Joins the family group identified by `uuid`, returning the joined
 * FamilyGroupDto. On success the returned group is written into
 * `['familyGroup']`. Called from both the profile join form and the
 * /join/:uuid deep-link route; the once-only / double-invoke guard and the
 * post-join navigation stay in the view, not core.
 */
export function useJoinFamilyGroup() {
  const { familyGroupApi } = useMealsApi();
  const queryClient = useQueryClient();

  return useMutation<FamilyGroupDto, unknown, string>({
    mutationFn: async (uuid) => (await familyGroupApi.joinFamilyGroup(uuid)).data,
    onSuccess: (group) => {
      queryClient.setQueryData<FamilyGroupDto>(queryKeys.familyGroup, group);
    },
  });
}
