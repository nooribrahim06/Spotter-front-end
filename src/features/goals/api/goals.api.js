import { apiClient } from "../../../api/apiClient.js";

const unwrapData = (response) => response.data.data;

export async function getGoals() {
  return unwrapData(await apiClient.get("/api/goals"));
}

export async function getActiveGoal() {
  return unwrapData(await apiClient.get("/api/goals/active"));
}

export async function createGoal(payload) {
  return unwrapData(await apiClient.post("/api/goals", payload));
}

export async function updateGoal(goalId, payload) {
  return unwrapData(await apiClient.patch(`/api/goals/${goalId}`, payload));
}

export async function activateGoal(goalId) {
  return unwrapData(await apiClient.post(`/api/goals/${goalId}/activate`));
}

export async function completeGoal(goalId) {
  return unwrapData(await apiClient.post(`/api/goals/${goalId}/complete`));
}

export async function cancelGoal(goalId) {
  return unwrapData(await apiClient.post(`/api/goals/${goalId}/cancel`));
}

export const GOALS_QUERY_KEY = ["goals"];
export const ACTIVE_GOAL_QUERY_KEY = ["goals", "active"];
