import { it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RecipeServingsEntry from "../components/RecipeServingsEntry.jsx";

const recipe = { nameEn: "Koshari", servings: 6, caloriesPerServing: 718, proteinGramsPerServing: 20, carbohydrateGramsPerServing: 110, fatGramsPerServing: 22 };

it.each([0.25, 0.5, 1, 1.5, 2, 2.25, 50])("accepts and submits %s servings", async value => {
  const onConfirm = vi.fn();
  render(<RecipeServingsEntry recipe={recipe} onConfirm={onConfirm} onCancel={() => {}} />);
  const input = screen.getByRole("spinbutton", { name: "Number of Servings" });
  fireEvent.change(input, { target: { value: String(value) } });
  expect(input.checkValidity()).toBe(true);
  await userEvent.click(screen.getByRole("button", { name: "Add to Meal" }));
  expect(onConfirm).toHaveBeenCalledWith(value);
});

it.each(["", "0", "-1", "2.1", "51"])("prevents invalid portion %s", value => {
  const onConfirm = vi.fn();
  render(<RecipeServingsEntry recipe={recipe} onConfirm={onConfirm} onCancel={() => {}} />);
  const input = screen.getByRole("spinbutton", { name: "Number of Servings" });
  fireEvent.change(input, { target: { value } });
  expect(screen.getByRole("button", { name: "Add to Meal" })).toBeDisabled();
  fireEvent.submit(input.closest("form"));
  expect(onConfirm).not.toHaveBeenCalled();
});

it("keeps quick portions valid and adjustments within the limits", async () => {
  render(<RecipeServingsEntry recipe={recipe} onConfirm={() => {}} onCancel={() => {}} />);
  const input = screen.getByRole("spinbutton");
  for (const [name, value] of [["½", 0.5], ["1", 1], ["1½", 1.5], ["2", 2]]) {
    await userEvent.click(screen.getByRole("button", { name, exact: true }));
    expect(input).toHaveValue(value);
    expect(input.checkValidity()).toBe(true);
  }
  fireEvent.change(input, { target: { value: "0.25" } });
  await userEvent.click(screen.getByRole("button", { name: "−½", exact: true }));
  expect(input).toHaveValue(0.25);
  fireEvent.change(input, { target: { value: "50" } });
  await userEvent.click(screen.getByRole("button", { name: "+½", exact: true }));
  expect(input).toHaveValue(50);
});
