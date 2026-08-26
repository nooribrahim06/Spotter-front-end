import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { signup } from "../../../api/auth.api.js";
import { normalizeApiError, mapValidationErrors } from "../../../api/normalizeApiError.js";
import { showError } from "../../../components/ui/Toast.jsx";

/**
 * useSignup — Signup mutation hook.
 *
 * On success → navigates to /verify-email-sent with email in state.
 * Maps INVALID_SCHEMA details to React Hook Form fields.
 * Handles USER_ALREADY_EXISTS, EMAIL_SEND_FAILED, TOO_MANY_REQUESTS.
 *
 * @param {Function} setError - React Hook Form setError
 */
export function useSignup(setError) {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ email, username, password }) =>
      signup({ email, username, password }),

    onSuccess: (_data, variables) => {
      navigate("/verify-email-sent", {
        state: { email: variables.email },
        replace: true,
      });
    },

    onError: (error, variables) => {
      const normalized = normalizeApiError(error);

      switch (normalized.code) {
        case "INVALID_SCHEMA":
          mapValidationErrors(normalized, setError, [
            "email",
            "username",
            "password",
          ]);
          break;

        case "USER_ALREADY_EXISTS":
          setError("root", {
            type: "server",
            message:
              "An account with this email or username already exists.",
          });
          break;

        case "EMAIL_SEND_FAILED":
          // Account may already exist. Guide to resend instead of retry.
          navigate("/verify-email-sent", {
            state: { email: variables.email, emailFailed: true },
            replace: true,
          });
          break;

        case "TOO_MANY_REQUESTS":
          setError("root", {
            type: "server",
            message: "Too many attempts. Please try again later.",
          });
          break;

        case "NETWORK_ERROR":
          showError(
            "Unable to connect to the server. Please check your connection."
          );
          break;

        default:
          setError("root", {
            type: "server",
            message: "Something went wrong. Please try again.",
          });
      }
    },
  });
}
