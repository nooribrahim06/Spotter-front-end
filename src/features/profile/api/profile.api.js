import { apiClient } from "../../../api/apiClient.js";

const unwrapData = (response) => response.data.data;

export async function getProfileConfig() {
  return unwrapData(await apiClient.get("/api/profiles/config"));
}

export async function getMyProfile() {
  return unwrapData(await apiClient.get("/api/profiles/me"));
}

export async function updatePublicProfile(payload) {
  return unwrapData(await apiClient.patch("/api/profiles/me/public", payload));
}

export async function updateAccountPreferences(payload) {
  return unwrapData(
    await apiClient.patch("/api/profiles/me/account-preferences", payload)
  );
}

export async function createBodyProfile(payload) {
  return unwrapData(await apiClient.post("/api/profiles/me/body", payload));
}

export async function updateBodyProfile(payload) {
  return unwrapData(await apiClient.patch("/api/profiles/me/body", payload));
}

export async function replaceHealthProfile(payload) {
  return unwrapData(await apiClient.put("/api/profiles/me/health", payload));
}

export async function replaceNutritionProfile(payload) {
  return unwrapData(await apiClient.put("/api/profiles/me/nutrition", payload));
}

export async function replaceTrainingProfile(payload) {
  return unwrapData(await apiClient.put("/api/profiles/me/training", payload));
}

export async function replaceCoachingPreferences(payload) {
  return unwrapData(await apiClient.put("/api/profiles/me/coaching", payload));
}

export async function getMyTargets() {
  return unwrapData(await apiClient.get("/api/profiles/me/targets"));
}

export async function deleteBodyProfile(payload) {
  await apiClient.delete("/api/profiles/me/body", { data: payload });
}
