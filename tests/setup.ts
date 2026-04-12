import "@testing-library/jest-dom";
import { server } from "../src/mocks/server";

// Provide a proper localStorage mock for Zustand persist middleware.
// jsdom's localStorage implementation may not expose standard Storage methods
// when accessed from within module-level code (e.g. store initialization).
const createLocalStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string): string | null => store[key] ?? null,
    setItem: (key: string, value: string): void => {
      store[key] = value;
    },
    removeItem: (key: string): void => {
      delete store[key];
    },
    clear: (): void => {
      store = {};
    },
    get length(): number {
      return Object.keys(store).length;
    },
    key: (index: number): string | null => Object.keys(store)[index] ?? null,
    _reset: () => {
      store = {};
    },
  };
};

const localStorageMock = createLocalStorageMock();

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  localStorageMock._reset();
});
afterAll(() => server.close());
