import { useEffect } from "react";
import { useAuthStore } from "../../stores/authStore.js";
import { queryClient } from "../../queryClient.js";
import { getMyProfile, updateAccountPreferences } from "./api/profile.api.js";
import { PROFILE_QUERY_KEY } from "./profile.utils.js";

const FALLBACK_TIMEZONES = [
  "Africa/Cairo",
  "Africa/Casablanca",
  "Africa/Johannesburg",
  "Africa/Lagos",
  "Africa/Nairobi",
  "America/Anchorage",
  "America/Argentina/Buenos_Aires",
  "America/Bogota",
  "America/Chicago",
  "America/Denver",
  "America/Halifax",
  "America/Los_Angeles",
  "America/Mexico_City",
  "America/New_York",
  "America/Phoenix",
  "America/Santiago",
  "America/Sao_Paulo",
  "America/St_Johns",
  "America/Toronto",
  "America/Vancouver",
  "Asia/Baghdad",
  "Asia/Bangkok",
  "Asia/Beirut",
  "Asia/Dubai",
  "Asia/Hong_Kong",
  "Asia/Jakarta",
  "Asia/Jerusalem",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Kuwait",
  "Asia/Manila",
  "Asia/Riyadh",
  "Asia/Seoul",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Asia/Taipei",
  "Asia/Tehran",
  "Asia/Tokyo",
  "Atlantic/Reykjavik",
  "Australia/Adelaide",
  "Australia/Brisbane",
  "Australia/Melbourne",
  "Australia/Perth",
  "Australia/Sydney",
  "Europe/Amsterdam",
  "Europe/Athens",
  "Europe/Berlin",
  "Europe/Brussels",
  "Europe/Bucharest",
  "Europe/Budapest",
  "Europe/Copenhagen",
  "Europe/Dublin",
  "Europe/Helsinki",
  "Europe/Istanbul",
  "Europe/Kyiv",
  "Europe/Lisbon",
  "Europe/London",
  "Europe/Madrid",
  "Europe/Moscow",
  "Europe/Oslo",
  "Europe/Paris",
  "Europe/Prague",
  "Europe/Rome",
  "Europe/Stockholm",
  "Europe/Vienna",
  "Europe/Warsaw",
  "Europe/Zurich",
  "Pacific/Auckland",
  "Pacific/Fiji",
  "Pacific/Honolulu",
  "UTC",
];

/**
 * Detects the local browser's IANA timezone.
 * Defaults to "UTC" if resolution fails.
 */
export function detectBrowserTimezone() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && typeof tz === "string") return tz;
  } catch {
    // Fall back to UTC if Intl is unavailable
  }
  return "UTC";
}

/**
 * Returns a sorted list of IANA timezone names.
 * Uses Intl.supportedValuesOf if available, falling back to a curated list.
 * Ensures the given selected timezone is included in the returned list.
 */
export function getTimezoneList(selectedTimezone) {
  let list = FALLBACK_TIMEZONES;
  if (typeof Intl !== "undefined" && typeof Intl.supportedValuesOf === "function") {
    try {
      const supported = Intl.supportedValuesOf("timeZone");
      if (Array.isArray(supported) && supported.length > 0) {
        list = supported;
      }
    } catch {
      // Use fallback
    }
  }

  // Intl omits UTC in some browsers even though it is a valid saved timezone.
  return [...new Set(["UTC", ...list, ...(selectedTimezone ? [selectedTimezone] : [])])].sort();
}

let syncPromise = null;

/**
 * Single-flight coordinator that auto-detects and synchronizes
 * the user's timezone if not already set on their account.
 *
 * @param {import("@tanstack/react-query").QueryClient} client
 * @returns {Promise<string|null>} The active timezone, or null if unauthenticated / sync failed
 */
export async function syncUserTimezone(client = queryClient) {
  if (syncPromise) return syncPromise;

  syncPromise = (async () => {
    const authState = useAuthStore.getState();
    if (authState.authStatus !== "authenticated" || !authState.accessToken) {
      return null;
    }

    // Fast-path: timezone is already known in the local user store
    if (authState.user?.timezone) {
      return authState.user.timezone;
    }

    try {
      const profile = await getMyProfile();
      const existingTimezone =
        profile?.account?.timezone || profile?.user?.timezone;

      if (existingTimezone) {
        authState.updateUser({ timezone: existingTimezone });
        return existingTimezone;
      }

      // Timezone is missing on the account — detect from the browser and persist
      const detected = detectBrowserTimezone();
      await updateAccountPreferences({ timezone: detected });

      authState.updateUser({ timezone: detected });

      if (client) {
        client.setQueryData(PROFILE_QUERY_KEY, (old) => {
          if (!old) return old;
          return {
            ...old,
            account: {
              ...old.account,
              timezone: detected,
            },
          };
        });
        await client.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
      }

      return detected;
    } catch (error) {
      // Background sync must not crash or block the UI
      return null;
    }
  })().finally(() => {
    syncPromise = null;
  });

  return syncPromise;
}

/**
 * React hook to ensure the authenticated user's timezone is synced in the background.
 */
export function useTimezoneSync() {
  const authStatus = useAuthStore((s) => s.authStatus);
  const userTimezone = useAuthStore((s) => s.user?.timezone);

  useEffect(() => {
    if (authStatus === "authenticated" && !userTimezone) {
      syncUserTimezone();
    }
  }, [authStatus, userTimezone]);
}
