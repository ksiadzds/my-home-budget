// src/pages/api/products.ts
import type { APIRoute } from 'astro';
import { ProductsService } from '../../lib/services/products.service';
import { createProductSchema, listProductsQuerySchema } from '../../lib/validations/product.validation';

// Wyłączenie prerenderowania dla tego endpointu API
export const prerender = false;

/**
 * POST /api/products
 * Endpoint do tworzenia nowego produktu
 * 
 * Body: { nazwa_produktu: string, kategoria_id: uuid }
 * 
 * Zwraca:
 * - 201 Created - produkt został utworzony
 * - 400 Bad Request - błędne dane wejściowe lub duplikat
 * - 500 Internal Server Error - błąd serwera
 */
export const POST: APIRoute = async ({ request, locals }) => {
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

    // Parsowanie body żądania
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: 'Nieprawidłowy format JSON',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Walidacja danych wejściowych za pomocą Zod
    const validationResult = createProductSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Błąd walidacji danych wejściowych',
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

    const { nazwa_produktu, kategoria_id } = validationResult.data;

    // TODO: Po implementacji uwierzytelnienia, pobierz userId z sesji
    // Na razie używamy mock userId dla celów deweloperskich
    const mockUserId = '00000000-0000-0000-0000-000000000001';

    // Utworzenie instancji serwisu produktów
    const productsService = new ProductsService(supabase);

    // Utworzenie produktu
    try {
      const product = await productsService.createProduct(
        mockUserId,
        nazwa_produktu,
        kategoria_id
      );

      return new Response(
        JSON.stringify({
          message: 'Product created successfully',
          product,
        }),
        {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      // Obsługa błędów biznesowych (duplikaty, nieistniejąca kategoria)
      const errorMessage = error instanceof Error ? error.message : 'Nieznany błąd';

      // Sprawdzenie czy to błąd duplikatu lub nieistniejącej kategorii
      if (
        errorMessage.includes('już istnieje') ||
        errorMessage.includes('nie istnieje')
      ) {
        return new Response(
          JSON.stringify({
            error: errorMessage,
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }

      // W przypadku innych błędów, throw dalej
      throw error;
    }
  } catch (error) {
    // Obsługa nieoczekiwanych błędów serwera
    console.error('Błąd podczas tworzenia produktu:', error);

    return new Response(
      JSON.stringify({
        error: 'Wystąpił błąd serwera podczas tworzenia produktu',
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
 * GET /api/products
 * Endpoint do pobierania paginowanej listy produktów
 * 
 * Query params:
 * - page (number, optional, default: 1) - numer strony
 * - limit (number, optional, default: 20, max: 100) - liczba elementów na stronę
 * - filter (JSON string, optional) - filtr w formacie: {"category_id": "uuid"} lub {"product_name": "nazwa"}
 * - sort (string, optional) - sortowanie w formacie: "pole:kierunek" (np. "nazwa_produktu:asc")
 * 
 * Zwraca:
 * - 200 OK - lista produktów z metadanymi paginacji
 * - 400 Bad Request - błędne parametry zapytania
 * - 500 Internal Server Error - błąd serwera
 */
export const GET: APIRoute = async ({ request, locals }) => {
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

    // Parsowanie parametrów query z URL
    const url = new URL(request.url);
    const queryParams = {
      page: url.searchParams.get('page') || undefined,
      limit: url.searchParams.get('limit') || undefined,
      filter: url.searchParams.get('filter') || undefined,
      sort: url.searchParams.get('sort') || undefined,
    };

    // Walidacja parametrów query za pomocą Zod
    const validationResult = listProductsQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Błąd walidacji parametrów zapytania',
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

    const { page, limit, filter, sort } = validationResult.data;

    // TODO: Po implementacji uwierzytelnienia, pobierz userId z sesji
    // Na razie używamy mock userId dla celów deweloperskich
    const mockUserId = '00000000-0000-0000-0000-000000000001';

    // Utworzenie instancji serwisu produktów
    const productsService = new ProductsService(supabase);

    // Pobranie listy produktów
    try {
      // Przekształcenie filtra do JSON string jeśli istnieje
      const filterString = filter ? JSON.stringify(filter) : undefined;

      const result = await productsService.listProducts(
        mockUserId,
        page,
        limit,
        filterString,
        sort
      );

      return new Response(
        JSON.stringify(result),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      // Obsługa błędów biznesowych (parsowanie filtra, błędy zapytania)
      const errorMessage = error instanceof Error ? error.message : 'Nieznany błąd';

      // Sprawdzenie czy to błąd walidacji filtra
      if (errorMessage.includes('Nieprawidłowy format JSON')) {
        return new Response(
          JSON.stringify({
            error: errorMessage,
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }

      // W przypadku innych błędów, throw dalej
      throw error;
    }
  } catch (error) {
    // Obsługa nieoczekiwanych błędów serwera
    console.error('Błąd podczas pobierania produktów:', error);

    return new Response(
      JSON.stringify({
        error: 'Wystąpił błąd serwera podczas pobierania produktów',
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

