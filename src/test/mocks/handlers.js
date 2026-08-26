import { http, HttpResponse } from "msw";

/**
 * Default MSW handlers.
 * Tests provide their own handlers via server.use(...).
 * These defaults are only a safety net for unhandled requests.
 */
export const handlers = [];
