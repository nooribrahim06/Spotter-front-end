import { beforeEach, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import userEvent from "@testing-library/user-event";
import { screen, waitFor } from "@testing-library/react";
import { server } from "../../../test/mocks/server.js";
import { renderWithProviders } from "../../../test/test-utils.jsx";
import GoalsPage from "../GoalsPage.jsx";

const draft = {
  id: "22222222-2222-4222-8222-222222222222",
  goalType: "BUILD_MUSCLE",
  targetWeightKg: null,
  targetDate: null,
  status: "DRAFT",
  startedAt: null,
  completedAt: null,
  cancelledAt: null,
  createdAt: "2026-09-01T08:00:00.000Z",
  updatedAt: "2026-09-01T08:00:00.000Z",
};

const active = {
  ...draft,
  id: "11111111-1111-4111-8111-111111111111",
  goalType: "IMPROVE_FITNESS",
  status: "ACTIVE",
  startedAt: "2026-08-30T08:00:00.000Z",
  currentProgress: null,
};

describe("GoalsPage", () => {
  beforeEach(() => {
    server.use(
      http.get("*/api/goals/active", () => HttpResponse.json({ data: null })),
      http.get("*/api/goals", () => HttpResponse.json({ data: [] }))
    );
  });

  it("treats an empty journey as an onboarding moment", async () => {
    renderWithProviders(<GoalsPage />, { initialEntries: ["/app/goals"] });

    expect(await screen.findByRole("heading", { name: /what’s your next move/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create a goal/i })).toBeInTheDocument();
    expect(screen.queryByText(/^No active goal\.?$/i)).not.toBeInTheDocument();
  });

  it("clears a hidden weight and saves a maintenance goal as a draft", async () => {
    let createdPayload;
    server.use(
      http.post("*/api/goals", async ({ request }) => {
        createdPayload = await request.json();
        return HttpResponse.json({ data: { ...draft, ...createdPayload, id: "new-goal" } }, { status: 201 });
      })
    );
    const user = userEvent.setup();
    renderWithProviders(<GoalsPage />, { initialEntries: ["/app/goals"] });

    await user.click(await screen.findByRole("button", { name: /new goal/i }));
    await user.click(screen.getByRole("radio", { name: /gain weight/i }));
    await user.type(screen.getByLabelText(/target weight/i), "90");
    await user.click(screen.getByRole("radio", { name: /maintain weight/i }));

    expect(screen.queryByLabelText(/target weight/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /save as draft/i }));

    await waitFor(() => expect(createdPayload).toEqual({
      goalType: "MAINTAIN_WEIGHT",
      targetWeightKg: null,
      targetDate: null,
    }));
  });

  it("turns an activation conflict into context and keeps the draft", async () => {
    server.use(
      http.get("*/api/goals/active", () => HttpResponse.json({ data: active })),
      http.get("*/api/goals", () => HttpResponse.json({ data: [draft, active] })),
      http.post("*/api/goals/:goalId/activate", () => HttpResponse.json({ code: "ACTIVE_GOAL_EXISTS", error: "An active goal already exists." }, { status: 409 }))
    );
    const user = userEvent.setup();
    renderWithProviders(<GoalsPage />, { initialEntries: ["/app/goals"] });

    await user.click(await screen.findByRole("button", { name: /make active/i }));

    expect(await screen.findByRole("heading", { name: /one focus at a time/i })).toBeInTheDocument();
    expect(screen.getByText(/nothing was lost/i)).toBeInTheDocument();
    expect(screen.getAllByText("Build muscle").length).toBeGreaterThan(1);
  });

  it("shows a useful no-check-in state without exposing edit controls on the active goal", async () => {
    server.use(
      http.get("*/api/goals/active", () => HttpResponse.json({ data: active })),
      http.get("*/api/goals", () => HttpResponse.json({ data: [active] }))
    );
    renderWithProviders(<GoalsPage />, { initialEntries: ["/app/goals"] });

    expect(await screen.findByRole("heading", { name: /no check-in yet/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /record progress/i })).toHaveAttribute("href", "/app/progress?checkIn=1");
    expect(screen.queryByRole("button", { name: /edit improve fitness/i })).not.toBeInTheDocument();
  });
});
