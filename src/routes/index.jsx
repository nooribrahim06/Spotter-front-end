import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

// Layouts
import PublicLayout from "../layouts/PublicLayout.jsx";
import AuthLayout from "../layouts/AuthLayout.jsx";
import AppLayout from "../layouts/AppLayout.jsx";

// Guards
import GuestGuard from "../components/guards/GuestGuard.jsx";
import AuthGuard from "../components/guards/AuthGuard.jsx";
import OnboardingGate from "../components/guards/OnboardingGate.jsx";
import OnboardingRouteGuard from "../components/guards/OnboardingRouteGuard.jsx";

// Pages
import LandingPage from "../pages/LandingPage.jsx";
import LoginPage from "../pages/LoginPage.jsx";
import SignupPage from "../pages/SignupPage.jsx";
import VerifyEmailSentPage from "../pages/VerifyEmailSentPage.jsx";
import VerifyEmailPage from "../pages/VerifyEmailPage.jsx";
import NotFoundPage from "../pages/NotFoundPage.jsx";
import HomePage from "../pages/app/HomePage.jsx";
import OnboardingWelcomePage from "../pages/onboarding/OnboardingWelcomePage.jsx";
import OnboardingPage from "../pages/onboarding/OnboardingPage.jsx";
import OnboardingSuccessPage from "../pages/onboarding/OnboardingSuccessPage.jsx";

const ProfilePage = lazy(() => import("../pages/app/ProfilePage.jsx"));

/**
 * Global Route Configuration
 *
 * Uses data router (createBrowserRouter). Loaders/actions are deferred.
 */
export const routes = [
  {
    element: <PublicLayout />,
    children: [
      {
        path: "/",
        element: <LandingPage />,
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: "/verify-email",
        element: <VerifyEmailPage />,
      },
      {
        element: <GuestGuard />,
        children: [
          {
            path: "/login",
            element: <LoginPage />,
          },
          {
            path: "/signup",
            element: <SignupPage />,
          },
          {
            path: "/verify-email-sent",
            element: <VerifyEmailSentPage />,
          },
        ],
      },
    ],
  },
  {
    element: <AuthGuard />,
    children: [
      {
        path: "/onboarding/success",
        element: <OnboardingSuccessPage />,
      },
      {
        element: <OnboardingRouteGuard />,
        children: [
          {
            path: "/onboarding",
            element: <OnboardingWelcomePage />,
          },
          {
            path: "/onboarding/:step",
            element: <OnboardingPage />,
          },
        ],
      },
    ],
  },
  {
    path: "/app",
    element: <AppLayout />,
    children: [
      {
        element: <AuthGuard />,
        children: [
          {
            path: "profile",
            element: (
              <Suspense fallback={<p role="status">Loading profile…</p>}>
                <ProfilePage />
              </Suspense>
            ),
          },
          {
            element: <OnboardingGate />,
            children: [
              {
                index: true,
                element: <Navigate to="/app/home" replace />,
              },
              {
                path: "home",
                element: <HomePage />,
                handle: { immersive: true },
              },
              {
                path: "*",
                element: <NotFoundPage />,
                handle: { immersive: true },
              },
            ],
          },
        ],
      },
    ],
  },
];

export const router = createBrowserRouter(routes);
