import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useLogout } from "../features/auth/hooks/useLogout.js";
import { useAuthStore } from "../stores/authStore.js";
import styles from "./AppLayout.module.css";

function ChevronIcon() {
  return <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m6 8 4 4 4-4" /></svg>;
}

function ProfileIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5" /><path d="M5.5 20c.5-4 2.8-6 6.5-6s6 2 6.5 6" /></svg>;
}

function ExitIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 5H5v14h5M14 8l4 4-4 4M9 12h9" /></svg>;
}

export default function AccountMenu() {
  const { handleLogout, isLoggingOut } = useLogout();
  const user = useAuthStore((state) => state.user);
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const menuRef = useRef(null);
  const displayName = user?.firstName || user?.displayName || user?.username || "Spotter member";
  const initial = displayName.trim().charAt(0).toUpperCase() || "S";

  useEffect(() => {
    if (!isOpen) return undefined;
    const closeOutside = (event) => {
      if (!menuRef.current?.contains(event.target)) setIsOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isConfirming) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape" && !isLoggingOut) setIsConfirming(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isConfirming, isLoggingOut]);

  const requestLogout = () => {
    setIsOpen(false);
    setIsConfirming(true);
  };

  return (
    <div className={styles.account} ref={menuRef}>
      <button
        type="button"
        className={styles.accountTrigger}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className={styles.accountAvatar} aria-hidden="true">{initial}</span>
        <span className={styles.accountCopy}>
          <small>Your profile</small>
          <strong>{displayName}</strong>
        </span>
        <span className={styles.accountChevron}><ChevronIcon /></span>
      </button>

      {isOpen && (
        <div className={styles.accountPopover} role="menu">
          <div className={styles.accountPopoverHead}>
            <span className={styles.accountAvatar} aria-hidden="true">{initial}</span>
            <span><strong>{displayName}</strong><small>@{user?.username || "spotter"}</small></span>
          </div>
          <Link to="/app/profile" role="menuitem" onClick={() => setIsOpen(false)}>
            <span><ProfileIcon /></span>
            <span><strong>View profile</strong><small>Your details and preferences</small></span>
          </Link>
          <button type="button" role="menuitem" className={styles.logoutItem} onClick={requestLogout}>
            <span><ExitIcon /></span>
            <span><strong>Log out</strong><small>End this Spotter session</small></span>
          </button>
        </div>
      )}

      {isConfirming && (
        <div className={styles.dialogBackdrop} role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !isLoggingOut) setIsConfirming(false);
        }}>
          <section className={styles.confirmDialog} role="dialog" aria-modal="true" aria-labelledby="logout-title" aria-describedby="logout-description">
            <div className={styles.confirmMark} aria-hidden="true"><ExitIcon /></div>
            <p>Before you go</p>
            <h2 id="logout-title">Log out of Spotter?</h2>
            <span id="logout-description">Your saved profile stays right where it is. You’ll need to sign in again to continue.</span>
            <div className={styles.confirmActions}>
              <button type="button" autoFocus onClick={() => setIsConfirming(false)} disabled={isLoggingOut}>Stay signed in</button>
              <button type="button" className={styles.confirmLogout} onClick={handleLogout} disabled={isLoggingOut}>
                {isLoggingOut ? "Logging out…" : "Yes, log me out"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
