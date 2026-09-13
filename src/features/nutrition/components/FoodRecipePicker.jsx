import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { calculateFoodPreview, calculateRecipePreview } from "../nutrition.domain.js";
import { useFoodOverview, useFoodSearch } from "../hooks/useFoods.js";
import { useRecipeOverview, useRecipeSearch } from "../hooks/useRecipes.js";
import { useDebounce } from "../../../hooks/useDebounce.js";
import { useMealDraftStore } from "../../../stores/mealDraftStore.js";
import { showError, showSuccess } from "../../../components/ui/Toast.jsx";
import FoodQuantityEntry from "./FoodQuantityEntry.jsx";
import RecipeServingsEntry from "./RecipeServingsEntry.jsx";
import CreateFoodForm from "./CreateFoodForm.jsx";
import QuickAddForm from "./QuickAddForm.jsx";
import MacroChips from "./MacroChips.jsx";
import Skeleton from "../../../components/ui/Skeleton.jsx";
import styles from "./FoodRecipePicker.module.css";

/**
 * Slide-up sheet (mobile) / modal panel (desktop) for picking foods, recipes, or quick add.
 */
export default function FoodRecipePicker({ open, onClose }) {
  const navigate = useNavigate();

  // Active view: "list" | "food-quantity" | "recipe-servings" | "create-food" | "quick-add"
  const [view, setView] = useState("list");
  // Active tab in "list" view: "all" | "foods" | "recipes" | "quick"
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  // Selected item for quantity/servings entry
  const [selectedFood, setSelectedFood] = useState(null);
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  // Zustand draft store
  const addFoodItem = useMealDraftStore((s) => s.addFoodItem);
  const addRecipeItem = useMealDraftStore((s) => s.addRecipeItem);
  const addQuickItem = useMealDraftStore((s) => s.addQuickItem);

  // Queries
  const { data: foodOverview, isLoading: isLoadingFoods } = useFoodOverview();
  const { data: recipeOverview, isLoading: isLoadingRecipes } = useRecipeOverview();
  const { data: foodSearchResults, isLoading: isSearchingFoods } = useFoodSearch({
    search: debouncedSearch,
  });
  const { data: recipeSearchResults, isLoading: isSearchingRecipes } = useRecipeSearch({
    search: debouncedSearch,
  });

  if (!open) return null;

  const isSearching = Boolean(debouncedSearch.trim());

  // Handlers for selection
  const handleSelectFood = (food) => {
    setSelectedFood(food);
    setView("food-quantity");
  };

  const handleSelectRecipe = (recipe) => {
    setSelectedRecipe(recipe);
    setView("recipe-servings");
  };

  const handleConfirmFood = (grams) => {
    if (!selectedFood) return;
    const preview = calculateFoodPreview(selectedFood, grams);
    const added = addFoodItem(selectedFood.id, grams, {
      nameEn: selectedFood.nameEn,
      calories: preview.calories,
      proteinGrams: preview.proteinGrams,
      carbohydrateGrams: preview.carbohydrateGrams,
      fatGrams: preview.fatGrams,
    });
    if (!added) {
      showError("This food is already in your meal draft.");
    } else {
      showSuccess(`Added ${selectedFood.nameEn}`);
      onClose();
    }
  };

  const handleConfirmRecipe = (servings) => {
    if (!selectedRecipe) return;
    const preview = calculateRecipePreview(selectedRecipe, servings);
    const added = addRecipeItem(selectedRecipe.id, servings, {
      nameEn: selectedRecipe.nameEn,
      calories: preview.calories,
      proteinGrams: preview.proteinGrams,
      carbohydrateGrams: preview.carbohydrateGrams,
      fatGrams: preview.fatGrams,
    });
    if (!added) {
      showError("This recipe is already in your meal draft.");
    } else {
      showSuccess(`Added ${selectedRecipe.nameEn}`);
      onClose();
    }
  };

  const handleConfirmQuick = (quickItem) => {
    addQuickItem(quickItem);
    showSuccess("Added quick item");
    onClose();
  };

  const handleFoodCreated = (newFood) => {
    setSelectedFood(newFood);
    setView("food-quantity");
  };

  const handleGoToCreateRecipe = () => {
    onClose();
    navigate("/app/recipes/new");
  };

  const resetView = () => {
    setView("list");
    setSelectedFood(null);
    setSelectedRecipe(null);
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.sheet}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="picker-title"
      >
        <div className={styles.sheetHeader}>
          <h2 id="picker-title" className={styles.sheetTitle}>
            {view === "list" && "Add to Meal"}
            {view === "food-quantity" && "Add Food"}
            {view === "recipe-servings" && "Add Recipe"}
            {view === "create-food" && "New Custom Food"}
            {view === "quick-add" && "Quick Add"}
          </h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close picker"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* SUBVIEWS */}
        {view === "food-quantity" && selectedFood && (
          <FoodQuantityEntry
            food={selectedFood}
            onConfirm={handleConfirmFood}
            onCancel={resetView}
          />
        )}

        {view === "recipe-servings" && selectedRecipe && (
          <RecipeServingsEntry
            recipe={selectedRecipe}
            onConfirm={handleConfirmRecipe}
            onCancel={resetView}
          />
        )}

        {view === "create-food" && (
          <CreateFoodForm
            onSuccess={handleFoodCreated}
            onCancel={resetView}
          />
        )}

        {view === "quick-add" && (
          <QuickAddForm
            onConfirm={handleConfirmQuick}
            onCancel={resetView}
          />
        )}

        {view === "list" && (
          <div className={styles.listContent}>
            {/* SEARCH BAR */}
            <div className={styles.searchBar}>
              <svg className={styles.searchIcon} viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search foods and recipes..."
                className={styles.searchInput}
                autoFocus
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className={styles.clearSearch}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* TABS */}
            <div className={styles.tabs} role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "all"}
                className={`${styles.tab} ${activeTab === "all" ? styles.tabActive : ""}`}
                onClick={() => setActiveTab("all")}
              >
                All
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "foods"}
                className={`${styles.tab} ${activeTab === "foods" ? styles.tabActive : ""}`}
                onClick={() => setActiveTab("foods")}
              >
                Foods
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "recipes"}
                className={`${styles.tab} ${activeTab === "recipes" ? styles.tabActive : ""}`}
                onClick={() => setActiveTab("recipes")}
              >
                Recipes
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "quick"}
                className={`${styles.tab} ${activeTab === "quick" ? styles.tabActive : ""}`}
                onClick={() => setView("quick-add")}
              >
                ⚡ Quick Add
              </button>
            </div>

            {/* CREATION SHORTCUTS */}
            <div className={styles.shortcuts}>
              <button
                type="button"
                className={styles.shortcutBtn}
                onClick={() => setView("create-food")}
              >
                + Create Food
              </button>
              <button
                type="button"
                className={styles.shortcutBtn}
                onClick={handleGoToCreateRecipe}
              >
                + Create Recipe
              </button>
            </div>

            {/* ITEMS LIST */}
            <div className={styles.scrollList}>
              {/* SEARCH MODE */}
              {isSearching ? (
                <div>
                  {(isSearchingFoods || isSearchingRecipes) ? (
                    <div className={styles.skeletonArea}>
                      <Skeleton height="56px" borderRadius="10px" />
                      <Skeleton height="56px" borderRadius="10px" />
                    </div>
                  ) : (
                    <>
                      {/* Foods Search Results */}
                      {(activeTab === "all" || activeTab === "foods") && (
                        <div className={styles.section}>
                          <h4 className={styles.sectionTitle}>Foods</h4>
                          {foodSearchResults?.items?.length ? (
                            <ul className={styles.itemsList}>
                              {foodSearchResults.items.map((food) => (
                                <li key={food.id}>
                                  <button
                                    type="button"
                                    className={styles.itemRow}
                                    onClick={() => handleSelectFood(food)}
                                  >
                                    <div className={styles.itemLeft}>
                                      <span className={styles.itemBadgeFood}>F</span>
                                      <div>
                                        <div className={styles.itemName}>{food.nameEn}</div>
                                        <div className={styles.itemCategory}>{food.category || "General"}</div>
                                      </div>
                                    </div>
                                    <MacroChips
                                      calories={food.caloriesPer100g}
                                      proteinGrams={food.proteinGramsPer100g}
                                      carbohydrateGrams={food.carbohydrateGramsPer100g}
                                      fatGrams={food.fatGramsPer100g}
                                      size="sm"
                                    />
                                  </button>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className={styles.emptyNote}>No matching foods found.</p>
                          )}
                        </div>
                      )}

                      {/* Recipes Search Results */}
                      {(activeTab === "all" || activeTab === "recipes") && (
                        <div className={styles.section}>
                          <h4 className={styles.sectionTitle}>Recipes</h4>
                          {recipeSearchResults?.items?.length ? (
                            <ul className={styles.itemsList}>
                              {recipeSearchResults.items.map((recipe) => (
                                <li key={recipe.id}>
                                  <button
                                    type="button"
                                    className={styles.itemRow}
                                    onClick={() => handleSelectRecipe(recipe)}
                                  >
                                    <div className={styles.itemLeft}>
                                      <span className={styles.itemBadgeRecipe}>R</span>
                                      <div>
                                        <div className={styles.itemName}>{recipe.nameEn}</div>
                                        <div className={styles.itemCategory}>
                                          {recipe.servings} serving{recipe.servings !== 1 ? "s" : ""}
                                        </div>
                                      </div>
                                    </div>
                                    <MacroChips
                                      calories={recipe.caloriesPerServing}
                                      proteinGrams={recipe.proteinGramsPerServing}
                                      carbohydrateGrams={recipe.carbohydrateGramsPerServing}
                                      fatGrams={recipe.fatGramsPerServing}
                                      size="sm"
                                    />
                                  </button>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className={styles.emptyNote}>No matching recipes found.</p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                /* DEFAULT BROWSE MODE (Recent & Custom) */
                <div>
                  {(isLoadingFoods || isLoadingRecipes) ? (
                    <div className={styles.skeletonArea}>
                      <Skeleton height="56px" borderRadius="10px" />
                      <Skeleton height="56px" borderRadius="10px" />
                      <Skeleton height="56px" borderRadius="10px" />
                    </div>
                  ) : (
                    <>
                      {/* Recent Foods */}
                      {(activeTab === "all" || activeTab === "foods") && foodOverview?.recentFoods?.length > 0 && (
                        <div className={styles.section}>
                          <h4 className={styles.sectionTitle}>Recent Foods</h4>
                          <ul className={styles.itemsList}>
                            {foodOverview.recentFoods.map((food) => (
                              <li key={`recent-food-${food.id}`}>
                                <button
                                  type="button"
                                  className={styles.itemRow}
                                  onClick={() => handleSelectFood(food)}
                                >
                                  <div className={styles.itemLeft}>
                                    <span className={styles.itemBadgeFood}>F</span>
                                    <div>
                                      <div className={styles.itemName}>{food.nameEn}</div>
                                      <div className={styles.itemCategory}>{food.category || "General"}</div>
                                    </div>
                                  </div>
                                  <MacroChips
                                    calories={food.caloriesPer100g}
                                    proteinGrams={food.proteinGramsPer100g}
                                    carbohydrateGrams={food.carbohydrateGramsPer100g}
                                    fatGrams={food.fatGramsPer100g}
                                    size="sm"
                                  />
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Custom Foods */}
                      {(activeTab === "all" || activeTab === "foods") && foodOverview?.customFoods?.length > 0 && (
                        <div className={styles.section}>
                          <h4 className={styles.sectionTitle}>My Custom Foods</h4>
                          <ul className={styles.itemsList}>
                            {foodOverview.customFoods.map((food) => (
                              <li key={`custom-food-${food.id}`}>
                                <button
                                  type="button"
                                  className={styles.itemRow}
                                  onClick={() => handleSelectFood(food)}
                                >
                                  <div className={styles.itemLeft}>
                                    <span className={styles.itemBadgeFood}>F</span>
                                    <div>
                                      <div className={styles.itemName}>{food.nameEn}</div>
                                      <div className={styles.itemCategory}>Custom</div>
                                    </div>
                                  </div>
                                  <MacroChips
                                    calories={food.caloriesPer100g}
                                    proteinGrams={food.proteinGramsPer100g}
                                    carbohydrateGrams={food.carbohydrateGramsPer100g}
                                    fatGrams={food.fatGramsPer100g}
                                    size="sm"
                                  />
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Recent Recipes */}
                      {(activeTab === "all" || activeTab === "recipes") && recipeOverview?.recentRecipes?.length > 0 && (
                        <div className={styles.section}>
                          <h4 className={styles.sectionTitle}>Recent Recipes</h4>
                          <ul className={styles.itemsList}>
                            {recipeOverview.recentRecipes.map((recipe) => (
                              <li key={`recent-recipe-${recipe.id}`}>
                                <button
                                  type="button"
                                  className={styles.itemRow}
                                  onClick={() => handleSelectRecipe(recipe)}
                                >
                                  <div className={styles.itemLeft}>
                                    <span className={styles.itemBadgeRecipe}>R</span>
                                    <div>
                                      <div className={styles.itemName}>{recipe.nameEn}</div>
                                      <div className={styles.itemCategory}>
                                        {recipe.servings} serving{recipe.servings !== 1 ? "s" : ""}
                                      </div>
                                    </div>
                                  </div>
                                  <MacroChips
                                    calories={recipe.caloriesPerServing}
                                    proteinGrams={recipe.proteinGramsPerServing}
                                    carbohydrateGrams={recipe.carbohydrateGramsPerServing}
                                    fatGrams={recipe.fatGramsPerServing}
                                    size="sm"
                                  />
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Custom Recipes */}
                      {(activeTab === "all" || activeTab === "recipes") && recipeOverview?.customRecipes?.length > 0 && (
                        <div className={styles.section}>
                          <h4 className={styles.sectionTitle}>My Custom Recipes</h4>
                          <ul className={styles.itemsList}>
                            {recipeOverview.customRecipes.map((recipe) => (
                              <li key={`custom-recipe-${recipe.id}`}>
                                <button
                                  type="button"
                                  className={styles.itemRow}
                                  onClick={() => handleSelectRecipe(recipe)}
                                >
                                  <div className={styles.itemLeft}>
                                    <span className={styles.itemBadgeRecipe}>R</span>
                                    <div>
                                      <div className={styles.itemName}>{recipe.nameEn}</div>
                                      <div className={styles.itemCategory}>Custom recipe</div>
                                    </div>
                                  </div>
                                  <MacroChips
                                    calories={recipe.caloriesPerServing}
                                    proteinGrams={recipe.proteinGramsPerServing}
                                    carbohydrateGrams={recipe.carbohydrateGramsPerServing}
                                    fatGrams={recipe.fatGramsPerServing}
                                    size="sm"
                                  />
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* If everything is empty */}
                      {foodOverview?.recentFoods?.length === 0 &&
                        foodOverview?.customFoods?.length === 0 &&
                        recipeOverview?.recentRecipes?.length === 0 &&
                        recipeOverview?.customRecipes?.length === 0 && (
                          <div className={styles.emptyPrompt}>
                            <p>No recent foods or recipes yet.</p>
                            <p>Type in the search box above to find global ingredients!</p>
                          </div>
                        )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
