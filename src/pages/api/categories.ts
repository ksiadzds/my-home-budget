// src/pages/api/categories.ts
import type { APIRoute } from 'astro';
import { CategoriesService } from '@/lib/services/categories.service';

// Wyłączenie prerenderowania dla tego endpointu API
export const prerender = false;

/**
 * GET /api/categories
 * Endpoint do pobierania wszystkich predefiniowanych kategorii produktów
 * 
 * Parametry: Brak
 * 
 * Zwraca:
 * - 200 OK - lista kategorii została pobrana pomyślnie
 * - 500 Internal Server Error - błąd serwera podczas pobierania kategorii
 * 
 * Response body:
 * {
 *   categories: CategoryDTO[]
 * }
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    // Pobranie klienta Supabase z kontekstu middleware
    const supabase = locals.supabase;

    // Pobierz kategorie przez service
    const categories = await CategoriesService.listCategories(supabase);

    // Zwróć odpowiedź z listą kategorii
    return new Response(
      JSON.stringify({ categories }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    // Logowanie błędu do konsoli serwera
    console.error('[Categories API] Error:', {
      endpoint: '/api/categories',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    // Zwróć odpowiedź z błędem 500
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'Wystąpił błąd podczas pobierania kategorii',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};

