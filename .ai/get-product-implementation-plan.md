# API Endpoint Implementation Plan: GET Product by ID

## 1. Przegląd punktu końcowego

Endpoint GET `/api/products/{id}` służy do pobierania szczegółowych informacji o konkretnym produkcie na podstawie jego unikalnego identyfikatora (UUID). W fazie deweloperskiej endpoint używa mock user ID do filtrowania produktów.

**Kluczowe funkcjonalności:**
- Pobieranie danych pojedynczego produktu
- Walidacja formatu UUID
- Obsługa przypadków gdy produkt nie istnieje

## 2. Szczegóły żądania

### Metoda HTTP
`GET`

### Struktura URL
```
/api/products/{id}
```

### Parametry

#### Path Parameters (wymagane)
- **id** (string, UUID)
  - Opis: Unikalny identyfikator produktu
  - Format: UUID v4 (np. `550e8400-e29b-41d4-a716-446655440000`)
  - Walidacja: Musi być poprawnym UUID
  - Przykład: `/api/products/550e8400-e29b-41d4-a716-446655440000`

#### Query Parameters
Brak

#### Request Body
Nie dotyczy (metoda GET)

#### Headers
- `Content-Type: application/json` (dla odpowiedzi)

### Przykład żądania

```http
GET /api/products/550e8400-e29b-41d4-a716-446655440000 HTTP/1.1
Host: localhost:4321
```

## 3. Wykorzystywane typy

### Istniejące typy (src/types.ts)

```typescript
// Już zdefiniowany w projekcie
export interface ProductDTO {
  id: string;
  nazwa_produktu: string;
  kategoria_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}
```

### Nowe typy do dodania (src/types.ts)

```typescript
// DTO odpowiedzi dla pojedynczego produktu
export interface GetProductResponseDTO {
  product: ProductDTO;
}
```

### Nowe schematy walidacji (src/lib/validations/product.validation.ts)

```typescript
/**
 * Schemat walidacji dla parametru path 'id' w GET /api/products/{id}
 * Sprawdza poprawność formatu UUID
 */
export const getProductParamsSchema = z.object({
  id: z
    .string()
    .uuid('Nieprawidłowy format UUID dla parametru id'),
});

/**
 * Typ wejściowy dla parametrów GET produktu
 */
export type GetProductParamsInput = z.infer<typeof getProductParamsSchema>;
```

## 4. Szczegóły odpowiedzi

### Odpowiedź sukcesu (200 OK)

```json
{
  "product": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "nazwa_produktu": "Mleko 3.2%",
    "kategoria_id": "123e4567-e89b-12d3-a456-426614174000",
    "user_id": "00000000-0000-0000-0000-000000000001",
    "created_at": "2025-11-13T10:30:00.000Z",
    "updated_at": "2025-11-13T10:30:00.000Z"
  }
}
```

**Status Code:** 200 OK

**Kiedy:** Produkt został znaleziony w bazie danych

### Odpowiedzi błędów

#### 400 Bad Request - Nieprawidłowy format UUID

```json
{
  "error": "Błąd walidacji parametrów",
  "details": {
    "id": ["Nieprawidłowy format UUID dla parametru id"]
  }
}
```

**Kiedy:** Parametr `id` w URL nie jest poprawnym UUID

#### 404 Not Found - Produkt nie znaleziony

```json
{
  "error": "Produkt nie został znaleziony"
}
```

**Kiedy:** Produkt o podanym ID nie istnieje w bazie danych (dla mock user ID)

#### 500 Internal Server Error - Błąd serwera

```json
{
  "error": "Wystąpił błąd serwera podczas pobierania produktu"
}
```

**Kiedy:** Nieoczekiwane błędy bazy danych lub serwera

## 5. Przepływ danych

### Diagram przepływu

```
1. Klient → GET /api/products/{id}
   ↓
2. Astro API Route (src/pages/api/products/[id].ts)
   ↓
3. Walidacja parametru 'id' (Zod)
   ↓ [jeśli nieprawidłowy UUID]
   └→ 400 Bad Request
   ↓ [jeśli prawidłowy]
4. Użycie mock userId (development)
   ↓
5. ProductsService.getProductById(mockUserId, productId)
   ↓
6. Zapytanie do Supabase:
   SELECT * FROM produkty 
   WHERE id = {productId} AND user_id = {mockUserId}
   ↓
7. Sprawdzenie wyniku:
   ↓ [null/undefined]
   └→ 404 Not Found
   ↓ [produkt znaleziony]
8. Mapowanie do ProductDTO
   ↓
9. Zwrócenie odpowiedzi 200 OK z GetProductResponseDTO
   ↓
10. Klient ← JSON Response
```

### Interakcje z bazą danych

**Tabela:** `produkty`

**Zapytanie Supabase:**
```typescript
await this.supabase
  .from('produkty')
  .select('*')
  .eq('id', productId)
  .eq('user_id', mockUserId)
  .maybeSingle();
```

**Wyjaśnienie:**
- `.eq('id', productId)` - filtruje po ID produktu
- `.eq('user_id', mockUserId)` - filtruje po mock ID użytkownika (development)
- `.maybeSingle()` - zwraca pojedynczy rekord lub null (nie rzuca błędu gdy nie znaleziono)

**Zwracane pola:**
- id, nazwa_produktu, kategoria_id, user_id, created_at, updated_at

## 6. Względy bezpieczeństwa

### 6.1 Mock User w fazie developerskiej

**Implementacja:**
- Endpoint używa stałego mock user ID: `00000000-0000-0000-0000-000000000001`
- Wszystkie zapytania filtrują po tym mock user ID

**Kod:**
```typescript
const mockUserId = '00000000-0000-0000-0000-000000000001';
```

### 6.2 Walidacja danych wejściowych

**Parametr 'id':**
- Walidacja formatu UUID za pomocą Zod
- Zapobiega SQL injection (UUID jest bezpieczny)
- Zapobiega path traversal attacks

**Schemat Zod:**
```typescript
z.string().uuid('Nieprawidłowy format UUID dla parametru id')
```

### 6.3 Rate Limiting

**Rekomendacja (TODO):**
- Implementacja rate limiting na poziomie middleware
- Zapobieganie nadmiernemu użyciu API

### 6.4 Nagłówki bezpieczeństwa

**Rekomendowane nagłówki odpowiedzi:**
```typescript
{
  'Content-Type': 'application/json',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
}
```

## 7. Obsługa błędów

### 7.1 Hierarchia obsługi błędów

```
Try-Catch Level 1: API Route Handler
├─ Walidacja JSON/Request parsing
├─ Walidacja Zod
└─ Try-Catch Level 2: Service Layer
   ├─ Błędy bazy danych (Supabase)
   ├─ Błędy biznesowe (not found)
   └─ Unexpected errors
```

### 7.2 Szczegółowe scenariusze błędów

| Błąd | Kod HTTP | Komunikat | Obsługa |
|------|----------|-----------|---------|
| Nieprawidłowy format UUID | 400 | "Błąd walidacji parametrów" + szczegóły Zod | Walidacja Zod na poziomie route |
| Produkt nie znaleziony | 404 | "Produkt nie został znaleziony" | Sprawdzenie wyniku zapytania `.maybeSingle()` |
| Błąd Supabase | 500 | "Wystąpił błąd serwera podczas pobierania produktu" | Catch w service + console.error |
| Niespodziewane błędy | 500 | "Wystąpił błąd serwera podczas pobierania produktu" | Catch w API route + console.error |

### 7.3 Struktura logowania błędów

**Błędy 4xx (Client errors):**
- Logować na poziomie DEBUG (opcjonalnie)
- Nie logować do `ocr_error_logs` (to nie są błędy OCR)

**Błędy 5xx (Server errors):**
- Logować na poziomie ERROR do console
- Zawierać pełny stack trace
- Przykład: `console.error('Błąd podczas pobierania produktu:', error)`

**Nie logować:**
- Sukcesów (200 OK)
- Normalnych przypadków 404 (użytkownik po prostu podał błędny ID)

### 7.4 Przykłady obsługi błędów w kodzie

```typescript
// API Route Level
try {
  const params = { id: context.params.id };
  const validationResult = getProductParamsSchema.safeParse(params);
  
  if (!validationResult.success) {
    return new Response(JSON.stringify({
      error: 'Błąd walidacji parametrów',
      details: validationResult.error.flatten().fieldErrors,
    }), { status: 400 });
  }
  
  // Service call
  const product = await productsService.getProductById(userId, productId);
  
  if (!product) {
    return new Response(JSON.stringify({
      error: 'Produkt nie został znaleziony',
    }), { status: 404 });
  }
  
  // Success
  return new Response(JSON.stringify({ product }), { status: 200 });
  
} catch (error) {
  console.error('Błąd podczas pobierania produktu:', error);
  return new Response(JSON.stringify({
    error: 'Wystąpił błąd serwera podczas pobierania produktu',
  }), { status: 500 });
}
```

## 8. Rozważania dotyczące wydajności

### 8.1 Optymalizacje zapytań

**Indeksy bazodanowe:**
- ✅ Primary key na `produkty.id` (automatyczny)
- ✅ Index na `produkty.user_id` (już istnieje zgodnie z db-plan.md)
- Zapytanie `WHERE id = X AND user_id = Y` będzie wydajne

**Supabase Query:**
- Używamy `.maybeSingle()` zamiast `.select()` - optymalizacja dla pojedynczego rekordu
- Minimalizujemy liczbę roundtripów do bazy

### 8.2 Caching (TODO - przyszłość)

**Możliwości:**
- HTTP caching headers (Cache-Control, ETag)
- Redis cache dla często odczytywanych produktów
- W MVP: brak cachingu

**Przykładowe nagłówki:**
```typescript
{
  'Cache-Control': 'private, max-age=60', // 1 minuta cache
  'ETag': `"${product.id}-${product.updated_at}"`,
}
```

### 8.3 Potencjalne wąskie gardła

**Identyfikowane wąskie gardła:**
1. **Opóźnienie bazy danych:** Każde żądanie wymaga roundtrip do Supabase
   - Mitigation: Indeksy (już istnieją), connection pooling (Supabase zarządza)

2. **Brak cachingu:** Każde żądanie trafia do bazy
   - Mitigation: TODO - implementacja cachingu dla często odczytywanych produktów

3. **Enumeration attacks:** Próby zgadywania UUID produktów
   - Mitigation: Rate limiting (TODO), monitoring

**Benchmarki docelowe:**
- Czas odpowiedzi: < 100ms (p95)
- Throughput: > 100 req/s na instancję

### 8.4 Monitoring

**Metryki do śledzenia:**
- Czas odpowiedzi (latency)
- Liczba 404 errors (może wskazywać enumeration attack)
- Liczba 500 errors (błędy serwera)
- Wykorzystanie połączeń do bazy danych

## 9. Etapy wdrożenia

### Krok 1: Przygotowanie typów i walidacji

**Plik:** `src/types.ts`

**Akcja:** Dodać nowy typ DTO dla odpowiedzi

```typescript
// DTO odpowiedzi dla pojedynczego produktu
export interface GetProductResponseDTO {
  product: ProductDTO;
}
```

**Plik:** `src/lib/validations/product.validation.ts`

**Akcja:** Dodać schemat walidacji dla parametru path

```typescript
/**
 * Schemat walidacji dla parametru path 'id' w GET /api/products/{id}
 * Sprawdza poprawność formatu UUID
 */
export const getProductParamsSchema = z.object({
  id: z
    .string()
    .uuid('Nieprawidłowy format UUID dla parametru id'),
});

/**
 * Typ wejściowy dla parametrów GET produktu
 */
export type GetProductParamsInput = z.infer<typeof getProductParamsSchema>;
```

### Krok 2: Rozszerzenie ProductsService

**Plik:** `src/lib/services/products.service.ts`

**Akcja:** Dodać metodę `getProductById`

```typescript
/**
 * Pobiera produkt po ID dla konkretnego użytkownika
 * 
 * @param userId - ID użytkownika
 * @param productId - ID produktu do pobrania
 * @returns ProductDTO lub null jeśli nie znaleziono
 * @throws Error w przypadku błędów bazodanowych
 */
async getProductById(
  userId: string,
  productId: string
): Promise<ProductDTO | null> {
  // Zapytanie do bazy z filtrowaniem po user_id
  const { data: product, error } = await this.supabase
    .from('produkty')
    .select('*')
    .eq('id', productId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Supabase error in getProductById:', error);
    throw new Error(`Błąd podczas pobierania produktu: ${error.message}`);
  }

  // Jeśli produkt nie został znaleziony, zwróć null
  if (!product) {
    return null;
  }

  // Mapowanie wyniku do DTO
  return {
    id: product.id,
    nazwa_produktu: product.nazwa_produktu,
    kategoria_id: product.kategoria_id,
    user_id: product.user_id,
    created_at: product.created_at,
    updated_at: product.updated_at,
  };
}
```

**Uwagi implementacyjne:**
- Używamy `.maybeSingle()` zamiast `.single()` - nie rzuca błędu gdy brak wyników
- Filtrujemy po `user_id` (mock user w fazie developerskiej)
- Zwracamy `null` gdy produkt nie istnieje (zamiast rzucać błąd)

### Krok 3: Utworzenie pliku route dynamicznego

**Struktura katalogów:**
```
src/pages/api/products/
├── index.ts          (istniejący - GET list, POST create)
└── [id].ts           (NOWY - GET single)
```

**Plik:** `src/pages/api/products/[id].ts`

**Akcja:** Utworzyć nowy plik z handlerami dla dynamicznego route

```typescript
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
```

**Uwagi implementacyjne:**
- Wykorzystujemy Astro dynamic routes z `[id].ts`
- Parametr dostępny przez `params.id`
- Walidacja UUID przed przekazaniem do service
- Używamy stałego mock user ID w fazie deweloperskiej

### Krok 4: Testy jednostkowe (opcjonalnie)

**Plik:** `src/lib/services/__tests__/products.service.test.ts`

**Akcja:** Dodać testy dla nowej metody `getProductById`

```typescript
describe('ProductsService.getProductById', () => {
  it('should return product when exists for mock user', async () => {
    // Test implementation
  });

  it('should return null when product does not exist', async () => {
    // Test implementation
  });

  it('should throw error on database error', async () => {
    // Test implementation
  });

  it('should validate UUID format', async () => {
    // Test implementation
  });
});
```

### Krok 5: Testowanie manualne

**Scenariusze testowe:**

1. **✅ Happy path - pobranie istniejącego produktu**
   ```bash
   curl -X GET http://localhost:4321/api/products/550e8400-e29b-41d4-a716-446655440000
   # Oczekiwany: 200 OK + dane produktu
   ```

2. **❌ Nieprawidłowy UUID**
   ```bash
   curl -X GET http://localhost:4321/api/products/invalid-uuid
   # Oczekiwany: 400 Bad Request + błąd walidacji
   ```

3. **❌ Nieistniejący produkt**
   ```bash
   curl -X GET http://localhost:4321/api/products/00000000-0000-0000-0000-999999999999
   # Oczekiwany: 404 Not Found
   ```

4. **✅ Weryfikacja czasu odpowiedzi**
   ```bash
   curl -w "\nCzas: %{time_total}s\n" -X GET http://localhost:4321/api/products/{id}
   # Oczekiwany: < 100ms
   ```

### Krok 6: Dokumentacja

**Akcje:**
1. Zaktualizować dokumentację API (jeśli istnieje)
2. Dodać komentarze JSDoc do wszystkich nowych funkcji
3. Zaktualizować README.md z przykładami użycia

**Przykład wpisu w dokumentacji API:**

```markdown
### GET /api/products/{id}

Pobiera szczegóły pojedynczego produktu.

**Path Parameters:**
- `id` (UUID, required) - ID produktu

**Response 200 OK:**
\```json
{
  "product": {
    "id": "uuid",
    "nazwa_produktu": "string",
    "kategoria_id": "uuid",
    "user_id": "uuid",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}
\```

**Errors:**
- 400 - Nieprawidłowy format UUID
- 404 - Produkt nie znaleziony
- 500 - Błąd serwera
```

### Krok 7: Code review i deployment

**Checklist przed merge:**
- [ ] Kod jest zgodny z konwencjami projektu
- [ ] Wszystkie testy przechodzą
- [ ] Brak błędów linter (ESLint)
- [ ] JSDoc jest kompletny
- [ ] Mock user ID jest poprawnie użyty
- [ ] Obsługa błędów jest kompletna
- [ ] Testy manualne przeszły pomyślnie
- [ ] Dokumentacja jest zaktualizowana

**Deployment:**
1. Merge do branch `main`
2. Deploy na środowisko staging
3. Smoke tests na staging
4. Deploy na production

## 10. Dodatkowe uwagi

### 10.1 Przyszłe usprawnienia

**Krótkoterminowe (MVP+1):**
- [ ] Dodanie rate limiting
- [ ] Implementacja logów audytowych

**Długoterminowe:**
- [ ] Caching z Redis
- [ ] HTTP caching headers (ETag, Cache-Control)
- [ ] GraphQL jako alternatywa dla REST
- [ ] Rozszerzenie response o dane kategorii (join z tabelą kategorie)

### 10.2 Zależności między endpointami

**Endpointy zależne:**
- GET `/api/products` (lista) - korzysta z tego samego ProductsService
- POST `/api/products` (tworzenie) - może zwracać URL do nowo utworzonego produktu
- PUT `/api/products/{id}` (aktualizacja) - będzie używać podobnej logiki weryfikacji własności
- DELETE `/api/products/{id}` (usuwanie) - j.w.

**Współdzielone komponenty:**
- `ProductsService` - serwis z logiką biznesową
- `ProductDTO` - typ danych
- Walidacje UUID - możliwość ekstrakcji do helpers

### 10.3 Zgodność z wymaganiami projektu

**✅ Zgodność z tech stack:**
- Astro 5 - dynamic routes
- TypeScript 5 - pełne typowanie
- Supabase - klient z middleware

**✅ Zgodność z zasadami:**
- Early returns dla error handling
- Guard clauses na początku funkcji
- Wyodrębnienie logiki do service
- Walidacja Zod
- Proper error logging

**✅ Zgodność z bezpieczeństwem:**
- Mock user w fazie developerskiej
- Brak SQL injection (Supabase ORM)
- Walidacja wszystkich inputów

---

**Autor:** AI Assistant  
**Data utworzenia:** 2025-11-13  
**Wersja:** 1.0  
**Status:** Ready for implementation

