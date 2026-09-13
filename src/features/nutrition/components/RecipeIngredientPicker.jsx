import { useState } from "react";
import { useFoodOverview, useFoodSearch } from "../hooks/useFoods.js";
import { useDebounce } from "../../../hooks/useDebounce.js";
import MacroChips from "./MacroChips.jsx";
import Skeleton from "../../../components/ui/Skeleton.jsx";
import styles from "./RecipeIngredientPicker.module.css";

/**
 * Picker modal for selecting a food to add as a recipe ingredient.
 */
export default function RecipeIngredientPicker({ open, onSelect, onClose, existingFoodIds = [] }) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const { data: overview, isLoading: isLoadingOverview } = useFoodOverview();
  const { data: searchResults, isLoading: isSearching } = useFoodSearch({
    search: debouncedSearch,
  });

  if (!open) return null;

  const isQuerying = Boolean(debouncedSearch.trim());

  const handleSelectFood = (food) => {
    onSelect(food);
    onClose();
  };

  const isAlreadyAdded = (foodId) => existingFoodIds.includes(foodId);

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ingredient-picker-title"
      >
        <div className={styles.header}>
          <h3 id="ingredient-picker-title" className={styles.title}>
            Add Ingredient Food
          </h3>
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

        <div className={styles.searchBar}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" className={styles.searchIcon}>
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search foods for ingredient..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
            autoFocus
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className={styles.clearBtn}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <div className={styles.listArea}>
          {isQuerying ? (
            isSearching ? (
              <div className={styles.skeletonList}>
                <Skeleton height="54px" borderRadius="10px" />
                <Skeleton height="54px" borderRadius="10px" />
              </div>
            ) : searchResults?.items?.length ? (
              <ul className={styles.list}>
                {searchResults.items.map((food) => {
                  const added = isAlreadyAdded(food.id);
                  return (
                    <li key={food.id}>
                      <button
                        type="button"
                        className={styles.foodRow}
                        disabled={added}
                        onClick={() => handleSelectFood(food)}
                      >
                        <div className={styles.foodInfo}>
                          <span className={styles.foodName}>{food.nameEn}</span>
                          <span className={styles.foodCat}>
                            {food.category || "General"}
                            {added ? " · Already added" : ""}
                          </span>
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
                  );
                })}
              </ul>
            ) : (
              <p className={styles.empty}>No foods match your search.</p>
            )
          ) : (
            isLoadingOverview ? (
              <div className={styles.skeletonList}>
                <Skeleton height="54px" borderRadius="10px" />
                <Skeleton height="54px" borderRadius="10px" />
                <Skeleton height="54px" borderRadius="10px" />
              </div>
            ) : (
              <div className={styles.sections}>
                {overview?.recentFoods?.length > 0 && (
                  <div className={styles.section}>
                    <h4 className={styles.sectionHeading}>Recent Foods</h4>
                    <ul className={styles.list}>
                      {overview.recentFoods.map((food) => {
                        const added = isAlreadyAdded(food.id);
                        return (
                          <li key={`recent-${food.id}`}>
                            <button
                              type="button"
                              className={styles.foodRow}
                              disabled={added}
                              onClick={() => handleSelectFood(food)}
                            >
                              <div className={styles.foodInfo}>
                                <span className={styles.foodName}>{food.nameEn}</span>
                                <span className={styles.foodCat}>
                                  {food.category || "General"}
                                  {added ? " · Already added" : ""}
                                </span>
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
                        );
                      })}
                    </ul>
                  </div>
                )}

                {overview?.customFoods?.length > 0 && (
                  <div className={styles.section}>
                    <h4 className={styles.sectionHeading}>My Custom Foods</h4>
                    <ul className={styles.list}>
                      {overview.customFoods.map((food) => {
                        const added = isAlreadyAdded(food.id);
                        return (
                          <li key={`custom-${food.id}`}>
                            <button
                              type="button"
                              className={styles.foodRow}
                              disabled={added}
                              onClick={() => handleSelectFood(food)}
                            >
                              <div className={styles.foodInfo}>
                                <span className={styles.foodName}>{food.nameEn}</span>
                                <span className={styles.foodCat}>
                                  Custom
                                  {added ? " · Already added" : ""}
                                </span>
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
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
