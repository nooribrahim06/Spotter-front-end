import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore.js";
import Spinner from "../ui/Spinner.jsx";

/**
 * GuestGuard — Protects login, signup, and verify-email-sent routes.
 *
 * - initializing → render startup loading state
 * - authenticated → redirect to /app/home
 * - unauthenticated → render children (guest content)
 *
 * Prevents authenticated users from accessing guest-only pages.
 */
export default function GuestGuard() {
  const authStatus = useAuthStore((s) => s.authStatus);

  if (authStatus === "initializing") {
    return (
      <div className="guard-loading">
        <Spinner />
      </div>
    );
  }

  if (authStatus === "authenticated") {
    return <Navigate to="/app/home" replace />;
  }

  return <Outlet />;
}
