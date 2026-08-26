import { createBrowserRouter, Navigate } from "react-router-dom";

// Layouts
import PublicLayout from "../layouts/PublicLayout.jsx";
import AuthLayout from "../layouts/AuthLayout.jsx";
import AppLayout from "../layouts/AppLayout.jsx";

// Guards
import GuestGuard from "../components/guards/GuestGuard.jsx";
import AuthGuard from "../components/guards/AuthGuard.jsx";

// Pages
import LandingPage from "../pages/LandingPage.jsx";
import LoginPage from "../pages/LoginPage.jsx";
import SignupPage from "../pages/SignupPage.jsx";
import VerifyEmailSentPage from "../pages/VerifyEmailSentPage.jsx";
import VerifyEmailPage from "../pages/VerifyEmailPage.jsx";
import NotFoundPage from "../pages/NotFoundPage.jsx";
import HomePage from "../pages/app/HomePage.jsx";

/**
 * Global Route Configuration
 *
 * Uses data router (createBrowserRouter). Loaders/actions are deferred.
 */
export const router = createBrowserRouter([
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
    path: "/app",
    element: <AppLayout />,
    children: [
      {
        element: <AuthGuard />,
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
]);
