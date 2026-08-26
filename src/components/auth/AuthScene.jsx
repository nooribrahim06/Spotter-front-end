import { BitCharacter } from "../landing/BitCharacter.jsx";
import styles from "./AuthScene.module.css";

export default function AuthScene({
  children,
  mascotState = "idle",
  artworkSrc,
  artworkAlt = "Spotter reacting to this screen",
  visualKicker = "Your Spotter is here",
  visualTitle,
  visualText,
  tone = "default",
}) {
  return (
    <section className={styles.scene} data-tone={tone}>
      <div className={styles.formPane}>
        <div className={styles.formInner}>{children}</div>
        <p className={styles.privacyNote}>
          <span aria-hidden="true">●</span> Your account details stay private and protected.
        </p>
      </div>

      <aside className={styles.visualPane} aria-label={visualTitle}>
        <div className={styles.visualGrid} aria-hidden="true" />
        <span className={styles.watermark} aria-hidden="true">SPOTTER</span>
        <span className={`${styles.orbit} ${styles.orbitOne}`} aria-hidden="true" />
        <span className={`${styles.orbit} ${styles.orbitTwo}`} aria-hidden="true" />

        <div className={styles.visualCopy}>
          <p>{visualKicker}</p>
          <h2>{visualTitle}</h2>
          <span>{visualText}</span>
        </div>

        {artworkSrc ? (
          <div className={styles.variantFrame}>
            <img src={artworkSrc} alt={artworkAlt} />
          </div>
        ) : (
          <div className={styles.character} key={mascotState} aria-hidden="true">
            <BitCharacter state={mascotState} decorative />
          </div>
        )}

        <div className={styles.statusPill} aria-hidden="true">
          <i /> One journey · One account
        </div>
      </aside>
    </section>
  );
}
