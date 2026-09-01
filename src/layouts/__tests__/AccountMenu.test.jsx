import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../test/test-utils.jsx";
import { useAuthStore } from "../../stores/authStore.js";

const logoutMock = vi.hoisted(() => vi.fn());

vi.mock("../../features/auth/hooks/useLogout.js", () => ({
  useLogout: () => ({ handleLogout: logoutMock, isLoggingOut: false }),
}));

import AccountMenu from "../AccountMenu.jsx";

describe("AccountMenu", () => {
  beforeEach(() => {
    logoutMock.mockReset();
    useAuthStore.setState({
      authStatus: "authenticated",
      accessToken: "token",
      user: { id: "user-1", username: "nourhasan1990s", firstName: "Nour" },
    });
  });

  it("keeps profile and logout together and confirms before logging out", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AccountMenu />);

    await user.click(screen.getByRole("button", { name: /your profile, nour/i }));
    expect(screen.getByRole("menuitem", { name: /^profile$/i })).toBeInTheDocument();
    await user.click(screen.getByRole("menuitem", { name: /log out/i }));

    expect(screen.getByRole("dialog", { name: "Log out of Spotter?" })).toBeInTheDocument();
    expect(logoutMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Stay signed in" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(logoutMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /your profile, nour/i }));
    await user.click(screen.getByRole("menuitem", { name: /log out/i }));
    await user.click(screen.getByRole("button", { name: "Yes, log me out" }));
    expect(logoutMock).toHaveBeenCalledOnce();
  });

  it("opens and moves through account actions from the keyboard", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AccountMenu />);

    const trigger = screen.getByRole("button", { name: /your profile, nour/i });
    trigger.focus();
    await user.keyboard("{ArrowDown}");

    expect(screen.getByRole("menuitem", { name: /^profile$/i })).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: /log out/i })).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(trigger).toHaveFocus();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
