import { useRouteError } from "react-router-dom";
import PageError from "../components/ui/PageError.jsx";

export default function RouteError() {
  const error = useRouteError();
  const loadingFailed = /dynamically imported module|module script|Loading (?:CSS )?chunk|preload CSS/i.test(error?.message || "");
  return <PageError
    title={loadingFailed ? "This page couldn’t load" : "Something went wrong"}
    message={loadingFailed
      ? "Spotter may have been updated, or your connection was interrupted. Reload the page to try again."
      : "Please reload the page to try again."}
    retryLabel="Reload page"
    onRetry={() => window.location.reload()}
  />;
}
