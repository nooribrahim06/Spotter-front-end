import { Outlet, Link, NavLink, useMatches } from "react-router-dom";
import CursorOrb from "../components/landing/CursorOrb.jsx";
import AccountMenu from "./AccountMenu.jsx";
import styles from "./AppLayout.module.css";

function NavIcon({ name }) {
  const paths = {
    today: <><path d="M4 11.5 12 5l8 6.5" /><path d="M6.5 10.5V20h11v-9.5M10 20v-5h4v5" /></>,
    goals: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><path d="m15.5 8.5 4-4m-1 0h1v1" /></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

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

      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/app/home" className={styles.brand} aria-label="Spotter home">SPOTTER<span>.</span></Link>
          <nav className={styles.primaryNav} aria-label="Main navigation">
            <NavLink to="/app/home" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`.trim()}>Today</NavLink>
            <NavLink to="/app/goals" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`.trim()}>Goals</NavLink>
          </nav>
          <div className={styles.userArea}><AccountMenu /></div>
        </div>
      </header>

      <nav className={styles.mobileNav} aria-label="Mobile navigation">
        <NavLink to="/app/home" className={({ isActive }) => `${styles.mobileNavLink} ${isActive ? styles.mobileNavLinkActive : ""}`.trim()}>
          <NavIcon name="today" /><span>Today</span>
        </NavLink>
        <NavLink to="/app/goals" className={({ isActive }) => `${styles.mobileNavLink} ${isActive ? styles.mobileNavLinkActive : ""}`.trim()}>
          <NavIcon name="goals" /><span>Goals</span>
        </NavLink>
      </nav>

      <main id="main-content" className={`${styles.main} ${isImmersive ? styles.mainImmersive : ""}`}>
        <Outlet />
      </main>
    </div>
  );
}
