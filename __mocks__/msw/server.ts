import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * Konfiguracja MSW Server dla testów Node.js
 * Używany w testach jednostkowych Vitest
 */
export const server = setupServer(...handlers);

