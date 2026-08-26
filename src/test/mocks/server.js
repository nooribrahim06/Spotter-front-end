import { setupServer } from "msw/node";
import { handlers } from "./handlers.js";

/**
 * MSW server for intercepting HTTP requests in tests.
 * Initialized with default handlers; tests add their own via server.use(...).
 */
export const server = setupServer(...handlers);
