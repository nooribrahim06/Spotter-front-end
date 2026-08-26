import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore.js";
import Spinner from "../ui/Spinner.jsx";

/**
 * AuthGuard — Protects /app/* routes.
 *
 * - initializing → render startup loading state
 * - unauthenticated → redirect to /login with return path
 * - authenticated → render children
 *
 * The return path is stored in location.state.from and must
 * begin with /app/ to prevent open-redirect attacks.
 */
export default function AuthGuard() {
  const authStatus = useAuthStore((s) => s.authStatus);
  const location = useLocation();

  if (authStatus === "initializing") {
    return (
      <div className="guard-loading">
        <Spinner />
      </div>
    );
  }

  if (authStatus === "unauthenticated") {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return <Outlet />;
}
