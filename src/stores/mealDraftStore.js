import { create } from "zustand";
import { mealItemToInput, defaultOccurredAt } from "../features/nutrition/nutrition.domain.js";

/**
 * Zustand meal draft store — ephemeral, in-memory state for the active
 * meal being created or edited.
 *
 * Not persisted. Survives navigation within the SPA (e.g. navigating
 * to /app/recipes/new and back). Cleared on save or explicit discard.
 *
 * Rules from the API contract:
 *   - The same food cannot appear twice.
 *   - The same recipe cannot appear twice.
 *   - Quick items may appear multiple times.
 *   - Notes cannot be an empty string (send null or omit).
 */
export const useMealDraftStore = create((set, get) => ({
  mealType: null,
  occurredAt: null,
  notes: null,
  items: [],
  editingMealId: null,

  /**
   * Initialize a fresh draft for a new meal.
   */
  initDraft: (mealType, occurredAt) =>
    set({
      mealType,
      occurredAt: occurredAt || defaultOccurredAt(mealType),
      notes: null,
      items: [],
      editingMealId: null,
    }),

  /**
   * Populate the draft from an existing meal (edit flow).
   * Converts response MealItems back to MealItemInputs.
   */
  /**
   * Populate the draft from an existing meal (edit flow).
   * Converts response MealItems back to MealItemInputs and keeps snapshot details for display.
   */
  initFromMeal: (meal) =>
    set({
      mealType: meal.mealType,
      occurredAt: meal.occurredAt,
      notes: meal.notes,
      items: meal.items.map((item) => ({
        ...mealItemToInput(item),
        itemName: item.itemName,
        calories: item.calories,
        proteinGrams: item.proteinGrams,
        carbohydrateGrams: item.carbohydrateGrams,
        fatGrams: item.fatGrams,
      })),
      editingMealId: meal.id,
    }),

  /**
   * Add a food item. Rejects duplicates (same foodId).
   * @returns {boolean} true if added, false if duplicate
   */
  addFoodItem: (foodId, quantityGrams, meta = {}) => {
    const { items } = get();
    const duplicate = items.some(
      (item) => item.itemType === "FOOD" && item.foodId === foodId,
    );
    if (duplicate) return false;

    set({
      items: [
        ...items,
        {
          itemType: "FOOD",
          foodId,
          quantityGrams,
          itemName: meta.nameEn,
          calories: meta.calories,
          proteinGrams: meta.proteinGrams,
          carbohydrateGrams: meta.carbohydrateGrams,
          fatGrams: meta.fatGrams,
        },
      ],
    });
    return true;
  },

  /**
   * Add a recipe item. Rejects duplicates (same recipeId).
   * @returns {boolean} true if added, false if duplicate
   */
  addRecipeItem: (recipeId, servings, meta = {}) => {
    const { items } = get();
    const duplicate = items.some(
      (item) => item.itemType === "RECIPE" && item.recipeId === recipeId,
    );
    if (duplicate) return false;

    set({
      items: [
        ...items,
        {
          itemType: "RECIPE",
          recipeId,
          servings,
          itemName: meta.nameEn,
          calories: meta.calories,
          proteinGrams: meta.proteinGrams,
          carbohydrateGrams: meta.carbohydrateGrams,
          fatGrams: meta.fatGrams,
        },
      ],
    });
    return true;
  },

  /**
   * Add a quick-add item. Multiple quick items are allowed.
   */
  addQuickItem: ({ itemName, calories, proteinGrams, carbohydrateGrams, fatGrams }) =>
    set((state) => ({
      items: [
        ...state.items,
        {
          itemType: "QUICK",
          itemName: itemName || undefined,
          calories,
          proteinGrams: proteinGrams ?? null,
          carbohydrateGrams: carbohydrateGrams ?? null,
          fatGrams: fatGrams ?? null,
        },
      ],
    })),

  /**
   * Update an item at a specific index (e.g. change quantity or servings).
   */
  updateItem: (index, partialUpdate) =>
    set((state) => ({
      items: state.items.map((item, i) =>
        i === index ? { ...item, ...partialUpdate } : item,
      ),
    })),

  /**
   * Remove an item at a specific index.
   */
  removeItem: (index) =>
    set((state) => ({
      items: state.items.filter((_, i) => i !== index),
    })),

  /**
   * Update the meal type.
   */
  setMealType: (mealType) => set({ mealType }),

  /**
   * Update the occurredAt timestamp.
   */
  setOccurredAt: (occurredAt) => set({ occurredAt }),

  /**
   * Update notes. Empty string is converted to null per API contract.
   */
  setNotes: (notes) => set({ notes: notes?.trim() || null }),

  /**
   * Clear the entire draft. Used on save or explicit discard.
   */
  clearDraft: () =>
    set({
      mealType: null,
      occurredAt: null,
      notes: null,
      items: [],
      editingMealId: null,
    }),

  /**
   * Build the SaveMealRequest payload for POST/PUT /api/meals.
   * Cleans internal metadata so only the contract fields are sent.
   * Returns null if required fields are missing.
   *
   * @returns {SaveMealRequest|null}
   */
  toSaveMealRequest: () => {
    const { mealType, occurredAt, notes, items } = get();
    if (!mealType || !occurredAt || items.length === 0) return null;

    return {
      mealType,
      occurredAt,
      notes: notes || null,
      items: items.map((item) => {
        if (item.itemType === "FOOD") {
          return {
            itemType: "FOOD",
            foodId: item.foodId,
            quantityGrams: item.quantityGrams,
          };
        }
        if (item.itemType === "RECIPE") {
          return {
            itemType: "RECIPE",
            recipeId: item.recipeId,
            servings: item.servings,
          };
        }
        return {
          itemType: "QUICK",
          itemName: item.itemName || undefined,
          calories: item.calories,
          proteinGrams: item.proteinGrams ?? null,
          carbohydrateGrams: item.carbohydrateGrams ?? null,
          fatGrams: item.fatGrams ?? null,
        };
      }),
    };
  },
}));
