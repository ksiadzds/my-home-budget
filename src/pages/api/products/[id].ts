// src/pages/api/products/[id].ts
import type { APIRoute } from 'astro';
import { ProductsService } from '../../../lib/services/products.service';
import { getProductParamsSchema } from '../../../lib/validations/product.validation';

// Wyłączenie prerenderowania dla tego endpointu API
export const prerender = false;

/**
 * GET /api/products/{id}
 * Endpoint do pobierania szczegółów pojedynczego produktu
 *
 * Path params: id (UUID produktu)
 *
 * Zwraca:
 * - 200 OK - produkt został znaleziony
 * - 400 Bad Request - nieprawidłowy format UUID
 * - 404 Not Found - produkt nie istnieje lub należy do innego użytkownika
 * - 500 Internal Server Error - błąd serwera
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Pobranie klienta Supabase z kontekstu middleware
    const supabase = locals.supabase;

    if (!supabase) {
      return new Response(
        JSON.stringify({
          error: 'Supabase client not available',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Walidacja parametru path 'id' za pomocą Zod
    const validationResult = getProductParamsSchema.safeParse(params);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Błąd walidacji parametrów',
          details: validationResult.error.flatten().fieldErrors,
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const { id: productId } = validationResult.data;

    // Mock user ID dla fazy deweloperskiej
    const mockUserId = '00000000-0000-0000-0000-000000000001';

    // Utworzenie instancji serwisu produktów
    const productsService = new ProductsService(supabase);

    // Pobranie produktu
    const product = await productsService.getProductById(mockUserId, productId);

    // Jeśli produkt nie został znaleziony
    if (!product) {
      return new Response(
        JSON.stringify({
          error: 'Produkt nie został znaleziony',
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Zwrócenie znalezionego produktu
    return new Response(
      JSON.stringify({
        product,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    // Obsługa nieoczekiwanych błędów serwera
    console.error('Błąd podczas pobierania produktu:', error);

    return new Response(
      JSON.stringify({
        error: 'Wystąpił błąd serwera podczas pobierania produktu',
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
