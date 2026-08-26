import { RouterProvider } from "react-router-dom";
import { router } from "./routes/index.jsx";
import { useAuthInit } from "./hooks/useAuthInit.js";
import { SpotterToaster } from "./components/ui/Toast.jsx";
import PageError from "./components/ui/PageError.jsx";

export default function App() {
  const { initError, retry } = useAuthInit();
  const isPublicLanding = window.location.pathname === "/";

  if (initError && !isPublicLanding) {
    return (
      <PageError
        title="Connection Error"
        message={initError.message}
        onRetry={retry}
      />
    );
  }

  return (
    <>
      <RouterProvider router={router} />
      <SpotterToaster />
    </>
  );
}
