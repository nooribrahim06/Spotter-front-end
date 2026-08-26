/**
 * Spotter — API Error Normalizer
 *
 * Converts raw Axios errors into a consistent, frontend-friendly shape.
 * The frontend MUST branch on `code`, never on message text.
 *
 * Normalized shape:
 * {
 *   status:         number | null,
 *   code:           string,
 *   message:        string,
 *   details:        Array<{ field, message }> | null,
 *   isNetworkError: boolean,
 *   isTimeout:      boolean,
 * }
 */

/**
 * @param {Error} error - Raw Axios error or any thrown error
 * @returns {object} Normalized error object
 */
export function normalizeApiError(error) {
  // Network failure (no response received)
  if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
    return {
      status: null,
      code: "NETWORK_ERROR",
      message: "Unable to connect to the server. Please check your connection.",
      details: null,
      isNetworkError: true,
      isTimeout: false,
    };
  }

  // Timeout
  if (error.code === "ECONNABORTED" || error.code === "ERR_CANCELED") {
    return {
      status: null,
      code: "TIMEOUT",
      message: "The request timed out. Please try again.",
      details: null,
      isNetworkError: false,
      isTimeout: true,
    };
  }

  // Server responded with an error
  if (error.response) {
    const { status, data } = error.response;
    const code = data?.code || `HTTP_${status}`;
    const message = data?.error || "An unexpected error occurred.";
    const details = Array.isArray(data?.details) ? data.details : null;

    return {
      status,
      code,
      message,
      details,
      isNetworkError: false,
      isTimeout: false,
    };
  }

  // Unknown/unexpected error
  return {
    status: null,
    code: "UNKNOWN_ERROR",
    message: "An unexpected error occurred.",
    details: null,
    isNetworkError: false,
    isTimeout: false,
  };
}

/**
 * Map INVALID_SCHEMA details into React Hook Form setError calls.
 * Unknown field paths are collected and returned as a root error.
 *
 * @param {object} normalizedError - Output of normalizeApiError
 * @param {Function} setError - React Hook Form's setError
 * @param {string[]} knownFields - List of field names the form knows about
 * @returns {string|null} Root-level error message if unknown fields found
 */
export function mapValidationErrors(normalizedError, setError, knownFields) {
  if (normalizedError.code !== "INVALID_SCHEMA" || !normalizedError.details) {
    return null;
  }

  const unknownMessages = [];

  for (const detail of normalizedError.details) {
    if (knownFields.includes(detail.field)) {
      setError(detail.field, {
        type: "server",
        message: detail.message,
      });
    } else {
      unknownMessages.push(detail.message);
    }
  }

  if (unknownMessages.length > 0) {
    const rootMessage = unknownMessages.join(" ");
    setError("root", {
      type: "server",
      message: rootMessage,
    });
    return rootMessage;
  }

  return null;
}
