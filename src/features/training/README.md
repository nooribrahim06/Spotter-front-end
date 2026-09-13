# Spotter Training frontend

Training is available from the desktop and mobile navigation at `/app/training`.

- `/app/training`: start or resume the server's active workout, recent training, and exercise discovery.
- `/app/training/workouts/:workoutId`: active session or read-only completed/cancelled recap.
- `/app/training/history`: paginated history with local date-range controls.

## Contract and state

`training.api.js` uses the existing authenticated Axios client and the documented `/api/exercises` and `/api/workouts` endpoints. Backend code is unchanged. Lifecycle responses and movement responses are authoritative; deletion handles 204 without parsing JSON.

`useTraining.js` owns queries and mutation synchronization. Training query keys include the user ID, caches remain in memory, unused data has zero retention, request cancellation is propagated, and writes from an old login cannot refill a new user's cache. Queries and mutations do not automatically retry; session recovery uses the existing API client. Refocusing the app restores current server state.

`training.domain.js` validates complete movement summaries before creating minimal PATCH payloads. The editor renders only `exercise.trackingMetrics` supported by `config.trackingMetrics`, using the contract mapping to measurement fields. It converts minutes/seconds and kilometers/meters to API units. Unpaired sets/reps/weight are shown as unavailable while the backend retains its pairing requirement; duration/distance remain usable. No measurements are invented, and uneditable stored values are preserved on PATCH. Catalog filter choices come from `/exercises/config`. Cards and initial detail images use `media.previewUrl` exactly as supplied. Explicit demonstration playback uses `media.animationUrl`. Missing media uses the standard placeholder. There are no local frame transformations, URL rewriting, storage-field dependencies, or autoplaying lists.

## Validation

Run `npm test -- src/features/training` for contract and interaction tests, `npm test` for the whole frontend suite, and `npm run build` for production compilation.

Training tests cover start/resume, duplicate recovery, limits, tracking conversions, partial updates, invalid states, blocked completion, cancellation, 204 deletion, pagination, media fallback, configured tracking metrics, temporary incompatible metric combinations, and rate-limit handling. The shared API client test also verifies that concurrent training 401 responses trigger just one refresh request. Browser verification uses isolated API fixtures; no live user workout data is created. There is no mock data or authentication bypass in production code.


