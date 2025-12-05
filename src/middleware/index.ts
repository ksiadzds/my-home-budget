import { defineMiddleware } from "astro:middleware";

import { supabaseClient, createSupabaseServerInstance } from "../db/supabase.client.ts";

/**
 * Ścieżki publiczne - dostępne dla niezalogowanych użytkowników
 *
 * @description
 * Zawiera:
 * - Strony auth (login, register, reset-password)
 * - API endpoints auth (/api/auth/*)
 *
 * Wszystkie inne ścieżki wymagają zalogowania.
 */
const PUBLIC_PATHS = [
  // Strony auth
  "/auth/login",
  "/auth/register",
  "/auth/reset-password",
  // API endpoints auth
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/reset-password",
];

/**
 * Middleware Astro - zarządzanie sesją Supabase i ochrona tras
 *
 * @description
 * Dla każdego requesta:
 * 1. Tworzy per-request Supabase server client (wymagane dla auth)
 * 2. Sprawdza sesję użytkownika
 * 3. Ustawia locals.user jeśli użytkownik jest zalogowany
 * 4. Przekierowuje do /auth/login jeśli użytkownik nie jest zalogowany i próbuje dostać się do chronionej ścieżki
 * 5. Zachowuje backward compatibility z locals.supabase (legacy)
 *
 * @version 2.0.0 MVP Auth - z ochroną tras
 * @since 2025-01-21
 */
export const onRequest = defineMiddleware(async ({ locals, cookies, request, url, redirect }, next) => {
  // Zachowaj backward compatibility z legacy supabaseClient
  locals.supabase = supabaseClient;

  // Utwórz per-request Supabase server instance dla auth
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // Sprawdź sesję użytkownika
  // WAŻNE: Zawsze używaj auth.getUser() a nie getSession() dla bezpieczeństwa
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Ustaw user w locals jeśli jest zalogowany
  if (user) {
    locals.user = {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      email: user.email!,
      id: user.id,
    };
  } else if (!PUBLIC_PATHS.includes(url.pathname)) {
    // Przekieruj do logowania jeśli użytkownik nie jest zalogowany i próbuje dostać się do chronionej ścieżki
    return redirect("/auth/login");
  }

  return next();
});
