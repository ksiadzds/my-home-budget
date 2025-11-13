// src/pages/api/products/[id].ts
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { ProductsService } from '../../../lib/services/products.service';
import { 
  getProductParamsSchema, 
  updateProductSchema 
} from '../../../lib/validations/product.validation';

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

/**
 * PUT /api/products/{id}
 * Endpoint do aktualizacji szczegółów produktu
 *
 * Path params: id (UUID produktu)
 * Body: { nazwa_produktu: string, kategoria_id: string }
 *
 * Zwraca:
 * - 200 OK - produkt został zaktualizowany
 * - 400 Bad Request - nieprawidłowe dane wejściowe lub błąd walidacji biznesowej
 * - 404 Not Found - produkt nie istnieje
 * - 500 Internal Server Error - błąd serwera
 */
export const PUT: APIRoute = async ({ params, request, locals }) => {
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
    const paramsValidationResult = getProductParamsSchema.safeParse(params);

    if (!paramsValidationResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Błąd walidacji parametrów',
          details: paramsValidationResult.error.flatten().fieldErrors,
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const { id: productId } = paramsValidationResult.data;

    // Parsowanie i walidacja request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: 'Nieprawidłowy format JSON w body',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const bodyValidationResult = updateProductSchema.safeParse(requestBody);

    if (!bodyValidationResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Błąd walidacji danych',
          details: bodyValidationResult.error.flatten().fieldErrors,
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const { nazwa_produktu, kategoria_id } = bodyValidationResult.data;

    // Utworzenie instancji serwisu produktów
    const productsService = new ProductsService(supabase);

    // Aktualizacja produktu
    const updatedProduct = await productsService.updateProduct(
      productId,
      nazwa_produktu,
      kategoria_id
    );

    // Zwrócenie zaktualizowanego produktu
    return new Response(
      JSON.stringify({
        message: 'Product updated successfully',
        product: updatedProduct,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    // Obsługa błędów biznesowych z service
    if (error instanceof Error) {
      // 404 - Produkt nie znaleziony
      if (error.message.includes('nie został znaleziony')) {
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 404,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }

      // 400 - Błędy walidacji biznesowej
      if (
        error.message.includes('nie istnieje') ||
        error.message.includes('już istnieje')
      ) {
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }
    }

    // Ogólny błąd serwera
    console.error('Błąd podczas aktualizacji produktu:', error);

    return new Response(
      JSON.stringify({
        error: 'Wystąpił błąd serwera podczas aktualizacji produktu',
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
