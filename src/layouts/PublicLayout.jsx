import { Outlet } from "react-router-dom";
import styles from "./PublicLayout.module.css";

/**
 * PublicLayout — Immersive shell for the landing page and standalone 404.
 *
 * Provides:
 * - Skip navigation for keyboard users
 * - <main> landmark
 */
export default function PublicLayout() {
  return (
    <div className={styles.layout}>
      <a href="#main-content" className="skip-nav">
        Skip to main content
      </a>

      <main id="main-content" className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
