import { useMutation } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { login } from "../../../api/auth.api.js";
import { useAuthStore } from "../../../stores/authStore.js";
import { normalizeApiError } from "../../../api/normalizeApiError.js";
import { showError } from "../../../components/ui/Toast.jsx";

/**
 * useLogin — Login mutation hook.
 *
 * On success → setAuth(), navigate to validated return path or /app/home.
 * Shows one generic error for INVALID_CREDENTIALS (never branches on message).
 *
 * @param {Function} setError - React Hook Form setError
 */
export function useLogin(setError) {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);

  // Validate return path: must start with /app/
  const returnPath = location.state?.from;
  const safeReturnPath =
    typeof returnPath === "string" && returnPath.startsWith("/app/")
      ? returnPath
      : "/app/home";

  return useMutation({
    mutationFn: ({ email, password }) => login({ email, password }),

    onSuccess: (response) => {
      const { user, accessToken } = response.data;
      setAuth({ user, accessToken });
      navigate(safeReturnPath, { replace: true });
    },

    onError: (error) => {
      const normalized = normalizeApiError(error);

      switch (normalized.code) {
        case "INVALID_CREDENTIALS":
          // Generic message — never branch on backend message text.
          // Wrong email, wrong password, and unverified all use this code.
          setError("root", {
            type: "server",
            message: "Invalid email or password.",
          });
          break;

        case "TOO_MANY_REQUESTS":
          setError("root", {
            type: "server",
            message: "Too many login attempts. Please try again later.",
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
