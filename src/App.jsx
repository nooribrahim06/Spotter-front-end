import { RouterProvider } from "react-router-dom";
import { router } from "./routes/index.jsx";
import { useAuthInit } from "./hooks/useAuthInit.js";
import { SpotterToaster } from "./components/ui/Toast.jsx";
import PageError from "./components/ui/PageError.jsx";
import DevelopmentNotice from "./components/ui/DevelopmentNotice.jsx";

export default function App() {
  const { initError, retry } = useAuthInit();
  const isPublicLanding = window.location.pathname === "/";

  return (
    <>
      <DevelopmentNotice />
      {initError && !isPublicLanding ? (
        <PageError
          title="Connection Error"
          message={initError.message}
          onRetry={retry}
        />
      ) : (
        <RouterProvider router={router} />
      )}
      <SpotterToaster />
    </>
  );
}
