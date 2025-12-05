import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client.ts";
import { loginSchema } from "../../../lib/validations/auth.validation.ts";

/**
 * Endpoint logowania użytkownika
 *
 * @endpoint POST /api/auth/login
 * @description
 * Obsługuje logowanie użytkownika przez Supabase Auth.
 * Tworzy per-request Supabase server client, weryfikuje dane logowania
 * i ustawia auth cookies w odpowiedzi.
 *
 * @remarks
 * Zgodnie ze specyfikacją auth-spec.md:
 * - Używa createSupabaseServerInstance dla zarządzania cookies
 * - Walidacja server-side (opcjonalna, gdyż client już waliduje)
 * - Zwraca błędy w formacie JSON z odpowiednim statusem HTTP
 *
 * ## Request Body
 * ```json
 * {
 *   "email": "user@example.com",
 *   "password": "password123"
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
 *   "error": "Invalid login credentials"
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

    // Opcjonalna walidacja server-side (client już waliduje, ale dla pewności)
    const validationResult = loginSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowe dane logowania",
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

    // Wywołaj Supabase Auth - signInWithPassword
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Obsługa błędu z Supabase Auth
    if (error) {
      console.error("Login error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Sukces - zwróć dane użytkownika
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
    console.error("Unexpected login error:", err);
    return new Response(JSON.stringify({ error: "Wystąpił nieoczekiwany błąd" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// Disable prerendering dla tego endpointu (wymagane dla SSR)
export const prerender = false;
