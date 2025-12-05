import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client.ts";
import { registerApiSchema } from "../../../lib/validations/auth.validation.ts";

/**
 * Endpoint rejestracji nowego użytkownika
 *
 * @endpoint POST /api/auth/register
 * @description
 * Obsługuje rejestrację nowego użytkownika przez Supabase Auth.
 * Tworzy per-request Supabase server client, rejestruje użytkownika
 * i automatycznie go loguje (auto-confirm jest włączony w dev).
 *
 * @remarks
 * Zgodnie ze specyfikacją auth-spec.md i PRD US-001:
 * - Po sukcesie użytkownik jest automatycznie zalogowany
 * - Auto-confirm user jest włączony w środowisku dev
 * - Używa createSupabaseServerInstance dla zarządzania cookies
 * - Walidacja server-side dla bezpieczeństwa
 *
 * ## Request Body
 * ```json
 * {
 *   "email": "user@example.com",
 *   "password": "password123",
 *   "confirmPassword": "password123"
 * }
 * ```
 *
 * ## Response - Success (200)
 * ```json
 * {
 *   "user": {
 *     "id": "uuid",
 *     "email": "user@example.com",
 *     ...
 *   }
 * }
 * ```
 *
 * ## Response - Error (400)
 * ```json
 * {
 *   "error": "User already registered"
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

    // Walidacja server-side
    const validationResult = registerApiSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowe dane rejestracji",
          details: validationResult.error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { email, password } = validationResult.data;

    // Utwórz per-request Supabase server instance
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Wywołaj Supabase Auth - signUp
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${new URL(request.url).origin}/auth/login`,
      },
    });

    // Obsługa błędu z Supabase Auth
    if (error) {
      console.error("Registration error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Sukces - zwróć dane użytkownika
    // Auto-confirm jest włączony, więc użytkownik jest od razu zalogowany
    // Cookies są automatycznie ustawione przez createSupabaseServerInstance
    return new Response(
      JSON.stringify({
        user: data.user,
        session: data.session,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Unexpected registration error:", err);
    return new Response(JSON.stringify({ error: "Wystąpił nieoczekiwany błąd" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// Disable prerendering dla tego endpointu (wymagane dla SSR)
export const prerender = false;
