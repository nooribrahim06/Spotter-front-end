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
  const triggerRef = useRef(null);
  const displayName = user?.displayName || user?.firstName || user?.username || "Spotter member";
  const initial = displayName.trim().charAt(0).toUpperCase() || "S";

  useEffect(() => {
    if (!isOpen) return undefined;
    const closeOutside = (event) => {
      if (!menuRef.current?.contains(event.target)) setIsOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) menuRef.current?.querySelector('[role="menuitem"]')?.focus();
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

  const handleMenuKeys = (event) => {
    const items = Array.from(event.currentTarget.querySelectorAll('[role="menuitem"]'));
    const current = items.indexOf(document.activeElement);
    if (event.key === "ArrowDown") {
      event.preventDefault();
      items[(current + 1) % items.length]?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      items[(current - 1 + items.length) % items.length]?.focus();
    } else if (event.key === "Home") {
      event.preventDefault();
      items[0]?.focus();
    } else if (event.key === "End") {
      event.preventDefault();
      items.at(-1)?.focus();
    }
  };

  return (
    <div className={styles.account} ref={menuRef} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setIsOpen(false);
    }}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.accountTrigger}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls="spotter-account-menu"
        aria-label={`Your profile, ${displayName}`}
        onClick={() => setIsOpen((open) => !open)}
        onKeyDown={(event) => {
          if (["ArrowDown", "ArrowUp"].includes(event.key)) {
            event.preventDefault();
            setIsOpen(true);
          }
        }}
      >
        <span className={styles.accountAvatar} aria-hidden="true">
          {user?.profilePhotoUrl ? <img src={user.profilePhotoUrl} alt="" /> : initial}
        </span>
        <strong className={styles.accountName}>{displayName}</strong>
        <span className={styles.accountChevron}><ChevronIcon /></span>
      </button>

      {isOpen && (
        <div id="spotter-account-menu" className={styles.accountPopover} role="menu" onKeyDown={handleMenuKeys}>
          <div className={styles.accountPopoverHead}>
            <span className={styles.accountAvatar} aria-hidden="true">
              {user?.profilePhotoUrl ? <img src={user.profilePhotoUrl} alt="" /> : initial}
            </span>
            <span><strong>{displayName}</strong>{user?.username && <small>@{user.username}</small>}</span>
          </div>
          <Link to="/app/profile" role="menuitem" onClick={() => setIsOpen(false)}>
            <span><ProfileIcon /></span>
            <span><strong>Profile</strong></span>
          </Link>
          <button type="button" role="menuitem" className={styles.logoutItem} onClick={requestLogout}>
            <span><ExitIcon /></span>
            <span><strong>Log out</strong></span>
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
