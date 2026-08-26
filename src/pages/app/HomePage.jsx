import { useEffect } from "react";
import LandingPage from "../LandingPage.jsx";
import { useAuthStore } from "../../stores/authStore.js";
import { useLogout } from "../../features/auth/hooks/useLogout.js";

export default function HomePage() {
  const user = useAuthStore((state) => state.user);
  const { handleLogout, isLoggingOut } = useLogout();

  useEffect(() => {
    document.title = "Home — Spotter";
  }, []);

  return (
    <LandingPage
      authenticated
      user={user}
      onLogout={handleLogout}
      isLoggingOut={isLoggingOut}
    />
  );
}
