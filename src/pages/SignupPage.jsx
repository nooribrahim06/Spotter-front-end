import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSignup } from "../features/auth/hooks/useSignup.js";
import { signupSchema } from "../features/auth/schemas/auth.schemas.js";
import AuthScene from "../components/auth/AuthScene.jsx";
import FormField from "../components/ui/FormField.jsx";
import Input from "../components/ui/Input.jsx";
import PasswordInput from "../components/ui/PasswordInput.jsx";
import Button from "../components/ui/Button.jsx";
import InlineError from "../components/ui/InlineError.jsx";
import styles from "./AuthFlow.module.css";

export default function SignupPage() {
  useEffect(() => {
    document.title = "Sign Up — Spotter";
  }, []);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signupSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const signupMutation = useSignup(setError);
  const hasEmailError = Boolean(errors.email);
  const hasAnyError = Boolean(
    errors.root || errors.email || errors.username || errors.password || signupMutation.isError,
  );

  const visualTitle = hasEmailError
    ? "That email needs another look."
    : hasAnyError
      ? "Almost there. Let’s fix that."
      : "A stronger story starts here.";

  const visualText = hasAnyError
    ? "Check the highlighted details and Bit will be ready to move again."
    : "Create one account for your journey, your coaching, and the people moving with you.";

  return (
    <AuthScene
      mascotState={hasAnyError ? "disappointed" : "idle"}
      tone={hasAnyError ? "error" : "default"}
      visualKicker={hasAnyError ? "Something needs attention" : "Meet your new training partner"}
      visualTitle={visualTitle}
      visualText={visualText}
    >
      <header className={styles.header}>
        <p className={styles.kicker}>Start your journey</p>
        <h1 className={styles.title}>Sign up for Spotter.</h1>
        <p className={styles.intro}>One account connects your progress, coaching, and community.</p>
      </header>

      <form className={styles.form} onSubmit={handleSubmit((data) => signupMutation.mutate(data))} noValidate>
        {errors.root && (
          <InlineError id="signup-root-error" message={errors.root.message} className={styles.rootError} />
        )}

        <FormField label="Email" error={errors.email?.message}>
          <Input
            className={styles.input}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...register("email")}
          />
        </FormField>

        <FormField label="Username" error={errors.username?.message}>
          <Input
            className={styles.input}
            type="text"
            autoComplete="username"
            placeholder="How the community will know you"
            {...register("username")}
          />
        </FormField>

        <FormField label="Password" error={errors.password?.message}>
          <PasswordInput
            className={styles.input}
            autoComplete="new-password"
            placeholder="8 characters minimum"
            {...register("password")}
          />
        </FormField>

        <Button
          type="submit"
          fullWidth
          className={styles.submitButton}
          isLoading={signupMutation.isPending}
          disabled={signupMutation.isPending}
        >
          Sign Up <span aria-hidden="true">↗</span>
        </Button>
      </form>

      <p className={styles.switchCopy}>Already have an account? <Link to="/login">Log in</Link></p>
    </AuthScene>
  );
}
