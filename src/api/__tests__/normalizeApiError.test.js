import { describe, it, expect, vi } from "vitest";
import { normalizeApiError, mapValidationErrors } from "../normalizeApiError.js";

describe("normalizeApiError", () => {
  it("normalizes network errors", () => {
    const error = { code: "ERR_NETWORK" };
    expect(normalizeApiError(error)).toEqual({
      status: null,
      code: "NETWORK_ERROR",
      message: "Unable to connect to the server. Please check your connection.",
      details: null,
      isNetworkError: true,
      isTimeout: false,
    });
  });

  it("normalizes timeouts", () => {
    const error = { code: "ECONNABORTED" };
    expect(normalizeApiError(error)).toEqual({
      status: null,
      code: "TIMEOUT",
      message: "The request timed out. Please try again.",
      details: null,
      isNetworkError: false,
      isTimeout: true,
    });
  });

  it("extracts backend errors", () => {
    const error = {
      response: {
        status: 400,
        data: {
          code: "INVALID_SCHEMA",
          error: "Validation failed.",
          details: [{ field: "email", message: "Invalid email" }],
        },
      },
    };
    expect(normalizeApiError(error)).toEqual({
      status: 400,
      code: "INVALID_SCHEMA",
      message: "Validation failed.",
      details: [{ field: "email", message: "Invalid email" }],
      isNetworkError: false,
      isTimeout: false,
    });
  });

  it("provides fallbacks for unknown response shapes", () => {
    const error = { response: { status: 500, data: {} } };
    expect(normalizeApiError(error)).toEqual({
      status: 500,
      code: "HTTP_500",
      message: "An unexpected error occurred.",
      details: null,
      isNetworkError: false,
      isTimeout: false,
    });
  });

  it("provides fallback for entirely unknown errors", () => {
    const error = new Error("Something weird happened");
    expect(normalizeApiError(error)).toEqual({
      status: null,
      code: "UNKNOWN_ERROR",
      message: "An unexpected error occurred.",
      details: null,
      isNetworkError: false,
      isTimeout: false,
    });
  });
});

describe("mapValidationErrors", () => {
  it("returns null if error is not INVALID_SCHEMA", () => {
    const setError = vi.fn();
    const result = mapValidationErrors(
      { code: "NETWORK_ERROR" },
      setError,
      ["email"]
    );
    expect(result).toBeNull();
    expect(setError).not.toHaveBeenCalled();
  });

  it("maps known fields to setError", () => {
    const setError = vi.fn();
    const error = {
      code: "INVALID_SCHEMA",
      details: [
        { field: "email", message: "Invalid email" },
        { field: "username", message: "Too short" },
      ],
    };
    const result = mapValidationErrors(error, setError, ["email", "username"]);
    
    expect(result).toBeNull();
    expect(setError).toHaveBeenCalledWith("email", { type: "server", message: "Invalid email" });
    expect(setError).toHaveBeenCalledWith("username", { type: "server", message: "Too short" });
  });

  it("collects unknown fields into root error and returns them", () => {
    const setError = vi.fn();
    const error = {
      code: "INVALID_SCHEMA",
      details: [
        { field: "email", message: "Invalid email" },
        { field: "age", message: "Must be a number" },
      ],
    };
    const result = mapValidationErrors(error, setError, ["email"]);
    
    expect(result).toBe("Must be a number");
    expect(setError).toHaveBeenCalledWith("email", { type: "server", message: "Invalid email" });
    expect(setError).toHaveBeenCalledWith("root", { type: "server", message: "Must be a number" });
  });
});
