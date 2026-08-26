import { BitCharacter } from "./BitCharacter.jsx";
import styles from "../../pages/Landing.module.css";

function KineticLine({ children }) {
  const words = children.split(" ");
  return (
    <span className={styles.kineticLine}>
      {words.map((word, index) => (
        <span className={styles.wordMask} key={`${word}-${index}`}>
          <span data-word>{word}</span>{index < words.length - 1 ? "\u00a0" : null}
        </span>
      ))}
    </span>
  );
}

export function ChapterIdentity({ authenticated = false }) {
  return (
    <section className={`${styles.scene} ${styles.identityScene}`} data-scene="identity" aria-labelledby="identity-title">
      <div className={styles.sceneBackdrop} aria-hidden="true">
        <span className={styles.heroWatermark}>SPOTTER</span>
        <span className={`${styles.orbit} ${styles.orbitOne}`} />
        <span className={`${styles.orbit} ${styles.orbitTwo}`} />
      </div>

      <div className={styles.sceneInner}>
        <div className={styles.copyColumn} data-motion="copy">
          <p className={styles.eyebrow} data-intro-copy>One connected fitness world</p>
          <h1 id="identity-title" className={`${styles.headline} ${styles.heroHeadline}`}>
            <KineticLine>Your body.</KineticLine>
            <KineticLine>Your goals.</KineticLine>
            <KineticLine>Your Spotter.</KineticLine>
          </h1>
          <p className={styles.lede} data-intro-copy>
            Your journey, community, and coach—finally moving in the same direction.
          </p>
          <div className={styles.ctaRow} data-intro-copy>
            <a className={styles.primaryCta} href={authenticated ? "#journey" : "/signup"}>
              {authenticated ? "Continue exploring" : "Get started"} <span aria-hidden="true">↗</span>
            </a>
            <a className={styles.textCta} href="#journey">Explore the story <span aria-hidden="true">↓</span></a>
          </div>
        </div>

        <div className={`${styles.visualColumn} ${styles.heroVisual}`} data-motion="visual" aria-hidden="true">
          <div className={styles.heroHalo} />
          <span className={`${styles.floatingLabel} ${styles.labelTop}`}>Goals in focus</span>
          <span className={`${styles.floatingLabel} ${styles.labelBottom}`}>Every rep counts</span>
          <div className={styles.heroBit} data-motion="bit">
            <BitCharacter state="letsGo" decorative />
          </div>
        </div>
      </div>

      <div className={styles.scrollCue} data-intro-copy aria-hidden="true">
        <span className={styles.scrollLine} />
        Scroll to move with Bit
      </div>
    </section>
  );
}
