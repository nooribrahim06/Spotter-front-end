import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore.js";
import { getOnboardingStatus } from "../../features/onboarding/onboarding.domain.js";

export default function OnboardingRouteGuard() {
  const user = useAuthStore((state) => state.user);

  if (getOnboardingStatus(user) === "completed") {
    return <Navigate to="/app/home" replace />;
  }

  return <Outlet />;
}
