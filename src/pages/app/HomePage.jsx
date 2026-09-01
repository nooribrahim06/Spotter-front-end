import { useEffect } from "react";
import LandingPage from "../LandingPage.jsx";

export default function HomePage() {
  useEffect(() => {
    document.title = "Home — Spotter";
  }, []);

  return <LandingPage authenticated />;
}
