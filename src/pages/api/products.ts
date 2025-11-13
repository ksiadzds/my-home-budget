// src/pages/api/products.ts
import type { APIRoute } from 'astro';
import { ProductsService } from '../../lib/services/products.service';
import { createProductSchema } from '../../lib/validations/product.validation';

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

