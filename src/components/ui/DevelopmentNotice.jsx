import styles from "./DevelopmentNotice.module.css";

export default function DevelopmentNotice() {
  return (
    <aside className={styles.notice} aria-label="Project status">
      <strong className={styles.label}>Development &amp; testing</strong>
      <p>Spotter is still under development and testing. Features may change, and you may encounter bugs.</p>
    </aside>
  );
}
