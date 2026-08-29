import { useEffect } from "react";
import { Link } from "react-router-dom";
import CursorOrb from "../../components/landing/CursorOrb.jsx";
import { BitCharacter } from "../../components/landing/BitCharacter.jsx";
import { useAuthStore } from "../../stores/authStore.js";
import maleAthlete from "../../assets/onboarding/athlete-male.png";
import femaleAthlete from "../../assets/onboarding/athlete-female.png";
import styles from "./Onboarding.module.css";

export default function OnboardingSuccessPage() {
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    document.title = "You're ready — Spotter";
  }, []);

  return (
    <div className={styles.successPage}>
      <CursorOrb />
      <header className={styles.welcomeNav}>
        <span className={styles.brand}>SPOTTER<span>.</span></span>
        <span className={styles.sessionPill}><i /> Starting point saved</span>
      </header>
      <main className={styles.successLayout}>
        <section className={styles.successCopy}>
          <p className={styles.kicker}>You&apos;re all set</p>
          <h1>Your journey has<br /><em>somewhere real to begin.</em></h1>
          <p>
            Nice work, {user?.firstName || user?.username || "Spotter"}. Your baseline,
            first goal, and activity context are ready. From here, every future
            check-in adds detail to the story.
          </p>
          <Link to="/app/home" className={styles.startButton}>
            <span>Enter my Spotter journey</span><i aria-hidden="true">↗</i>
          </Link>
        </section>
        <section className={styles.successVisual} aria-label="Spotter celebrates your completed setup">
          <span className={styles.successWatermark} aria-hidden="true">READY</span>
          <img className={styles.successAthlete} src={user?.sexForCalculation === "FEMALE" ? femaleAthlete : maleAthlete} alt="" aria-hidden="true" />
          <div className={styles.successBit} aria-hidden="true"><BitCharacter state="victory" decorative /></div>
          <div className={styles.successBadge}><span>100%</span><p>Starting point<br /><strong>complete</strong></p></div>
        </section>
      </main>
    </div>
  );
}
