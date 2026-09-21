import { describe, it, expect, vi } from "vitest";
import { installChunkRecovery } from "../chunkRecovery.js";

function browser(storage = new Map(), online = true) {
  const target = new EventTarget();
  target.navigator = { onLine: online };
  target.location = { reload: vi.fn() };
  target.sessionStorage = { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) };
  installChunkRecovery(target);
  return target;
}
const fail = target => target.dispatchEvent(new Event("vite:preloadError"));

describe("deployment chunk recovery", () => {
  it("reloads once and does not loop after a new document loads", () => {
    const storage = new Map();
    const first = browser(storage);
    fail(first); fail(first);
    expect(first.location.reload).toHaveBeenCalledTimes(1);
    const reloaded = browser(storage);
    fail(reloaded);
    expect(reloaded.location.reload).not.toHaveBeenCalled();
  });
  it("does not reload offline", () => {
    const target = browser(new Map(), false);
    fail(target);
    expect(target.location.reload).not.toHaveBeenCalled();
  });
  it("falls back without looping when storage is blocked", () => {
    const target = browser();
    target.sessionStorage.getItem = () => { throw new Error("blocked"); };
    expect(() => fail(target)).not.toThrow();
    expect(target.location.reload).not.toHaveBeenCalled();
  });
  it("allows recovery for a later deployment", () => {
    const target = browser(new Map([["spotter:chunk-reload-at", String(Date.now() - 120_000)]]));
    fail(target);
    expect(target.location.reload).toHaveBeenCalledTimes(1);
  });
});
