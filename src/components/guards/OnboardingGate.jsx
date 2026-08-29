import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore.js";
import { getOnboardingPath, getOnboardingStatus } from "../../features/onboarding/onboarding.domain.js";

export default function OnboardingGate() {
  const user = useAuthStore((state) => state.user);

  if (getOnboardingStatus(user) !== "completed") {
    return <Navigate to={getOnboardingPath(user)} replace />;
  }

  return <Outlet />;
}
