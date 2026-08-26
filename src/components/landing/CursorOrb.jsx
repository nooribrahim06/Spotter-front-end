import { useEffect, useRef } from "react";
import styles from "./CursorOrb.module.css";

export default function CursorOrb() {
  const orbRef = useRef(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarsePointer = window.matchMedia("(pointer: coarse)");
    if (reducedMotion.matches || coarsePointer.matches) return undefined;

    const orb = orbRef.current;
    if (!orb) return undefined;

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const current = { ...target };
    let frame;

    const move = (event) => {
      target.x = event.clientX;
      target.y = event.clientY;
      orb.dataset.visible = "true";
    };

    const hide = () => {
      orb.dataset.visible = "false";
    };

    const animate = () => {
      current.x += (target.x - current.x) * 0.085;
      current.y += (target.y - current.y) * 0.085;
      orb.style.transform = `translate3d(${current.x - 230}px, ${current.y - 230}px, 0)`;
      frame = window.requestAnimationFrame(animate);
    };

    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("mouseleave", hide);
    frame = window.requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("mouseleave", hide);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return <div ref={orbRef} className={styles.orb} data-visible="false" aria-hidden="true" />;
}
