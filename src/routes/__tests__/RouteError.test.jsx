import { it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import RouteError from "../RouteError.jsx";

it.each([
  ["Failed to fetch dynamically imported module: https://example.test/assets/old.js", "This page couldn’t load"],
  ["Unexpected internal detail", "Something went wrong"],
])("shows a recovery action for %s", async (message, heading) => {
  function BrokenPage() { throw new Error(message); }
  const router = createMemoryRouter([{
    path: "/app/meals",
    element: <BrokenPage />,
    errorElement: <RouteError />,
  }], { initialEntries: ["/app/meals"] });
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    render(<RouterProvider router={router} />);
    expect(await screen.findByRole("heading", { name: heading })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reload page" })).toBeInTheDocument();
    expect(screen.queryByText(message)).not.toBeInTheDocument();
  } finally { consoleError.mockRestore(); }
});
