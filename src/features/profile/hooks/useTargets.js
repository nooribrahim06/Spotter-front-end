import { useQuery } from "@tanstack/react-query";
import { getMyTargets } from "../api/profile.api.js";
import { PROFILE_TARGETS_QUERY_KEY } from "../profile.utils.js";

/**
 * Fetch the user's current nutrition targets.
 */
export function useProfileTargets() {
  return useQuery({
    queryKey: PROFILE_TARGETS_QUERY_KEY,
    queryFn: getMyTargets,
  });
}
