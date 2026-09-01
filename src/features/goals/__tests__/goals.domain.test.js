import { describe, expect, it } from "vitest";
import {
  normalizeGoalPayload,
  partitionGoals,
  validateGoalPayload,
} from "../goals.domain.js";

describe("goals domain", () => {
  it("clears an incompatible target when switching to maintenance", () => {
    expect(normalizeGoalPayload({
      goalType: "MAINTAIN_WEIGHT",
      targetWeightKg: "82",
      targetDate: "",
    })).toEqual({
      goalType: "MAINTAIN_WEIGHT",
      targetWeightKg: null,
      targetDate: null,
    });
  });

  it("requires a target only for weight-changing goals", () => {
    expect(validateGoalPayload({
      goalType: "LOSE_WEIGHT",
      targetWeightKg: null,
      targetDate: null,
    })).toHaveProperty("targetWeightKg");

    expect(validateGoalPayload({
      goalType: "IMPROVE_FITNESS",
      targetWeightKg: null,
      targetDate: null,
    })).toEqual({});
  });

  it("separates saved ideas from read-only journey history", () => {
    const groups = partitionGoals([
      { id: "1", status: "ACTIVE" },
      { id: "2", status: "DRAFT" },
      { id: "3", status: "COMPLETED" },
      { id: "4", status: "CANCELLED" },
    ]);

    expect(groups.drafts.map((goal) => goal.id)).toEqual(["2"]);
    expect(groups.history.map((goal) => goal.id)).toEqual(["3", "4"]);
  });
});
