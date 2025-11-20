// src/pages/api/receipts/process.ts
import type { APIRoute } from 'astro';
import { receiptFileSchema } from '../../../lib/validations/receipt.validation';

// Wyłączenie prerenderowania dla tego endpointu API
export const prerender = false;

/**
 * POST /api/receipts/process
 * Endpoint do przesyłania i przetwarzania obrazu paragonu
 * 
 * Request: multipart/form-data
 * - receipt (File) - obraz paragonu (JPEG, PNG, WEBP, max 10MB)
 * 
 * Response:
 * - 200 OK - paragon został przetworzony pomyślnie
 * - 400 Bad Request - błędne dane wejściowe (brak pliku, niewłaściwy format)
 * - 401 Unauthorized - użytkownik nie jest zalogowany
 * - 500 Internal Server Error - błąd serwera lub przetwarzania OCR
 * 
 * Response body (ReceiptProcessingResponseDTO):
 * {
 *   message: string,
 *   matched_products: MatchedProductDTO[],
 *   unmatched_products: UnmatchedProductDTO[],
 *   summary: {
 *     by_category: Array<{ category: CategoryDTO, total_expense: number, items_count: number }>,
 *     total: number
 *   }
 * }
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

    // Sprawdzenie Content-Type - musi być multipart/form-data
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return new Response(
        JSON.stringify({
          error: 'Nieprawidłowy Content-Type',
          message: 'Endpoint wymaga multipart/form-data',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Parsowanie formData z żądania
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: 'Błąd parsowania danych',
          message: 'Nie udało się sparsować formData',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Pobranie pliku z formData
    const receiptFile = formData.get('receipt');

    // Sprawdzenie czy plik został przesłany
    if (!receiptFile) {
      return new Response(
        JSON.stringify({
          error: 'Brak pliku',
          message: 'Plik paragonu jest wymagany',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Walidacja pliku za pomocą Zod
    const validationResult = receiptFileSchema.safeParse({
      receipt: receiptFile,
    });

    if (!validationResult.success) {
      const errors = validationResult.error.flatten();
      return new Response(
        JSON.stringify({
          error: 'Błąd walidacji pliku',
          message: errors.formErrors[0] || 'Nieprawidłowy plik',
          details: errors.fieldErrors,
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const { receipt } = validationResult.data;

    // TODO: Po implementacji uwierzytelnienia, pobierz userId z sesji
    // Na razie używamy mock userId dla celów deweloperskich
    const mockUserId = '00000000-0000-0000-0000-000000000001';

    // Logowanie informacji o pliku dla celów debugowania
    console.log('[Receipts API] File uploaded:', {
      name: receipt.name,
      type: receipt.type,
      size: receipt.size,
      userId: mockUserId,
      timestamp: new Date().toISOString(),
    });

    // TODO: Implementacja logiki biznesowej w kolejnych iteracjach:
    // 4. Integracja z serwisem OCR (receipts.service.ts)
    // 5. Logika dopasowywania produktów do bazy danych
    // 6. Agregacja i generowanie podsumowania wydatków
    // 7. Obsługa błędów i logowanie do ocr_error_logs

    // Zwracamy domyślny response zgodny z ReceiptProcessingResponseDTO
    // Na razie bez faktycznego przetwarzania OCR
    return new Response(
      JSON.stringify({
        message: 'Paragon został załadowany pomyślnie. Przetwarzanie OCR będzie dodane w przyszłości.',
        matched_products: [],
        unmatched_products: [],
        summary: {
          by_category: [],
          total: 0,
        },
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
    console.error('[Receipts API] Error:', {
      endpoint: '/api/receipts/process',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'Wystąpił błąd serwera podczas przetwarzania paragonu',
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

