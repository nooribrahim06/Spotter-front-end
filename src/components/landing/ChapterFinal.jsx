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

export function ChapterFinal({ authenticated = false }) {
  return (
    <section className={`${styles.scene} ${styles.finalScene}`} data-scene="final" aria-labelledby="final-title">
      <div className={styles.sceneBackdrop} aria-hidden="true">
        <span className={styles.finalWatermark}>ONE</span>
        <span className={`${styles.finalArc} ${styles.finalArcOuter}`} />
        <span className={`${styles.finalArc} ${styles.finalArcInner}`} />
      </div>

      <div className={styles.sceneInner}>
        <div className={styles.copyColumn} data-motion="copy">
          <p className={styles.eyebrow}>Everything, connected</p>
          <h2 id="final-title" className={`${styles.headline} ${styles.finalHeadline}`}>
            <Phrase>One journey.</Phrase>
            <Phrase>One community.</Phrase>
            <Phrase>One coach.</Phrase>
            <Phrase>One Spotter.</Phrase>
          </h2>
          <p className={styles.lede}>
            Everything that moves you forward, connected around one goal: becoming your strongest self.
          </p>
          <div className={styles.finalActions}>
            <a className={styles.finalCta} href={authenticated ? "#top" : "/signup"}>
              {authenticated ? "Replay the story" : "Start your journey"} <span aria-hidden="true">↗</span>
            </a>
            {!authenticated && <a className={styles.finalSignIn} href="/login">Already a member? <b>Sign in</b></a>}
          </div>
        </div>

        <div className={`${styles.visualColumn} ${styles.finalVisual}`} data-motion="visual" aria-label="Journey, coaching, and community coming together around Bit">
          <div className={styles.finalHalo} aria-hidden="true" />

          <div className={`${styles.finalNode} ${styles.journeyNode}`} data-card>
            <span className={styles.nodeIcon}>↗</span>
            <span><small>Your journey</small><strong>12 weeks stronger</strong></span>
          </div>

          <div className={`${styles.finalNode} ${styles.coachNode}`} data-card>
            <span className={styles.nodeIcon}>◎</span>
            <span><small>Your coach</small><strong>Direction that knows you</strong></span>
          </div>

          <div className={`${styles.finalNode} ${styles.peopleNode}`} data-card>
            <span className={styles.nodeFaces} aria-hidden="true"><i>AC</i><i>SA</i><i>+8</i></span>
            <span><small>Your community</small><strong>Momentum, shared</strong></span>
          </div>

          <div className={styles.finalBit} data-motion="bit" aria-hidden="true">
            <BitCharacter state="victory" decorative />
          </div>
        </div>
      </div>

      <p className={styles.finalFootnote}>Built for the whole journey—not just the highlight.</p>
    </section>
  );
}
