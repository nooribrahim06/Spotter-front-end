import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import CursorOrb from "../../components/landing/CursorOrb.jsx";
import { BitCharacter } from "../../components/landing/BitCharacter.jsx";
import { useAuthStore } from "../../stores/authStore.js";
import { loadOnboarding } from "../../features/onboarding/api/onboarding.api.js";
import maleAthlete from "../../assets/onboarding/athlete-male.png";
import femaleAthlete from "../../assets/onboarding/athlete-female.png";
import styles from "./Onboarding.module.css";

export default function OnboardingWelcomePage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const onboarding = useQuery({
    queryKey: ["onboarding"],
    queryFn: loadOnboarding,
    staleTime: 0,
  });

  useEffect(() => {
    document.title = "Your starting point — Spotter";
  }, []);

  const begin = () => {
    const nextStep = onboarding.data?.status === "in_progress"
      ? onboarding.data.currentStep || 1
      : 1;
    navigate(`/onboarding/${nextStep}`);
  };

  return (
    <div className={styles.welcomePage}>
      <CursorOrb />
      <header className={styles.welcomeNav}>
        <span className={styles.brand}>SPOTTER<span>.</span></span>
        <span className={styles.sessionPill}><i /> Your starting line</span>
      </header>

      <main className={styles.welcomeGrid}>
        <section className={styles.welcomeCopy}>
          <p className={styles.kicker}>Welcome in, {user?.username || "Spotter"}</p>
          <h1>
            Before we move,<br />
            <em>let&apos;s find your start.</em>
          </h1>
          <p className={styles.welcomeText}>
            Give Spotter a few essentials so every goal, check-in, and future
            recommendation begins with your real context—not a generic plan.
          </p>

          {onboarding.isError && (
            <div className={styles.loadError} role="alert">
              <span>We couldn&apos;t load your saved progress.</span>
              <button type="button" onClick={() => onboarding.refetch()}>Try again</button>
            </div>
          )}

          <button
            type="button"
            className={styles.startButton}
            onClick={begin}
            disabled={onboarding.isLoading || onboarding.isError}
          >
            <span>
              {onboarding.isLoading
                ? "Finding your progress…"
                : onboarding.data?.status === "in_progress"
                  ? "Continue my setup"
                  : "Build my starting point"}
            </span>
            <i aria-hidden="true">↗</i>
          </button>

          <div className={styles.welcomeMeta}>
            <span><b>03</b> focused steps</span>
            <span><b>~3</b> minutes</span>
            <span><b>✓</b> saved as you go</span>
          </div>
        </section>

        <section className={styles.welcomeVisual} aria-label="Spotter welcomes you to onboarding">
          <div className={styles.visualGrid} aria-hidden="true" />
          <span className={styles.welcomeWatermark} aria-hidden="true">START</span>
          <div className={`${styles.welcomeAthlete} ${styles.welcomeMale}`} aria-hidden="true">
            <img src={maleAthlete} alt="" />
          </div>
          <div className={`${styles.welcomeAthlete} ${styles.welcomeFemale}`} aria-hidden="true">
            <img src={femaleAthlete} alt="" />
          </div>
          <div className={styles.welcomeBit} aria-hidden="true">
            <BitCharacter state="pointing" decorative />
          </div>
          <div className={styles.bitMessage}>
            <span aria-hidden="true">●</span>
            <p><strong>I&apos;ll stay with you.</strong><br />One answer at a time.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
