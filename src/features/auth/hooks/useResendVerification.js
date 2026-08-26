import { useMutation } from "@tanstack/react-query";
import { resendVerification } from "../../../api/auth.api.js";
import { normalizeApiError } from "../../../api/normalizeApiError.js";
import { showSuccess, showError } from "../../../components/ui/Toast.jsx";

/**
 * useResendVerification — Resend verification email mutation.
 *
 * Always shows a neutral success message regardless of response.
 * The backend response is intentionally identical for missing,
 * verified, and eligible accounts. The frontend MUST NOT claim
 * that a particular account exists.
 */
export function useResendVerification() {
  return useMutation({
    mutationFn: ({ email }) => resendVerification({ email }),

    onSuccess: () => {
      showSuccess(
        "If the account exists and is not verified, a verification email has been sent."
      );
    },

    onError: (error) => {
      const normalized = normalizeApiError(error);

      switch (normalized.code) {
        case "TOO_MANY_REQUESTS":
          showError("Too many resend attempts. Please try again later.");
          break;

        case "NETWORK_ERROR":
          showError(
            "Unable to connect to the server. Please check your connection."
          );
          break;

        default:
          showError("Something went wrong. Please try again.");
      }
    },
  });
}
