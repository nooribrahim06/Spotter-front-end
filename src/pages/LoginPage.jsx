import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLogin } from "../features/auth/hooks/useLogin.js";
import { loginSchema } from "../features/auth/schemas/auth.schemas.js";
import AuthScene from "../components/auth/AuthScene.jsx";
import FormField from "../components/ui/FormField.jsx";
import Input from "../components/ui/Input.jsx";
import PasswordInput from "../components/ui/PasswordInput.jsx";
import Button from "../components/ui/Button.jsx";
import InlineError from "../components/ui/InlineError.jsx";
import styles from "./AuthFlow.module.css";

export default function LoginPage() {
  useEffect(() => {
    document.title = "Log In — Spotter";
  }, []);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const loginMutation = useLogin(setError);
  const hasEmailError = Boolean(errors.email);
  const hasAnyError = Boolean(errors.root || errors.email || errors.password || loginMutation.isError);

  return (
    <AuthScene
      mascotState={hasAnyError ? "disappointed" : "idle"}
      tone={hasAnyError ? "error" : "default"}
      visualKicker={hasAnyError ? "Bit couldn’t open that account" : "Welcome back"}
      visualTitle={hasEmailError ? "That email doesn’t look right." : hasAnyError ? "That didn’t work—yet." : "Your journey kept moving."}
      visualText={hasAnyError ? "Review the highlighted details and try once more." : "Your progress, people, and plan are waiting exactly where you left them."}
    >
      <header className={styles.header}>
        <p className={styles.kicker}>Welcome back</p>
        <h1 className={styles.title}>Log in to Spotter.</h1>
        <p className={styles.intro}>Pick up your journey without losing the context behind it.</p>
      </header>

      <form className={styles.form} onSubmit={handleSubmit((data) => loginMutation.mutate(data))} noValidate>
        {errors.root && (
          <InlineError id="login-root-error" message={errors.root.message} className={styles.rootError} />
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

        <FormField label="Password" error={errors.password?.message}>
          <PasswordInput
            className={styles.input}
            autoComplete="current-password"
            placeholder="Your password"
            {...register("password")}
          />
        </FormField>

        <Button
          type="submit"
          fullWidth
          className={styles.submitButton}
          isLoading={loginMutation.isPending}
          disabled={loginMutation.isPending}
        >
          Log In <span aria-hidden="true">↗</span>
        </Button>
      </form>

      <p className={styles.switchCopy}>Don’t have an account? <Link to="/signup">Sign up</Link></p>
    </AuthScene>
  );
}
