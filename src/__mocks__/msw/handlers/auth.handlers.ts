import { http, HttpResponse } from 'msw';

/**
 * MSW Handlers dla API autentykacji
 * Mockują endpointy związane z logowaniem, rejestracją i zarządzaniem sesją
 */

const BASE_URL = 'http://localhost:4321/api';

export const authHandlers = [
  // POST /api/auth/register - Rejestracja użytkownika
  http.post(`${BASE_URL}/auth/register`, async ({ request }) => {
    const body = await request.json();
    
    // Symulacja sukcesu rejestracji
    return HttpResponse.json(
      {
        success: true,
        message: 'Użytkownik został zarejestrowany',
      },
      { status: 201 }
    );
  }),

  // POST /api/auth/login - Logowanie użytkownika
  http.post(`${BASE_URL}/auth/login`, async ({ request }) => {
    const body = await request.json();
    
    // Symulacja sukcesu logowania
    return HttpResponse.json(
      {
        success: true,
        message: 'Zalogowano pomyślnie',
      },
      { status: 200 }
    );
  }),

  // POST /api/auth/logout - Wylogowanie użytkownika
  http.post(`${BASE_URL}/auth/logout`, () => {
    return HttpResponse.json(
      {
        success: true,
        message: 'Wylogowano pomyślnie',
      },
      { status: 200 }
    );
  }),

  // POST /api/auth/reset-password - Reset hasła
  http.post(`${BASE_URL}/auth/reset-password`, async ({ request }) => {
    const body = await request.json();
    
    return HttpResponse.json(
      {
        success: true,
        message: 'Link do resetowania hasła został wysłany',
      },
      { status: 200 }
    );
  }),
];

