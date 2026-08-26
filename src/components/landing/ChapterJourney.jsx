import { BitCharacter } from "./BitCharacter.jsx";
import styles from "../../pages/Landing.module.css";

function Phrase({ children }) {
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

export default function ChapterJourney() {
  return (
    <section className={`${styles.scene} ${styles.journeyScene}`} data-scene="journey" aria-labelledby="journey-title">
      <div className={styles.sceneBackdrop} aria-hidden="true">
        <span className={styles.chapterNumber}>02</span>
        <span className={`${styles.dataRail} ${styles.dataRailOne}`} />
        <span className={`${styles.dataRail} ${styles.dataRailTwo}`} />
      </div>

      <div className={styles.sceneInner}>
        <div className={styles.copyColumn} data-motion="copy">
          <p className={styles.eyebrow}>Your journey</p>
          <h2 id="journey-title" className={styles.headline}>
            <Phrase>Understand where you are.</Phrase>
            <Phrase>Know where you're going.</Phrase>
            <Phrase>See yourself getting there.</Phrase>
          </h2>
          <p className={styles.lede}>
            Spotter turns meals, workouts, goals, and check-ins into one clear personal story.
          </p>
        </div>

        <div className={`${styles.visualColumn} ${styles.journeyVisual}`} data-motion="visual" aria-label="A preview of personal progress in Spotter">
          <article className={`${styles.productCard} ${styles.progressCard}`} data-card>
            <div className={styles.cardHeader}>
              <div><span className={styles.cardLabel}>12 week progress</span><strong>Moving with purpose</strong></div>
              <span className={styles.upPill}>↑ 8.4%</span>
            </div>
            <div className={styles.chartWrap} aria-hidden="true">
              <svg viewBox="0 0 420 150" preserveAspectRatio="none">
                <defs><linearGradient id="journey-area" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#4F8485" stopOpacity=".28" /><stop offset="1" stopColor="#4F8485" stopOpacity="0" /></linearGradient></defs>
                <path className={styles.chartArea} d="M0 125 C45 112 55 92 92 96 S151 123 188 85 S248 77 278 54 S344 66 420 18 L420 150 L0 150 Z" />
                <path className={styles.chartLine} d="M0 125 C45 112 55 92 92 96 S151 123 188 85 S248 77 278 54 S344 66 420 18" />
              </svg>
            </div>
            <div className={styles.cardFooter}><span><b>75.2</b> kg today</span><span><b>72.0</b> kg goal</span></div>
          </article>

          <article className={`${styles.productCard} ${styles.todayCard}`} data-card>
            <span className={styles.cardLabel}>Today</span>
            <div className={styles.ringAndStat}><div className={styles.progressRing}><span>84%</span></div><div><strong>1,840</strong><small>of 2,200 kcal</small></div></div>
            <div className={styles.macroRow}><span><i className={styles.coralDot} />Protein <b>132g</b></span><span><i className={styles.sageDot} />Carbs <b>188g</b></span></div>
          </article>

          <article className={`${styles.productCard} ${styles.workoutCard}`} data-card>
            <div className={styles.workoutIcon} aria-hidden="true">↗</div>
            <div><span className={styles.cardLabel}>Next workout</span><strong>Push strength</strong><small>45 min · 6 exercises</small></div>
            <span className={styles.playButton} aria-hidden="true">▶</span>
          </article>

          <div className={styles.journeyBit} data-motion="bit" aria-hidden="true"><BitCharacter state="progress" decorative /></div>
        </div>
      </div>
    </section>
  );
}
