import { forwardRef } from "react";
import styles from "./BitCharacter.module.css";
import letsGoAsset from "../../assets/spotter/spotter-muscle-lets-go_1024x683.webp";

import idleAsset from "../../assets/identity/01_idle_hello/WEBP/01_idle_hello_768x1024.webp";
import pointingAsset from "../../assets/identity/02_pointing/WEBP/02_pointing_768x1024.webp";
import thinkingAsset from "../../assets/identity/03_thinking/WEBP/03_thinking_748x1024.webp";
import progressAsset from "../../assets/identity/04_progress_dashboard/WEBP/04_progress_dashboard_758x1024.webp";
import aiCoachAsset from "../../assets/identity/05_ai_coach/WEBP/05_ai_coach_768x1024.webp";
import celebratingAsset from "../../assets/identity/06_celebrating/WEBP/06_celebrating_785x1024.webp";
import victoryAsset from "../../assets/identity/07_victory/WEBP/07_victory_750x1024.webp";
import disappointedAsset from "../../assets/identity/08_disappointed/WEBP/spotter-disappointed_737x1024.webp";

// Mapping logical states to their respective asset URLs.
const STATE_ASSETS = {
  idle: idleAsset,
  letsGo: letsGoAsset,
  pointing: pointingAsset,
  thinking: thinkingAsset,
  progress: progressAsset,
  aiCoach: aiCoachAsset,
  celebrating: celebratingAsset,
  victory: victoryAsset,
  disappointed: disappointedAsset,
};

export const BitCharacter = forwardRef(({ state = "idle", className = "", decorative = false }, ref) => {
  const activeState = STATE_ASSETS[state] ? state : "idle";

  return (
    <div ref={ref} className={`${styles.bitWrapper} ${className}`}>
      <img
        src={STATE_ASSETS[activeState]}
        alt={decorative ? "" : `Spotter mascot — ${activeState}`}
        aria-hidden={decorative || undefined}
        className={`${styles.bitState} ${styles.active}`}
        loading="eager"
      />
    </div>
  );
});

BitCharacter.displayName = "BitCharacter";
