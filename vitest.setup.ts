import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll, afterAll } from "vitest";
import { server } from "__mocks__/msw/server";

/**
 * Setup file dla Vitest
 * Konfiguruje React Testing Library i Mock Service Worker (MSW)
 */

// Uruchom MSW server przed wszystkimi testami
beforeAll(() => {
  server.listen({ onUnhandledRequest: "warn" });
});

// Zresetuj wszystkie handlery między testami
afterEach(() => {
  server.resetHandlers();
  // Wyczyść DOM po każdym teście
  cleanup();
});

// Zamknij MSW server po wszystkich testach
afterAll(() => {
  server.close();
});

// Mockuj zmienne środowiskowe
process.env.PUBLIC_SUPABASE_URL = "http://localhost:54321";
process.env.PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
