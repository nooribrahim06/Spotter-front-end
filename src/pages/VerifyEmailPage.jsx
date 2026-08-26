import { useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useVerifyEmail } from "../features/auth/hooks/useVerifyEmail.js";
import AuthScene from "../components/auth/AuthScene.jsx";
import Button from "../components/ui/Button.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import styles from "./AuthFlow.module.css";
import sittingSad from "../assets/identity/08_disappointed/variants/01_sitting_sad.png";
import notMyDay from "../assets/identity/08_disappointed/variants/06_not_my_day.png";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { verify, verificationState, errorInfo, reset } = useVerifyEmail();
  const attemptedRef = useRef(false);

  useEffect(() => {
    document.title = "Verify Your Email — Spotter";
    if (!token || attemptedRef.current) return;
    attemptedRef.current = true;
    verify({ token });
  }, [token, verify]);

  if (!token) {
    return (
      <AuthScene
        artworkSrc={notMyDay}
        artworkAlt="Bit holding a not my day sign"
        tone="error"
        visualKicker="This link is incomplete"
        visualTitle="Bit can’t find the token."
        visualText="A fresh verification email will get you back on the right path."
      >
        <header className={styles.header}>
          <p className={styles.kicker}>Verification paused</p>
          <h1 className={styles.title}>Missing verification token.</h1>
          <p className={styles.intro}>The link is missing the information Spotter needs. Return to the email or request a new link.</p>
        </header>
        <div className={styles.actionRow}>
          <Link className={styles.primaryLink} to="/verify-email-sent">Resend Email <span aria-hidden="true">↗</span></Link>
          <Link className={styles.secondaryLink} to="/login">Go to login</Link>
        </div>
      </AuthScene>
    );
  }

  if (verificationState === "loading" || verificationState === "idle") {
    return (
      <AuthScene
        mascotState="thinking"
        visualKicker="One quick check"
        visualTitle="Bit is verifying your email."
        visualText="Keep this page open. This usually takes only a moment."
      >
        <header className={styles.header}>
          <p className={styles.kicker}>Verifying email</p>
          <h1 className={styles.title}>Connecting your account.</h1>
        </header>
        <div className={styles.loadingState}>
          <Spinner size="lg" label="Verifying email..." />
          <p>Verifying your email address...</p>
        </div>
      </AuthScene>
    );
  }

  if (verificationState === "success") {
    return (
      <AuthScene
        mascotState="victory"
        tone="success"
        visualKicker="You’re officially verified"
        visualTitle="Bit says you’re ready."
        visualText="Your Spotter account is active. Log in and begin your journey."
      >
        <header className={styles.header}>
          <p className={styles.kicker}>Verification complete</p>
          <h1 className={styles.title}>Email verified successfully!</h1>
          <p className={styles.intro}>Your email address is verified and your account is ready. Continue to login to get started.</p>
        </header>
        <div className={styles.actionRow}>
          <Link className={styles.primaryLink} to="/login">Log In <span aria-hidden="true">↗</span></Link>
        </div>
      </AuthScene>
    );
  }

  if (verificationState === "invalid") {
    return (
      <AuthScene
        artworkSrc={sittingSad}
        artworkAlt="Bit sitting sadly after an expired link"
        tone="error"
        visualKicker="That link has run out"
        visualTitle="It’s okay—we’ll send another."
        visualText="Verification links can expire. Request a fresh one and try again."
      >
        <header className={styles.header}>
          <p className={styles.kicker}>Verification unsuccessful</p>
          <h1 className={styles.title}>Link expired or invalid.</h1>
          <p className={styles.intro}>{errorInfo.message}</p>
        </header>
        <div className={styles.actionRow}>
          <Link className={styles.primaryLink} to="/verify-email-sent">Request New Link <span aria-hidden="true">↗</span></Link>
          <Link className={styles.secondaryLink} to="/login">Back to login</Link>
        </div>
      </AuthScene>
    );
  }

  return (
    <AuthScene
      mascotState="disappointed"
      tone="error"
      visualKicker="A temporary setback"
      visualTitle="Bit needs one more try."
      visualText="Your account is safe. Retry the verification when you’re ready."
    >
      <header className={styles.header}>
        <p className={styles.kicker}>Verification interrupted</p>
        <h1 className={styles.title}>Verification failed.</h1>
        <p className={styles.intro}>{errorInfo.message}</p>
      </header>
      <div className={styles.actionRow}>
        <Button
          className={styles.submitButton}
          onClick={() => {
            reset();
            verify({ token });
          }}
        >
          Try Again
        </Button>
        <Link className={styles.secondaryLink} to="/verify-email-sent">Request a new link</Link>
      </div>
    </AuthScene>
  );
}
