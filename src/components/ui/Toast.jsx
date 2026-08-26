import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";

/**
 * SpotterToaster — Configured react-hot-toast container.
 *
 * Positioned at top-center with Spotter-consistent styling.
 * This component renders the <Toaster /> and should be placed
 * once in the app root.
 */
export function SpotterToaster() {
  return (
    <Toaster
      position="top-center"
      gutter={8}
      toastOptions={{
        duration: 4000,
        style: {
          maxWidth: "420px",
          fontFamily: "inherit",
          fontSize: "0.9375rem",
        },
        success: {
          duration: 3000,
        },
        error: {
          duration: 5000,
        },
      }}
    />
  );
}

/**
 * Toast helper functions.
 * Components call these instead of raw react-hot-toast.
 */
export function showSuccess(message) {
  toast.success(message);
}

export function showError(message) {
  toast.error(message);
}

export function dismissAll() {
  toast.dismiss();
}
