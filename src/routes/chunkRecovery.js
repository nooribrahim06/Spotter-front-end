const RETRY_KEY = "spotter:chunk-reload-at";
const RETRY_WINDOW_MS = 60_000;

// A tab opened before a deployment can still reference removed asset filenames.
// Retry once per minute across reloads; persistent failures reach the route UI.
export function installChunkRecovery(target = window) {
  let attempted = false;
  const recover = () => {
    if (attempted || target.navigator.onLine === false) return;
    attempted = true;
    try {
      const now = Date.now();
      const previous = Number(target.sessionStorage.getItem(RETRY_KEY));
      if (previous && now - previous < RETRY_WINDOW_MS) return;
      target.sessionStorage.setItem(RETRY_KEY, String(now));
    } catch {
      // Without persistent retry state we cannot safely prevent a reload loop.
      return;
    }
    target.location.reload();
  };
  target.addEventListener("vite:preloadError", recover);
  return () => target.removeEventListener("vite:preloadError", recover);
}
