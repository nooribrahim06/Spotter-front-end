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

const members = [["MK", "mint"], ["SA", "coral"], ["JO", "ink"], ["+2k", "sage"]];

export function ChapterCommunity() {
  return (
    <section className={`${styles.scene} ${styles.communityScene}`} data-scene="community" aria-labelledby="community-title">
      <div className={styles.sceneBackdrop} aria-hidden="true"><span className={styles.chapterNumber}>04</span><span className={`${styles.communityOrb} ${styles.communityOrbOne}`} /><span className={`${styles.communityOrb} ${styles.communityOrbTwo}`} /></div>
      <div className={styles.sceneInner}>
        <div className={styles.copyColumn} data-motion="copy">
          <p className={styles.eyebrow}>Community</p>
          <h2 id="community-title" className={styles.headline}><Phrase>Progress feels better together.</Phrase></h2>
          <p className={styles.lede}>Share the moments that matter, find people moving like you, and celebrate the work behind every win.</p>
        </div>

        <div className={`${styles.visualColumn} ${styles.communityVisual}`} data-motion="visual" aria-label="A Spotter community achievement post">
          <div className={styles.memberCloud} data-card aria-hidden="true">{members.map(([label, tone], index) => <span key={label} className={styles[tone]} style={{ "--i": index }}>{label}</span>)}</div>
          <article className={`${styles.socialCard} ${styles.productCard}`} data-card>
            <header className={styles.postHeader}><div className={styles.postAvatar}>AC</div><div><strong>Alex Chen</strong><small>Just now · Strength</small></div><button type="button" aria-label="More post options">•••</button></header>
            <div className={styles.achievementPanel}><span className={styles.achievementKicker}>NEW PERSONAL BEST</span><strong>100<span>kg</span></strong><p>Bench press · Week 12</p><div className={styles.achievementTrack}><span /></div></div>
            <p className={styles.postCopy}>A year ago this felt impossible. Today it moved. Keep showing up. 🔥</p>
            <footer className={styles.reactionRow}><span>♥ 248</span><span>◯ 31</span><span>↗ Share</span><span className={styles.saveIcon}>▱</span></footer>
          </article>
          <div className={styles.communityBit} data-motion="bit" aria-hidden="true"><BitCharacter state="celebrating" decorative /></div>
        </div>
      </div>
    </section>
  );
}
