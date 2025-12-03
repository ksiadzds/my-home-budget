import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';

/**
 * Pomocnicze funkcje do testowania
 */

/**
 * Custom render dla testów z providerami
 * Rozszerza standardowy render z React Testing Library
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  // W przyszłości możesz dodać tutaj providery (React Query, Context, etc.)
  return render(ui, { ...options });
}

/**
 * Mock dla matchMedia (potrzebny dla niektórych komponentów UI)
 */
export function mockMatchMedia() {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {}, // deprecated
      removeListener: () => {}, // deprecated
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
    }),
  });
}

/**
 * Mock dla IntersectionObserver
 */
export function mockIntersectionObserver() {
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    takeRecords() {
      return [];
    }
    unobserve() {}
  } as any;
}

/**
 * Helper do czekania na async operacje
 */
export const waitFor = (ms: number) => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Helper do tworzenia mock Request
 */
export function createMockRequest(
  url: string,
  options: RequestInit = {}
): Request {
  return new Request(url, {
    method: 'GET',
    ...options,
  });
}

/**
 * Helper do tworzenia mock Response
 */
export function createMockResponse(
  data: any,
  status: number = 200
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Mock user dla testów
 */
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  created_at: new Date().toISOString(),
};

/**
 * Mock kategorii dla testów
 */
export const mockCategories = [
  { id: 'kat-1', nazwa_kategorii: 'Zakupy spożywcze' },
  { id: 'kat-2', nazwa_kategorii: 'Napoje' },
  { id: 'kat-3', nazwa_kategorii: 'Kosmetyki i przybory toaletowe' },
];

/**
 * Mock produktów dla testów
 */
export const mockProducts = [
  {
    id: '1',
    nazwa_produktu: 'Mleko',
    kategoria_id: 'kat-1',
    user_id: 'test-user-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    nazwa_produktu: 'Chleb',
    kategoria_id: 'kat-1',
    user_id: 'test-user-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Re-export wszystkich narzędzi z @testing-library/react
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

