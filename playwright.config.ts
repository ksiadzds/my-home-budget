import { defineConfig, devices } from '@playwright/test';

/**
 * Konfiguracja Playwright dla testów E2E
 * Zgodnie z wytycznymi używamy tylko przeglądarki Chromium/Desktop Chrome
 */
export default defineConfig({
  // Katalog z testami E2E
  testDir: './e2e',
  
  // Timeout dla pojedynczego testu (30 sekund)
  timeout: 30 * 1000,
  
  // Ścieżka do plików testowych
  testMatch: '**/*.e2e.{ts,tsx}',
  
  // Uruchom testy w trybie fullParallel dla szybszego wykonania
  fullyParallel: true,
  
  // Nie pozwól na brak testów
  forbidOnly: !!process.env.CI,
  
  // Ponawiaj nieudane testy tylko w CI
  retries: process.env.CI ? 2 : 0,
  
  // Maksymalna liczba równoległych workerów
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter: html dla przeglądu wyników, list dla konsoli
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],
  
  use: {
    // URL bazowy aplikacji
    baseURL: process.env.BASE_URL || 'http://localhost:4321',
    
    // Zapisuj trace w przypadku niepowodzenia testu (do debugowania)
    trace: 'on-first-retry',
    
    // Zapisuj screenshot na niepowodzenie
    screenshot: 'only-on-failure',
    
    // Zapisuj wideo na niepowodzenie
    video: 'retain-on-failure',
    
    // Timeout dla akcji (10 sekund)
    actionTimeout: 10 * 1000,
    
    // Timeout dla nawigacji (10 sekund)
    navigationTimeout: 10 * 1000,
  },

  // Konfiguracja projektu - tylko Chromium zgodnie z wytycznymi
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
  ],

  // Serwer deweloperski - uruchom aplikację przed testami
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      SUPABASE_URL: process.env.SUPABASE_URL || '',
      SUPABASE_KEY: process.env.SUPABASE_KEY || '',
      E2E_USERNAME_ID: process.env.E2E_USERNAME_ID || '',
      E2E_USERNAME: process.env.E2E_USERNAME || '',
      E2E_PASSWORD: process.env.E2E_PASSWORD || '',
    },
  },
});

