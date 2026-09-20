import { Outlet, Link, NavLink, useMatches } from "react-router-dom";
import CursorOrb from "../components/landing/CursorOrb.jsx";
import AccountMenu from "./AccountMenu.jsx";
import { useTimezoneSync } from "../features/profile/timezone.js";
import styles from "./AppLayout.module.css";

function NavIcon({ name }) {
  const paths = {
    today: <><path d="M4 11.5 12 5l8 6.5" /><path d="M6.5 10.5V20h11v-9.5M10 20v-5h4v5" /></>,
    meals: <><path d="M3 11h18" /><path d="M5 7l1 4" /><path d="M19 7l-1 4" /><path d="M12 4v3" /><path d="M5 11c0 5 3 8 7 8s7-3 7-8" /></>,
    training: <><path d="m7 7 10 10M3 7l4-4m10 18 4-4M4 10l6-6m4 16 6-6" /></>,
    progress: <><path d="M4 5v15h16M7 15l4-4 4 2 5-7" /></>,
    plans: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" /></>,
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
  useTimezoneSync();
  const matches = useMatches();
  const isImmersive = matches.some((match) => match.handle?.immersive);

  return (
    <div className={styles.layout}>
      {!isImmersive && !matches.some(match => match.handle?.training) && <CursorOrb />}
      <a href="#main-content" className="skip-nav">
        Skip to main content
      </a>

      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/app/home" className={styles.brand} aria-label="Spotter home">SPOTTER<span>.</span></Link>
          <nav className={styles.primaryNav} aria-label="Main navigation">
            <NavLink to="/app/home" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`.trim()}>Today</NavLink>
            <NavLink to="/app/meals" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`.trim()}>Meals</NavLink>
            <NavLink to="/app/training" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`.trim()}>Training</NavLink>
            <NavLink to="/app/plans" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`.trim()}>Plans</NavLink>
            <NavLink to="/app/progress" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`.trim()}>Progress</NavLink>
          </nav>
          <div className={styles.userArea}><AccountMenu /></div>
        </div>
      </header>

      <nav className={styles.mobileNav} aria-label="Mobile navigation">
        <NavLink to="/app/home" className={({ isActive }) => `${styles.mobileNavLink} ${isActive ? styles.mobileNavLinkActive : ""}`.trim()}>
          <NavIcon name="today" /><span>Today</span>
        </NavLink>
        <NavLink to="/app/meals" className={({ isActive }) => `${styles.mobileNavLink} ${isActive ? styles.mobileNavLinkActive : ""}`.trim()}>
          <NavIcon name="meals" /><span>Meals</span>
        </NavLink>
        <NavLink to="/app/training" className={({ isActive }) => `${styles.mobileNavLink} ${isActive ? styles.mobileNavLinkActive : ""}`.trim()}><NavIcon name="training" /><span>Training</span></NavLink>
        <NavLink to="/app/plans" className={({ isActive }) => `${styles.mobileNavLink} ${isActive ? styles.mobileNavLinkActive : ""}`.trim()}><NavIcon name="plans" /><span>Plans</span></NavLink>
        <NavLink to="/app/progress" className={({ isActive }) => `${styles.mobileNavLink} ${isActive ? styles.mobileNavLinkActive : ""}`.trim()}><NavIcon name="progress" /><span>Progress</span></NavLink>
      </nav>

      <main id="main-content" className={`${styles.main} ${isImmersive ? styles.mainImmersive : ""}`}>
        <Outlet />
      </main>
    </div>
  );
}
