import { describe, expect, it, vi } from "vitest";

vi.mock("gsap", () => {
  const gsap = { registerPlugin: vi.fn() };
  return { default: gsap, gsap };
});
vi.mock("gsap/ScrollTrigger", () => ({ ScrollTrigger: {} }));
vi.mock("@gsap/react", () => ({ useGSAP: vi.fn() }));

import { routes } from "../index.jsx";

describe("authenticated profile route", () => {
  it("keeps Profile outside the onboarding gate", () => {
    const appRoute = routes.find((route) => route.path === "/app");
    const authenticatedBranch = appRoute.children.find(
      (route) => Array.isArray(route.children)
    );
    const profileRoute = authenticatedBranch.children.find(
      (route) => route.path === "profile"
    );
    const onboardingGateBranch = authenticatedBranch.children.find(
      (route) => route.children?.some((child) => child.path === "home")
    );

    expect(profileRoute).toBeDefined();
    expect(onboardingGateBranch).toBeDefined();
    expect(
      onboardingGateBranch.children.some((route) => route.path === "profile")
    ).toBe(false);
  });
});
