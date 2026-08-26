import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BitCharacter } from "../components/landing/BitCharacter.jsx";
import CursorOrb from "../components/landing/CursorOrb.jsx";
import styles from "./NotFoundPage.module.css";

export default function NotFoundPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAppRoute = location.pathname.startsWith("/app/");
  const homePath = isAppRoute ? "/app/home" : "/";

  useEffect(() => {
    document.title = "Off Track — Spotter";
  }, []);

  return (
    <section className={styles.page}>
      <CursorOrb />

      <nav className={styles.nav} aria-label="Page not found navigation">
        <Link to={homePath} className={styles.brand} aria-label="Spotter home">
          SPOTTER<span>.</span>
        </Link>

        <span className={styles.routeStatus}>
          <i aria-hidden="true" /> Route unavailable
        </span>
      </nav>

      <div className={styles.layout}>
        <main className={styles.copy}>
          <p className={styles.eyebrow}>
            <span>404</span> A little off track
          </p>

          <h1>
            This path missed <em>the mark.</em>
          </h1>

          <p className={styles.intro}>
            We couldn&apos;t find this page, but your journey is still right where
            you left it. Let&apos;s get you moving again.
          </p>

          <div className={styles.actions}>
            <Link to={homePath} className={styles.primaryAction}>
              <span>{isAppRoute ? "Back to my journey" : "Return to Spotter"}</span>
              <i aria-hidden="true">↗</i>
            </Link>

            <button
              type="button"
              className={styles.secondaryAction}
              onClick={() => navigate(-1)}
            >
              <i aria-hidden="true">←</i>
              <span>Go back</span>
            </button>
          </div>

          <div className={styles.pathCard}>
            <span>Requested path</span>
            <code>{location.pathname}</code>
          </div>
        </main>

        <aside className={styles.visual} aria-label="Spotter is disappointed that this page is missing">
          <div className={styles.grid} aria-hidden="true" />
          <span className={styles.giantNumber} aria-hidden="true">404</span>
          <span className={`${styles.orbit} ${styles.orbitOne}`} aria-hidden="true" />
          <span className={`${styles.orbit} ${styles.orbitTwo}`} aria-hidden="true" />

          <div className={styles.character} aria-hidden="true">
            <BitCharacter state="disappointed" decorative />
          </div>

          <div className={styles.encouragement}>
            <span aria-hidden="true">↳</span>
            <p><strong>Wrong turn.</strong> Not the end of the journey.</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
