import "@testing-library/jest-dom";

// ── Global Stacks Mocks ──────────────────────────────────────────────────────
// Mock @stacks/connect so wallet-related imports don't fail in JSDOM.
// Individual tests can override these with vi.mock() where needed.

import { vi } from "vitest";

vi.mock("@stacks/connect", () => ({
  openContractCall: vi.fn(),
  showConnect: vi.fn(),
  AppConfig: class {},
  UserSession: class {
    isUserSignedIn() {
      return false;
    }
    isSignInPending() {
      return false;
    }
    loadUserData() {
      return {};
    }
  },
  Connect: vi.fn(),
}));
