import { Outlet, Link, useMatches } from "react-router-dom";
import { useLogout } from "../features/auth/hooks/useLogout.js";
import Button from "../components/ui/Button.jsx";
import styles from "./AppLayout.module.css";

/**
 * AppLayout — Protected application shell for /app/* routes.
 *
 * Provides:
 * - Skip navigation
 * - Header with brand and logout
 * - Nav placeholder (presentation pending style brief)
 * - <main> landmark
 */
export default function AppLayout() {
  const { handleLogout, isLoggingOut } = useLogout();
  const matches = useMatches();
  const isImmersive = matches.some((match) => match.handle?.immersive);

  return (
    <div className={styles.layout}>
      <a href="#main-content" className="skip-nav">
        Skip to main content
      </a>

      {!isImmersive && (
        <header className={styles.header}>
          <Link to="/app/home" className={styles.brand}>SPOTTER</Link>
          <nav className={styles.nav} aria-label="Main navigation">
            <Button variant="ghost" size="sm" onClick={handleLogout} isLoading={isLoggingOut} disabled={isLoggingOut}>Log out</Button>
          </nav>
        </header>
      )}

      <main id="main-content" className={`${styles.main} ${isImmersive ? styles.mainImmersive : ""}`}>
        <Outlet />
      </main>
    </div>
  );
}
