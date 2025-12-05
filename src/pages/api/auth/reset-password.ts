import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client.ts";
import { resetPasswordRequestSchema, resetPasswordConfirmSchema } from "../../../lib/validations/auth.validation.ts";

/**
 * Endpoint resetowania hasła (dwu-etapowy)
 *
 * @endpoint POST /api/auth/reset-password
 * @description
 * Obsługuje dwa tryby resetowania hasła:
 * 1. 'request' - Żądanie linku resetowania (z emailem)
 * 2. 'confirm' - Potwierdzenie i ustawienie nowego hasła (z kodem)
 *
 * @remarks
 * Zgodnie ze specyfikacją auth-spec.md:
 * - Używa Supabase Auth do resetowania hasła
 * - Nie ujawnia informacji o istnieniu konta (security)
 * - Link resetowania jest wysyłany przez Supabase na email
 * - Token w linku jest jednorazowy i ma ograniczony czas życia
 *
 * ## Request Body - Krok 1 (Request Link)
 * ```json
 * {
 *   "action": "request",
 *   "email": "user@example.com"
 * }
 * ```
 *
 * ## Request Body - Krok 2 (Confirm New Password)
 * ```json
 * {
 *   "action": "confirm",
 *   "code": "token_from_email",
 *   "password": "newPassword123"
 * }
 * ```
 *
 * ## Response - Success (200)
 * ```json
 * {
 *   "message": "Success message"
 * }
 * ```
 *
 * ## Response - Error (400)
 * ```json
 * {
 *   "error": "Error message"
 * }
 * ```
 *
 * @version 1.0.0 MVP
 * @since 2025-01-21
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parsuj body requesta
    const body = await request.json();
    const { action } = body;

    // Utwórz per-request Supabase server instance
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // KROK 1: Żądanie linku resetowania hasła
    if (action === "request") {
      // Walidacja server-side
      const validationResult = resetPasswordRequestSchema.safeParse(body);

      if (!validationResult.success) {
        return new Response(
          JSON.stringify({
            error: "Nieprawidłowe dane",
            details: validationResult.error.errors,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const { email } = validationResult.data;

      // Wywołaj Supabase Auth - resetPasswordForEmail
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${new URL(request.url).origin}/auth/reset-password`,
      });

      // Nawet jeśli email nie istnieje, zwróć sukces (security - nie ujawniaj istnienia konta)
      if (error) {
        console.error("Reset password request error:", error);
        // Dla celów bezpieczeństwa nadal zwracamy sukces
        // Nie chcemy ujawniać czy konto istnieje czy nie
      }

      return new Response(
        JSON.stringify({
          message: "Jeśli podany adres email istnieje, wysłaliśmy link do resetowania hasła",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // KROK 2: Potwierdzenie i ustawienie nowego hasła
    if (action === "confirm") {
      // Walidacja server-side
      const validationResult = resetPasswordConfirmSchema.safeParse(body);

      if (!validationResult.success) {
        return new Response(
          JSON.stringify({
            error: "Nieprawidłowe dane",
            details: validationResult.error.errors,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const { code, password } = validationResult.data;

      // Wymień token (code) na sesję użytkownika
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error("Code exchange error:", exchangeError);
        return new Response(
          JSON.stringify({
            error: "Nieprawidłowy lub wygasły token. Spróbuj zresetować hasło ponownie.",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Ustaw nowe hasło
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        console.error("Password update error:", updateError);
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Sukces - hasło zostało zmienione
      return new Response(
        JSON.stringify({
          message: "Hasło zostało pomyślnie zmienione",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Nieprawidłowa akcja
    return new Response(JSON.stringify({ error: "Nieprawidłowa akcja" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected reset password error:", err);
    return new Response(JSON.stringify({ error: "Wystąpił nieoczekiwany błąd" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// Disable prerendering dla tego endpointu (wymagane dla SSR)
export const prerender = false;
