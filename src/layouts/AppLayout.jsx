import { Outlet, Link, NavLink, useMatches } from "react-router-dom";
import CursorOrb from "../components/landing/CursorOrb.jsx";
import AccountMenu from "./AccountMenu.jsx";
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
  const matches = useMatches();
  const isImmersive = matches.some((match) => match.handle?.immersive);

  return (
    <div className={styles.layout}>
      {!isImmersive && <CursorOrb />}
      <a href="#main-content" className="skip-nav">
        Skip to main content
      </a>

      {!isImmersive && (
        <header className={styles.header}>
          <Link to="/app/home" className={styles.brand}>SPOTTER<span>.</span></Link>
          <nav className={styles.nav} aria-label="Main navigation">
            <NavLink to="/app/home" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`.trim()}>Today</NavLink>
            <AccountMenu />
          </nav>
        </header>
      )}

      <main id="main-content" className={`${styles.main} ${isImmersive ? styles.mainImmersive : ""}`}>
        <Outlet />
      </main>
    </div>
  );
}
