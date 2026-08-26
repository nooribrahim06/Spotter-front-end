import { useState } from "react";
import { BitCharacter } from "./BitCharacter.jsx";
import styles from "../../pages/Landing.module.css";

const COACHING_MODES = {
  ai: {
    label: "Spotter AI",
    status: "Looking at your journey",
    mascot: "thinking",
    message: "You trained harder than usual yesterday and recovery is a little low.",
    prompt: "Want me to adjust today’s plan?",
    handoff: "Coach Sarah joined the plan",
    note: "“Good call. I’ve reviewed the adjustment.”",
  },
  human: {
    label: "Coach Sarah",
    status: "Reviewing your progress",
    mascot: "pointing",
    message: "Your strength trend is up while your recovery has stayed consistent.",
    prompt: "Let’s progress the main lift and keep accessories steady.",
    handoff: "Spotter AI prepared the context",
    note: "Your full journey is ready for Sarah to review.",
  },
  together: {
    label: "Spotter Duo",
    status: "AI + Sarah, in sync",
    mascot: "aiCoach",
    message: "Spotter noticed the pattern. Sarah checked the decision.",
    prompt: "Today’s plan is adjusted—and still moving toward your goal.",
    handoff: "Plan updated together",
    note: "Context from AI. Judgment from your coach.",
  },
};

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

export function ChapterCoaching() {
  const [activeMode, setActiveMode] = useState("ai");
  const mode = COACHING_MODES[activeMode];

  return (
    <section className={`${styles.scene} ${styles.coachingScene}`} data-scene="coaching" aria-labelledby="coaching-title">
      <div className={styles.sceneBackdrop} aria-hidden="true"><span className={styles.chapterNumber}>03</span><span className={`${styles.signalRing} ${styles.signalRingOne}`} /><span className={`${styles.signalRing} ${styles.signalRingTwo}`} /></div>
      <div className={styles.sceneInner}>
        <div className={styles.copyColumn} data-motion="copy">
          <p className={styles.eyebrow}>Coaching</p>
          <h2 id="coaching-title" className={styles.headline}><Phrase>Your data becomes context.</Phrase><Phrase>Your context becomes direction.</Phrase></h2>
          <p className={styles.lede}>Use AI, work with a human coach, or bring both together around the same journey.</p>
          <div className={styles.modeRow} aria-label="Coaching options">
            {Object.entries({ ai: "AI coach", human: "Human coach", together: "Together" }).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={activeMode === key ? styles.activeMode : ""}
                aria-pressed={activeMode === key}
                onClick={() => setActiveMode(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className={`${styles.visualColumn} ${styles.coachingVisual}`} data-motion="visual" aria-label="A contextual coaching conversation in Spotter">
          <article className={`${styles.coachPanel} ${styles.productCard}`} data-card aria-live="polite">
            <header className={styles.coachHeader}>
              <div className={styles.bitAvatar}><BitCharacter state={mode.mascot} decorative /></div>
              <div><strong>{mode.label}</strong><small><i /> {mode.status}</small></div>
              <button type="button" aria-label="More coaching options">•••</button>
            </header>
            <div className={styles.contextChips} aria-label="Context used for this response"><span>Goal · 72 kg</span><span>Push day · 58 min</span><span>Sleep · 7h 24m</span></div>
            <div className={styles.aiBubble}>{mode.message}<strong>{mode.prompt}</strong></div>
            <div className={styles.replyBubble}>Yes—keep the momentum, lower the volume.</div>
            <footer className={styles.humanHandoff}><div className={styles.coachAvatar}>SA</div><div><span>{mode.handoff}</span><strong>{mode.note}</strong></div><span className={styles.checkMark}>✓</span></footer>
          </article>
          <div className={styles.coachingBit} data-motion="bit" aria-hidden="true"><BitCharacter state="aiCoach" decorative /></div>
        </div>
      </div>
    </section>
  );
}
