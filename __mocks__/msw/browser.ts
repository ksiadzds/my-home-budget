import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

/**
 * Konfiguracja MSW Browser Worker
 * Używany w testach przeglądarki i Storybook
 */
export const worker = setupWorker(...handlers);
