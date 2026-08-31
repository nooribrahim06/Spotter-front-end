import { useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import styles from "./Landing.module.css";
import CursorOrb from "../components/landing/CursorOrb.jsx";
import { ChapterIdentity } from "../components/landing/ChapterIdentity.jsx";
import ChapterJourney from "../components/landing/ChapterJourney.jsx";
import { ChapterCoaching } from "../components/landing/ChapterCoaching.jsx";
import { ChapterCommunity } from "../components/landing/ChapterCommunity.jsx";
import { ChapterFinal } from "../components/landing/ChapterFinal.jsx";

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage({ authenticated = false, user, onLogout, isLoggingOut = false }) {
  const storyRef = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const select = gsap.utils.selector(storyRef);
        const scenes = select("[data-scene]");
        const nav = select("[data-nav]")[0];
        gsap.set(scenes.slice(1), { autoAlpha: 0 });

        const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
        intro
          .from(select('[data-scene="identity"] [data-word]'), {
            yPercent: 115,
            opacity: 0,
            filter: "blur(10px)",
            duration: 0.85,
            stagger: 0.075,
          })
          .from(
            select('[data-scene="identity"] [data-intro-copy]'),
            { y: 24, opacity: 0, duration: 0.7, stagger: 0.1 },
            "-=0.48",
          )
          .from(
            select('[data-scene="identity"] [data-motion="visual"]'),
            { xPercent: 22, scale: 0.9, opacity: 0, duration: 1 },
            "-=0.72",
          )
          .from(
            select('[data-scene="identity"] [data-motion="bit"]'),
            { xPercent: 35, scale: 0.92, opacity: 0, duration: 0.9 },
            "-=0.82",
          );

        const master = gsap.timeline({
          defaults: { ease: "power3.inOut" },
          scrollTrigger: {
            trigger: storyRef.current,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.9,
            invalidateOnRefresh: true,
          },
        });

        const transition = (from, to, at) => {
          const outgoing = select(`[data-scene="${from}"]`)[0];
          const incoming = select(`[data-scene="${to}"]`)[0];
          const outCopy = select(`[data-scene="${from}"] [data-motion="copy"]`);
          const outVisual = select(`[data-scene="${from}"] [data-motion="visual"]`);
          const outBit = select(`[data-scene="${from}"] [data-motion="bit"]`);
          const inCopy = select(`[data-scene="${to}"] [data-motion="copy"]`);
          const inVisual = select(`[data-scene="${to}"] [data-motion="visual"]`);
          const inBit = select(`[data-scene="${to}"] [data-motion="bit"]`);
          const inWords = select(`[data-scene="${to}"] [data-word]`);
          const inCards = select(`[data-scene="${to}"] [data-card]`);

          master
            .to(outCopy, { xPercent: -115, autoAlpha: 0, duration: 0.68 }, at)
            .to(outVisual, { xPercent: -72, scale: 0.88, autoAlpha: 0, duration: 0.78 }, at + 0.06)
            .to(outBit, { xPercent: -135, rotate: -4, autoAlpha: 0, duration: 0.76 }, at + 0.12)
            .set(incoming, { autoAlpha: 1 }, at + 0.3)
            .fromTo(inVisual, { xPercent: 42, scale: 0.9, autoAlpha: 0 }, { xPercent: 0, scale: 1, autoAlpha: 1, duration: 0.76 }, at + 0.34)
            .fromTo(inBit, { xPercent: 105, rotate: 3, autoAlpha: 0 }, { xPercent: 0, rotate: 0, autoAlpha: 1, duration: 0.74 }, at + 0.41)
            .fromTo(inCopy, { xPercent: 54, autoAlpha: 0 }, { xPercent: 0, autoAlpha: 1, duration: 0.66 }, at + 0.42)
            .fromTo(
              inWords,
              { yPercent: 105, opacity: 0, filter: "blur(8px)" },
              { yPercent: 0, opacity: 1, filter: "blur(0px)", duration: 0.55, stagger: 0.045, ease: "power3.out" },
              at + 0.46,
            )
            .fromTo(
              inCards,
              { x: 70, y: 30, scale: 0.88, opacity: 0 },
              { x: 0, y: 0, scale: 1, opacity: 1, duration: 0.62, stagger: 0.055, ease: "power3.out" },
              at + 0.48,
            )
            .set(outgoing, { autoAlpha: 0 }, at + 0.98);

          if (to === "coaching") {
            master.set(nav, { attr: { "data-tone": "dark" } }, at + 0.5);
          } else if (from === "coaching") {
            master.set(nav, { attr: { "data-tone": "light" } }, at + 0.5);
          }
        };

        master.to({}, { duration: 0.58 });
        transition("identity", "journey", master.duration());
        master.to({}, { duration: 0.7 });
        transition("journey", "coaching", master.duration());
        master.to({}, { duration: 0.7 });
        transition("coaching", "community", master.duration());
        master.to({}, { duration: 0.7 });
        transition("community", "final", master.duration());
        master.to({}, { duration: 0.85 });

        const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
        const cardCleanups = canHover ? select("[data-card]").map((card) => {
          const rotateX = gsap.quickTo(card, "rotationX", { duration: 0.28, ease: "power3.out" });
          const rotateY = gsap.quickTo(card, "rotationY", { duration: 0.28, ease: "power3.out" });

          const enter = () => {
            gsap.to(card, {
              y: -9,
              scale: 1.025,
              duration: 0.28,
              ease: "power3.out",
              overwrite: "auto",
            });
          };

          const move = (event) => {
            const bounds = card.getBoundingClientRect();
            const x = (event.clientX - bounds.left) / bounds.width - 0.5;
            const y = (event.clientY - bounds.top) / bounds.height - 0.5;
            rotateX(y * -5);
            rotateY(x * 6);
          };

          const leave = () => {
            gsap.to(card, {
              y: 0,
              scale: 1,
              rotationX: 0,
              rotationY: 0,
              duration: 0.5,
              ease: "power3.out",
              overwrite: "auto",
            });
          };

          card.addEventListener("pointerenter", enter);
          card.addEventListener("pointermove", move);
          card.addEventListener("pointerleave", leave);

          return () => {
            card.removeEventListener("pointerenter", enter);
            card.removeEventListener("pointermove", move);
            card.removeEventListener("pointerleave", leave);
          };
        }) : [];

        return () => {
          cardCleanups.forEach((cleanup) => cleanup());
          intro.kill();
          master.kill();
        };
      });

      return () => mm.revert();
    },
    { scope: storyRef },
  );

  return (
    <div ref={storyRef} className={styles.story}>
      <CursorOrb />
      <span id="journey" className={styles.journeyAnchor} aria-hidden="true" />
      <div className={styles.stage}>
        <header className={styles.topbar} data-nav data-tone="light" aria-label="Primary navigation">
          <a className={styles.brand} href="#top" aria-label="Spotter home">
            SPOTTER<span>.</span>
          </a>

          <p className={styles.navTagline}><i /> Move. Learn. Connect.</p>

          <nav className={styles.topActions} aria-label="Account">
            {authenticated ? (
              <>
                <span className={styles.navUser}>Hi, {user?.username || "Spotter"}</span>
                <Link className={styles.signInLink} to="/app/profile">Profile</Link>
                <button className={styles.navCta} type="button" onClick={onLogout} disabled={isLoggingOut}>
                  {isLoggingOut ? "Signing out…" : "Log out"} <span aria-hidden="true">↗</span>
                </button>
              </>
            ) : (
              <>
                <a className={styles.signInLink} href="/login">Sign in</a>
                <a className={styles.navCta} href="/signup">Start free <span aria-hidden="true">↗</span></a>
              </>
            )}
          </nav>
        </header>

        <div id="top" className={styles.sceneStack}>
          <ChapterIdentity authenticated={authenticated} />
          <ChapterJourney />
          <ChapterCoaching />
          <ChapterCommunity />
          <ChapterFinal authenticated={authenticated} />
        </div>

        <div className={styles.edgeGrain} aria-hidden="true" />
      </div>
    </div>
  );
}
