import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient as SupabaseClientType } from "@supabase/supabase-js";
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import type { AstroCookies } from "astro";

import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

/**
 * Supabase client (legacy) - używany dla operacji bez wymaganej sesji
 * @deprecated Preferuj createSupabaseServerInstance dla operacji wymagających auth
 */
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Export type for use in services
export type SupabaseClient = SupabaseClientType<Database>;

/**
 * Opcje cookies dla Supabase Auth
 *
 * @description
 * Konfiguracja bezpiecznych cookies zgodna z best practices:
 * - httpOnly: true - zapobiega dostępowi z JavaScript
 * - secure: true - wymaga HTTPS (dev: Astro używa HTTP, ale Supabase SSR obsługuje to)
 * - sameSite: 'lax' - chroni przed CSRF
 */
export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: true,
  httpOnly: true,
  sameSite: "lax",
};

/**
 * Parsuje nagłówek Cookie na tablicę obiektów {name, value}
 *
 * @param cookieHeader - Nagłówek Cookie z request.headers
 * @returns Tablica obiektów z nazwami i wartościami cookies
 */
function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  return cookieHeader.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });
}

/**
 * Tworzy per-request Supabase Server Client dla Astro SSR
 *
 * @description
 * WAŻNE: Używaj TYLKO tej funkcji w middleware i API endpoints.
 * Funkcja implementuje wymagane przez @supabase/ssr metody getAll() i setAll()
 * dla zarządzania cookies w środowisku Astro.
 *
 * NIE używaj pojedynczych metod get(), set(), remove() - są niezgodne z @supabase/ssr
 *
 * @param context - Kontekst Astro z headers i cookies
 * @returns Server client Supabase z obsługą auth cookies
 *
 * @example
 * ```typescript
 * // W middleware
 * const supabase = createSupabaseServerInstance({
 *   cookies,
 *   headers: request.headers,
 * });
 * const { data: { user } } = await supabase.auth.getUser();
 * ```
 */
export const createSupabaseServerInstance = (context: { headers: Headers; cookies: AstroCookies }) => {
  const supabase = createServerClient<Database>(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_KEY, {
    cookieOptions,
    cookies: {
      getAll() {
        return parseCookieHeader(context.headers.get("Cookie") ?? "");
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptionsWithName }[]) {
        cookiesToSet.forEach(({ name, value, options }) => context.cookies.set(name, value, options));
      },
    },
  });

  return supabase;
};
