# Progress and Daily Summary

Frontend-only integration with the existing Spotter API. The backend is unchanged.

- `/app/home` reads `/api/daily-summary?date=YYYY-MM-DD`. Calories, macros, historical targets and completeness flags are rendered from the server response.
- `/app/progress` connects goal progress, the latest reading, selectable metric charts and paginated history. Charts load all pages in the chosen date window and reverse a copy. Missing values produce gaps.
- `/app/progress?checkIn=1` opens the shared check-in sheet, also used from Profile. Creation uses `/api/progress` with an explicit request-field allowlist. Changed timestamps include the browser offset. Entries have detail views but no edit/delete actions.
- Existing goal/profile mutations invalidate journey and target queries. Meal and workout mutations invalidate their saved local day; moved activities invalidate both dates. Unknown cached timestamps trigger broad summary invalidation.
- Colors and typography come from the authenticated Spotter shell. Existing Bit assets, form fields, buttons, skeletons and the goal dialog are reused. Mobile charts use their own readable coordinate width; the sheet supports focus trapping, Escape, focus restoration and reduced motion.

Contracts live in `progress.types.d.ts` and `../daily-summary/daily-summary.types.d.ts`. API modules retain the existing authenticated Axios client and refresh behavior.

Validation: `npm run build` and `npm test -- --maxWorkers=2`. Focused tests cover null/zero semantics, API payloads, date validation, history/chart pagination, success/error states and activity-driven cache invalidation. Browser smoke checks use mocked API responses; no real health records are created during verification.
