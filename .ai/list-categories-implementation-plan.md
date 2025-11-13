# API Endpoint Implementation Plan: List Categories

## 1. Przegląd punktu końcowego

Endpoint służy do pobierania wszystkich predefiniowanych kategorii produktów z bazy danych. Kategorie są statyczne i zostały zaseedowane podczas migracji bazy danych. Jest to prosty endpoint tylko do odczytu, który nie wymaga żadnych parametrów wejściowych i zwraca pełną listę dostępnych kategorii.

**Uwaga:** W początkowej fazie developmentu pomijamy autoryzację użytkownika.

## 2. Szczegóły żądania

- **Metoda HTTP:** GET
- **Struktura URL:** `/api/categories`
- **Parametry:**
  - **Wymagane:** Brak
  - **Opcjonalne:** Brak
  - **Query Parameters:** Brak
  - **Path Parameters:** Brak
- **Request Body:** Nie dotyczy (GET request)
- **Headers:** Brak wymaganych headerów (autoryzacja pomijana w fazie dev)

## 3. Wykorzystywane typy

### CategoryDTO
Zdefiniowany w `src/types.ts`:

```typescript
export interface CategoryDTO {
  id: string;
  nazwa_kategorii: string;
}
```

### Response Type
```typescript
{
  categories: CategoryDTO[]
}
```

## 4. Szczegóły odpowiedzi

### Sukces (200 OK)
```json
{
  "categories": [
    {
      "id": "uuid-1",
      "nazwa_kategorii": "Alkohol i używki"
    },
    {
      "id": "uuid-2",
      "nazwa_kategorii": "Kosmetyki i przybory toaletowe"
    },
    {
      "id": "uuid-3",
      "nazwa_kategorii": "Napoje"
    }
  ]
}
```

### Błąd serwera (500 Internal Server Error)
```json
{
  "error": "Internal server error",
  "message": "Wystąpił błąd podczas pobierania kategorii"
}
```

**Kody statusu HTTP:**
- `200 OK` - Pomyślne pobranie listy kategorii
- `500 Internal Server Error` - Błąd bazy danych lub inny błąd serwera

## 5. Przepływ danych

```
1. Klient → GET /api/categories
   ↓
2. Astro API Route Handler (src/pages/api/categories.ts)
   - Odbiera żądanie
   - Pobiera klienta Supabase z context.locals
   ↓
3. Categories Service (src/lib/services/categories.service.ts)
   - Wywołuje listCategories(supabase)
   - Wykonuje SELECT na tabeli "kategorie"
   - Mapuje wyniki do CategoryDTO[]
   ↓
4. Supabase Database
   - Query: SELECT id, nazwa_kategorii FROM kategorie ORDER BY nazwa_kategorii ASC
   - Zwraca wszystkie rekordy
   ↓
5. API Route Handler
   - Otrzymuje dane z service
   - Tworzy obiekt response: { categories: CategoryDTO[] }
   - Zwraca JSON z kodem 200
   ↓
6. Klient ← Odpowiedź JSON
```

### Interakcje z bazą danych

**Tabela:** `kategorie`

**Query:**
```sql
SELECT id, nazwa_kategorii 
FROM kategorie 
ORDER BY nazwa_kategorii ASC
```

**Oczekiwana liczba rekordów:** 10 (predefiniowane kategorie)

## 6. Względy bezpieczeństwa

### Faza deweloperska (obecna)
- ❌ Brak autoryzacji użytkownika (pominięta celowo)
- ❌ Brak sprawdzania tokenu JWT
- ✅ Kategorie są danymi publicznymi (nie zawierają wrażliwych informacji)
- ✅ Endpoint tylko do odczytu (brak możliwości modyfikacji danych)
- ✅ Supabase SDK zabezpiecza przed SQL Injection

### Faza produkcyjna (przyszłość)
- ⚠️ Należy dodać middleware sprawdzające autentykację użytkownika
- ⚠️ Należy zwracać 401 Unauthorized dla nieautoryzowanych żądań
- ⚠️ Rozważyć rate limiting dla ochrony przed nadużyciami

### Wytyczne bezpieczeństwa
1. **Nie ujawniaj szczegółów błędów:** W przypadku błędu bazy danych, loguj szczegóły do konsoli, ale zwracaj ogólny komunikat klientowi
2. **Validacja danych wyjściowych:** Upewnij się, że wszystkie zwracane dane odpowiadają schematowi CategoryDTO
3. **CORS:** Skonfiguruj odpowiednie nagłówki CORS jeśli frontend jest na innej domenie

## 7. Obsługa błędów

### Potencjalne błędy i ich obsługa

| Scenariusz | HTTP Status | Response | Akcja |
|------------|-------------|----------|-------|
| Sukces - kategorie znalezione | 200 | `{ categories: [...] }` | Zwróć dane |
| Sukces - brak kategorii w bazie | 200 | `{ categories: [] }` | Zwróć pustą tablicę |
| Błąd połączenia z bazą danych | 500 | `{ error: "...", message: "..." }` | Loguj błąd, zwróć ogólny komunikat |
| Błąd podczas wykonywania query | 500 | `{ error: "...", message: "..." }` | Loguj błąd, zwróć ogólny komunikat |
| Błąd Supabase client | 500 | `{ error: "...", message: "..." }` | Loguj błąd, zwróć ogólny komunikat |

### Strategia logowania błędów

1. **Console logging:** Wszystkie błędy logować do konsoli serwera z pełnymi szczegółami
2. **Format loga:**
   ```typescript
   console.error('[Categories API] Error:', {
     endpoint: '/api/categories',
     error: error.message,
     stack: error.stack,
     timestamp: new Date().toISOString()
   });
   ```
3. **Nie używamy tabeli ocr_error_logs** (endpoint nie związany z OCR)

### Error handling pattern

```typescript
try {
  // Logika biznesowa
} catch (error) {
  console.error('[Categories API] Error:', error);
  return new Response(
    JSON.stringify({
      error: 'Internal server error',
      message: 'Wystąpił błąd podczas pobierania kategorii'
    }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  );
}
```

## 8. Rozważania dotyczące wydajności

### Optymalizacje
1. **Caching:**
   - Kategorie są statyczne i rzadko się zmieniają
   - Można rozważyć cache in-memory lub Redis cache
   - Cache invalidation tylko po modyfikacji kategorii (co jest mało prawdopodobne)

2. **Database indexing:**
   - Tabela `kategorie` jest mała (10 rekordów)
   - Indeks na `nazwa_kategorii` może przyspieszyć sortowanie, ale nie jest krytyczny

3. **Query optimization:**
   - Prosty SELECT bez JOIN - bardzo wydajny
   - Sortowanie alfabetyczne po stronie bazy danych

4. **Response size:**
   - Bardzo mały payload (~500 bytes)
   - Brak potrzeby paginacji (zawsze 10 kategorii)

### Wąskie gardła
- **Brak znaczących wąskich gardeł** przy obecnej skali
- W przyszłości: rozważyć CDN caching dla statycznych danych kategorii

### Metryki do monitorowania
- Czas odpowiedzi endpoint (target: < 100ms)
- Liczba błędów 500 (target: 0%)
- Liczba zapytań na minutę

## 9. Etapy wdrożenia

### Krok 1: Utworzenie Categories Service
**Plik:** `src/lib/services/categories.service.ts`

Zaimplementuj service z metodą `listCategories`:

```typescript
import type { SupabaseClient } from '@/db/supabase.client';
import type { CategoryDTO } from '@/types';

export class CategoriesService {
  /**
   * Pobiera wszystkie kategorie z bazy danych
   * @param supabase - Klient Supabase
   * @returns Promise z tablicą CategoryDTO
   * @throws Error jeśli wystąpi błąd bazy danych
   */
  static async listCategories(supabase: SupabaseClient): Promise<CategoryDTO[]> {
    const { data, error } = await supabase
      .from('kategorie')
      .select('id, nazwa_kategorii')
      .order('nazwa_kategorii', { ascending: true });

    if (error) {
      console.error('[CategoriesService] Database error:', error);
      throw new Error('Failed to fetch categories from database');
    }

    return data || [];
  }
}
```

**Testowanie:**
- Sprawdź czy metoda zwraca tablicę CategoryDTO
- Sprawdź sortowanie alfabetyczne
- Sprawdź obsługę błędów bazy danych

---

### Krok 2: Utworzenie API Route Handler
**Plik:** `src/pages/api/categories.ts`

Zaimplementuj handler dla GET request:

```typescript
import type { APIRoute } from 'astro';
import { CategoriesService } from '@/lib/services/categories.service';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
    const supabase = locals.supabase;

    // Pobierz kategorie przez service
    const categories = await CategoriesService.listCategories(supabase);

    // Zwróć odpowiedź
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
    console.error('[Categories API] Error:', {
      endpoint: '/api/categories',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });

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
```

**Kluczowe elementy:**
- `export const prerender = false` - wymuszenie SSR
- Użycie `locals.supabase` zamiast importowania klienta bezpośrednio
- Obsługa błędów z try-catch
- Odpowiednie kody statusu HTTP
- Logowanie błędów do konsoli

---

### Krok 3: Testowanie manualne
1. **Uruchom lokalny serwer Supabase:**
   ```bash
   npx supabase start
   ```

2. **Uruchom dev server Astro:**
   ```bash
   npm run dev
   ```

3. **Testuj endpoint używając curl:**
   ```bash
   # Test podstawowy
   curl -X GET http://localhost:4321/api/categories
   
   # Test z pretty print
   curl -X GET http://localhost:4321/api/categories | jq
   ```

4. **Testuj w przeglądarce:**
   - Otwórz: http://localhost:4321/api/categories
   - Sprawdź czy zwraca JSON z listą kategorii

5. **Oczekiwany wynik:**
   ```json
   {
     "categories": [
       { "id": "...", "nazwa_kategorii": "Alkohol i używki" },
       { "id": "...", "nazwa_kategorii": "Kosmetyki i przybory toaletowe" },
       { "id": "...", "nazwa_kategorii": "Napoje" },
       { "id": "...", "nazwa_kategorii": "Pozostałe" },
       { "id": "...", "nazwa_kategorii": "Rozrywka" },
       { "id": "...", "nazwa_kategorii": "Słodycze i przekąski" },
       { "id": "...", "nazwa_kategorii": "Suplemencja" },
       { "id": "...", "nazwa_kategorii": "Środki czystości" },
       { "id": "...", "nazwa_kategorii": "Ubranie i obuwie" },
       { "id": "...", "nazwa_kategorii": "Zakupy spożywcze" }
     ]
   }
   ```

---

### Krok 4: Testowanie automatyczne (opcjonalne)
**Plik:** `src/lib/services/__tests__/categories.service.test.ts`

Utwórz testy jednostkowe dla service:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { CategoriesService } from '../categories.service';

describe('CategoriesService', () => {
  describe('listCategories', () => {
    it('should return list of categories sorted alphabetically', async () => {
      // Mock Supabase client
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [
                { id: '1', nazwa_kategorii: 'Alkohol i używki' },
                { id: '2', nazwa_kategorii: 'Napoje' },
              ],
              error: null,
            }),
          }),
        }),
      };

      const result = await CategoriesService.listCategories(mockSupabase as any);

      expect(result).toHaveLength(2);
      expect(result[0].nazwa_kategorii).toBe('Alkohol i używki');
    });

    it('should throw error when database query fails', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      };

      await expect(
        CategoriesService.listCategories(mockSupabase as any)
      ).rejects.toThrow('Failed to fetch categories from database');
    });
  });
});
```

**Uruchomienie testów:**
```bash
npm run test
```

---

### Krok 5: Weryfikacja z lintera
```bash
npm run lint
```

Napraw wszystkie błędy i ostrzeżenia zgodnie z konfiguracją ESLint projektu.

---

### Krok 6: Dokumentacja (opcjonalna)
Zaktualizuj dokumentację API jeśli taka istnieje, dodając informacje o nowym endpointcie:
- Ścieżka URL
- Metoda HTTP
- Przykładowa odpowiedź
- Kody statusu

---

## 10. Checklist przed deployment

- [ ] Service został utworzony i implementuje logikę biznesową
- [ ] API route handler został utworzony z odpowiednią obsługą błędów
- [ ] Testowanie manualne przeszło pomyślnie
- [ ] Endpoint zwraca poprawny format JSON zgodny z CategoryDTO
- [ ] Sortowanie alfabetyczne działa poprawnie
- [ ] Błędy są logowane do konsoli
- [ ] Linter nie zgłasza błędów
- [ ] Kod jest zgodny z zasadami clean code projektu
- [ ] (Opcjonalne) Testy automatyczne przechodzą
- [ ] (Opcjonalne) Dokumentacja została zaktualizowana

---

## 11. Przyszłe ulepszenia

Po zakończeniu fazy MVP, rozważ następujące ulepszenia:

1. **Autoryzacja:**
   - Dodaj middleware sprawdzające JWT token
   - Zwracaj 401 dla nieautoryzowanych żądań

2. **Caching:**
   - Implementuj cache in-memory lub Redis
   - Ustaw odpowiednie nagłówki cache (Cache-Control, ETag)

3. **Rate limiting:**
   - Ogranicz liczbę zapytań na użytkownika/IP

4. **Monitoring:**
   - Dodaj metryki wydajności
   - Integracja z narzędziami monitoring (np. Sentry)

5. **Internationalization:**
   - Dodaj wsparcie dla wielojęzyczności kategorii
   - Parametr query `lang` dla wyboru języka

6. **API versioning:**
   - Rozważ wersjonowanie API (np. `/api/v1/categories`)

