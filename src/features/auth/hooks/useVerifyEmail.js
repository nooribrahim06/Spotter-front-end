import { useMutation } from "@tanstack/react-query";
import { verifyEmail } from "../../../api/auth.api.js";
import { normalizeApiError } from "../../../api/normalizeApiError.js";

/**
 * useVerifyEmail — Email verification mutation.
 *
 * Returns the mutation along with normalized error state
 * so the page can render:
 *   - missing token
 *   - loading
 *   - success (with login link)
 *   - invalid/expired token
 *   - rate limit
 *   - network error
 *
 * Success does NOT automatically log the user in.
 */
export function useVerifyEmail() {
  const mutation = useMutation({
    mutationFn: ({ token }) => verifyEmail({ token }),
  });

  // Derive the page state from the mutation state
  let verificationState = "idle";
  let errorInfo = null;

  if (mutation.isPending) {
    verificationState = "loading";
  } else if (mutation.isSuccess) {
    verificationState = "success";
  } else if (mutation.isError) {
    const normalized = normalizeApiError(mutation.error);

    switch (normalized.code) {
      case "INVALID_TOKEN":
        verificationState = "invalid";
        errorInfo = {
          message:
            "This verification link is invalid or has expired.",
        };
        break;

      case "TOO_MANY_REQUESTS":
        verificationState = "rate-limited";
        errorInfo = {
          message:
            "Too many verification attempts. Please try again later.",
        };
        break;

      case "NETWORK_ERROR":
        verificationState = "network-error";
        errorInfo = {
          message:
            "Unable to connect to the server. Please check your connection and try again.",
        };
        break;

      default:
        verificationState = "error";
        errorInfo = {
          message: "Something went wrong. Please try again.",
        };
    }
  }

  return {
    verify: mutation.mutate,
    verificationState,
    errorInfo,
    reset: mutation.reset,
  };
}
