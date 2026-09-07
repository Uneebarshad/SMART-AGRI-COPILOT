/**
 * The single seam between the app and browser storage.
 * All persisted keys are namespaced `agri.*`. When the product becomes a
 * mobile app, swapping this module for a native storage adapter is the only
 * change required (frontend-spec.md §14.4, §19.1).
 */
export const storage = {
  get(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Storage unavailable (private mode, quota) — preferences stay in memory.
    }
  },
  remove(key) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore.
    }
  },
};
