import { http, HttpResponse } from "msw";

/**
 * MSW Handlers dla API autentykacji
 * Mockują endpointy związane z logowaniem, rejestracją i zarządzaniem sesją
 */

export const authHandlers = [
  // POST /api/auth/register - Rejestracja użytkownika
  http.post("/api/auth/register", async ({ request }) => {
    const body = (await request.json()) as { email?: string };

    // Symulacja sukcesu rejestracji
    return HttpResponse.json(
      {
        success: true,
        message: "Użytkownik został zarejestrowany",
      },
      { status: 201 }
    );
  }),

  // POST /api/auth/login - Logowanie użytkownika
  http.post("/api/auth/login", async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string };

    // Symuluj błąd dla konkretnych danych testowych
    if (body.email === "wrong@example.com" || body.password === "wrongpassword") {
      return HttpResponse.json(
        {
          success: false,
          error: "Nieprawidłowy email lub hasło",
        },
        { status: 401 }
      );
    }

    // Symulacja sukcesu logowania
    return HttpResponse.json(
      {
        success: true,
        message: "Zalogowano pomyślnie",
      },
      { status: 200 }
    );
  }),

  // POST /api/auth/logout - Wylogowanie użytkownika
  http.post("/api/auth/logout", () => {
    return HttpResponse.json(
      {
        success: true,
        message: "Wylogowano pomyślnie",
      },
      { status: 200 }
    );
  }),

  // POST /api/auth/reset-password - Reset hasła
  http.post("/api/auth/reset-password", async ({ request }) => {
    const body = await request.json();

    return HttpResponse.json(
      {
        success: true,
        message: "Link do resetowania hasła został wysłany",
      },
      { status: 200 }
    );
  }),
];
