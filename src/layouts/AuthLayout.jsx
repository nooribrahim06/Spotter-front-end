import { Outlet, Link } from "react-router-dom";
import styles from "./AuthLayout.module.css";
import CursorOrb from "../components/landing/CursorOrb.jsx";

/**
 * AuthLayout — Centered layout for login, signup, verification, resend.
 *
 * Provides:
 * - Skip navigation
 * - Brand link back to landing
 * - Centered <main> for auth forms
 */
export default function AuthLayout() {
  return (
    <div className={styles.layout}>
      <CursorOrb />
      <a href="#main-content" className="skip-nav">
        Skip to main content
      </a>

      <Link to="/" className={styles.brand}>
        SPOTTER<span>.</span>
      </Link>

      <main id="main-content" className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
