export const PROFILE_QUERY_KEY = ["profile", "me"];
export const PROFILE_CONFIG_QUERY_KEY = ["profile", "config"];
export const PROFILE_TARGETS_QUERY_KEY = ["profile", "targets"];

export const SECTION_LABELS = {
  public: "Personal details",
  account: "Region & language",
  body: "Body basics",
  progress: "Progress check-in",
  health: "Health & safety",
  nutrition: "Food preferences",
  training: "Training setup",
  coaching: "Coach preferences",
};

export function humanize(value) {
  if (value === null || value === undefined || value === "") return "Not set";
  return String(value)
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function initials(profile) {
  const source =
    profile?.userProfile?.displayName ||
    [profile?.userProfile?.firstName, profile?.userProfile?.lastName]
      .filter(Boolean)
      .join(" ") ||
    profile?.account?.username ||
    "S";

  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function displayName(profile) {
  return (
    profile?.userProfile?.displayName ||
    [profile?.userProfile?.firstName, profile?.userProfile?.lastName]
      .filter(Boolean)
      .join(" ") ||
    profile?.account?.username ||
    "Spotter member"
  );
}

export function localDate(value) {
  if (!value) return "Not checked in yet";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function optionalNumber(value) {
  return value === "" || value === null || value === undefined
    ? null
    : Number(value);
}

export function normalizeCode(value) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function getServerFieldError(error, field) {
  return error?.details?.find((detail) => detail.field === field)?.message || "";
}
