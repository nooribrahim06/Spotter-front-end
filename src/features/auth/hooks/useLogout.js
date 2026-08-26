import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../../../api/auth.api.js";
import { useAuthStore } from "../../../stores/authStore.js";
import { queryClient } from "../../../queryClient.js";

/**
 * useLogout — Logout hook.
 *
 * Logout is best-effort on the network and absolute locally.
 * In a finally path:
 *   1. Clear the Zustand auth store
 *   2. Clear the TanStack Query cache
 *   3. Navigate to /login
 *   4. Do not preserve protected return state
 */
export function useLogout() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);

    try {
      await logout();
    } catch {
      // Logout is best-effort on the network. Local cleanup must still
      // complete without leaking a rejected request to the UI.
    } finally {
      clearAuth();
      queryClient.clear();
      navigate("/login", { replace: true });
      setIsLoggingOut(false);
    }
  }, [clearAuth, navigate]);

  return { handleLogout, isLoggingOut };
}
