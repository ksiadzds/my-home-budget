import { defineConfig } from "vitest/config";
import { resolve } from "path";

/**
 * Konfiguracja Vitest dla testów jednostkowych i komponentowych
 * Wykorzystuje React Testing Library i MSW do mockowania API
 */
export default defineConfig({
  // Wyłącz automatyczne ładowanie .env aby testy mogły działać w CI
  envDir: false,

  test: {
    // Włącz globalne API testowe (describe, it, expect, vi)
    globals: true,

    // Środowisko testowe - happy-dom dla testów DOM (szybsze niż jsdom)
    environment: "happy-dom",

    // Pliki setup wykonywane przed testami
    setupFiles: ["./vitest.setup.ts"],

    // Wzorce plików testowych
    include: [
      "src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
    ],

    // Wyklucz pliki e2e (te obsługuje Playwright)
    exclude: ["**/node_modules/**", "**/dist/**", "**/e2e/**", "**/*.e2e.{ts,tsx}"],

    // Konfiguracja coverage
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.{test,spec}.{ts,tsx}",
        "src/**/*.d.ts",
        "src/types.ts",
        "src/db/database.types.ts",
        "src/env.d.ts",
      ],
      // Progi coverage - dostosuj w razie potrzeby
      // Obecne coverage: ~12%, ustawione na 10% aby CI przechodziło
      // TODO: Zwiększyć progi wraz z dodawaniem nowych testów
      thresholds: {
        lines: 10,
        functions: 10,
        branches: 10,
        statements: 10,
      },
    },

    // Timeout dla pojedynczego testu (5 sekund)
    testTimeout: 5000,

    // Mockuj moduły CSS i assety
    css: false,
  },

  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      __mocks__: resolve(__dirname, "./__mocks__"),
    },
  },
});
