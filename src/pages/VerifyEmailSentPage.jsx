import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useResendVerification } from "../features/auth/hooks/useResendVerification.js";
import { resendVerificationSchema } from "../features/auth/schemas/auth.schemas.js";
import AuthScene from "../components/auth/AuthScene.jsx";
import FormField from "../components/ui/FormField.jsx";
import Input from "../components/ui/Input.jsx";
import Button from "../components/ui/Button.jsx";
import styles from "./AuthFlow.module.css";

export default function VerifyEmailSentPage() {
  const location = useLocation();
  const initialEmail = location.state?.email || "";
  const emailFailed = location.state?.emailFailed || false;
  const [showResendForm, setShowResendForm] = useState(!initialEmail || emailFailed);

  useEffect(() => {
    document.title = "Check Your Email — Spotter";
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resendVerificationSchema),
    defaultValues: { email: initialEmail },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const resendMutation = useResendVerification();
  const hasError = emailFailed || Boolean(errors.email) || resendMutation.isError;

  return (
    <AuthScene
      mascotState={hasError ? "disappointed" : "pointing"}
      tone={hasError ? "error" : "success"}
      visualKicker={hasError ? "Let’s get the link moving" : "Account created successfully"}
      visualTitle={hasError ? "The email needs another try." : "Your inbox is the next step."}
      visualText={hasError ? "Confirm the address below and Bit will send a fresh verification link." : "Open the message from Spotter, verify your email, then come back to log in."}
    >
      <header className={styles.header}>
        <p className={styles.kicker}>Account created</p>
        <h1 className={styles.title}>Check your inbox.</h1>
        <p className={styles.intro}>We sent a verification link{initialEmail ? " to:" : ". Enter your email below to request one."}</p>
      </header>

      {initialEmail && <p className={styles.emailChip}>{initialEmail}</p>}

      {emailFailed ? (
        <div className={styles.errorNotice} role="alert">
          <span className={styles.noticeIcon} aria-hidden="true">!</span>
          <span>We created the account, but the verification email did not send. Request a new link below.</span>
        </div>
      ) : (
        <div className={styles.notice}>
          <span className={styles.noticeIcon} aria-hidden="true">i</span>
          <span>Check your inbox and your spam or junk folder—the email can occasionally land there.</span>
        </div>
      )}

      {resendMutation.isSuccess && (
        <div className={styles.successNotice} role="status">A fresh verification email has been requested. Please check your inbox and spam folder.</div>
      )}

      {showResendForm ? (
        <form className={styles.form} onSubmit={handleSubmit((data) => resendMutation.mutate(data))} noValidate>
          <FormField label="Email address to resend to" error={errors.email?.message}>
            <Input className={styles.input} type="email" autoComplete="email" {...register("email")} />
          </FormField>
          <Button
            type="submit"
            fullWidth
            className={styles.submitButton}
            isLoading={resendMutation.isPending}
            disabled={resendMutation.isPending}
          >
            Resend Verification Email <span aria-hidden="true">↗</span>
          </Button>
        </form>
      ) : (
        <div className={styles.actionRow}>
          <span className={styles.intro}>Didn’t receive it?</span>
          <button type="button" className={styles.textButton} onClick={() => setShowResendForm(true)}>Resend the email</button>
        </div>
      )}
    </AuthScene>
  );
}
