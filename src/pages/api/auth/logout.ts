import type { APIRoute } from 'astro';
import { createSupabaseServerInstance } from '../../../db/supabase.client.ts';

/**
 * Endpoint wylogowania użytkownika
 * 
 * @endpoint POST /api/auth/logout
 * @description
 * Obsługuje wylogowanie użytkownika przez Supabase Auth.
 * Tworzy per-request Supabase server client, usuwa sesję
 * i czyści auth cookies.
 * 
 * @remarks
 * Zgodnie ze specyfikacją auth-spec.md:
 * - Wywołuje signOut() na Supabase Auth
 * - Automatycznie czyści auth cookies (przez createSupabaseServerInstance)
 * - Po sukcesie klient powinien wykonać redirect do /auth/login
 * 
 * ## Request Body
 * Brak (może być puste)
 * 
 * ## Response - Success (200)
 * ```json
 * null
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
export const POST: APIRoute = async ({ cookies, request }) => {
  try {
    // Utwórz per-request Supabase server instance
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Wywołaj Supabase Auth - signOut
    const { error } = await supabase.auth.signOut();

    // Obsługa błędu z Supabase Auth
    if (error) {
      console.error('Logout error:', error);
      return new Response(
        JSON.stringify({ error: error.message }), 
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Sukces - zwróć pustą odpowiedź
    // Cookies są automatycznie wyczyszczone przez createSupabaseServerInstance
    return new Response(null, { 
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Unexpected logout error:', err);
    return new Response(
      JSON.stringify({ error: 'Wystąpił nieoczekiwany błąd' }), 
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// Disable prerendering dla tego endpointu (wymagane dla SSR)
export const prerender = false;

