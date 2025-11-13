# API Endpoint Implementation Plan: Update Product

## 1. Przegląd punktu końcowego

Endpoint **PUT /api/products/{id}** umożliwia aktualizację szczegółów produktu (nazwy produktu i/lub przypisanej kategorii). Jest to operacja CRUD służąca do modyfikacji istniejącego produktu.

**Cel:**
- Aktualizacja nazwy produktu
- Zmiana przypisanej kategorii produktu
- Walidacja i wymuszanie reguł biznesowych (unikalność nazwy, istnienie kategorii)

**Ograniczenia developmentowe:**
- ⚠️ **Pomijamy autoryzację** - endpoint nie wymaga tokenu JWT
- ⚠️ **Brak sprawdzania user_id** - aktualizacja możliwa dla wszystkich produktów w bazie
- ⚠️ **Konfiguracja tylko dla środowiska deweloperskiego**

## 2. Szczegóły żądania

### Metoda HTTP
**PUT**

### Struktura URL
```
/api/products/{id}
```

### Path Parameters

| Parametr | Typ | Wymagany | Opis | Walidacja |
|----------|-----|----------|------|-----------|
| `id` | string (UUID) | Tak | Identyfikator produktu do aktualizacji | Format UUID |

### Request Headers

**Na potrzeby developmentu pomijamy:**
- ~~`Authorization: Bearer <token>`~~ (nie wymagane)

**Content-Type (wymagane):**
- `Content-Type: application/json`

### Request Body

```json
{
  "nazwa_produktu": "string",
  "kategoria_id": "uuid"
}
```

| Pole | Typ | Wymagany | Ograniczenia | Opis |
|------|-----|----------|--------------|------|
| `nazwa_produktu` | string | Tak | 1-255 znaków, trim | Nowa nazwa produktu |
| `kategoria_id` | string (UUID) | Tak | Format UUID, musi istnieć w tabeli kategorie | ID kategorii do przypisania |

### Przykład żądania

```bash
curl -X PUT http://localhost:4321/api/products/123e4567-e89b-12d3-a456-426614174000 \
  -H "Content-Type: application/json" \
  -d '{
    "nazwa_produktu": "Mleko 3.2%",
    "kategoria_id": "789e4567-e89b-12d3-a456-426614174999"
  }'
```

## 3. Wykorzystywane typy

### Typy z `src/types.ts`

**UpdateProductCommand** (Command Model)
```typescript
export type UpdateProductCommand = CreateProductCommand;

// Gdzie CreateProductCommand to:
export type CreateProductCommand = Omit<ProductDTO, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

// Efektywnie:
{
  nazwa_produktu: string;
  kategoria_id: string;
}
```

**ProductDTO** (Response)
```typescript
export interface ProductDTO {
  id: string;
  nazwa_produktu: string;
  kategoria_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}
```

### Nowe schematy walidacji

**Schemat dla Request Body** (`src/lib/validations/product.validation.ts`)
```typescript
export const updateProductSchema = z.object({
  nazwa_produktu: z
    .string()
    .min(1, 'Nazwa produktu nie może być pusta')
    .max(255, 'Nazwa produktu nie może przekraczać 255 znaków')
    .trim(),
  kategoria_id: z
    .string()
    .uuid('Nieprawidłowy format UUID dla kategoria_id'),
});

export type UpdateProductInput = z.infer<typeof updateProductSchema>;
```

**Schemat dla Path Parameters** (już istnieje)
```typescript
export const getProductParamsSchema = z.object({
  id: z
    .string()
    .uuid('Nieprawidłowy format UUID dla parametru id'),
});
```

### Typy odpowiedzi

**Sukces (200 OK)**
```typescript
{
  message: string;
  product: ProductDTO;
}
```

**Błąd (400/404/500)**
```typescript
{
  error: string;
  details?: unknown; // Opcjonalne szczegóły walidacji
}
```

## 4. Szczegóły odpowiedzi

### Odpowiedź sukcesu (200 OK)

```json
{
  "message": "Product updated successfully",
  "product": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "nazwa_produktu": "Mleko 3.2%",
    "kategoria_id": "789e4567-e89b-12d3-a456-426614174999",
    "user_id": "456e4567-e89b-12d3-a456-426614174111",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-20T14:45:00.000Z"
  }
}
```

### Kody stanu HTTP

| Kod | Scenariusz | Response Body |
|-----|-----------|---------------|
| 200 | Produkt zaktualizowany pomyślnie | `{ message, product }` |
| 400 | Nieprawidłowe dane wejściowe (walidacja) | `{ error, details }` |
| 400 | Kategoria nie istnieje | `{ error: "Kategoria nie istnieje" }` |
| 400 | Naruszenie constraint unikalności | `{ error: "Produkt o takiej nazwie już istnieje" }` |
| 404 | Produkt nie został znaleziony | `{ error: "Produkt nie został znaleziony" }` |
| 500 | Błąd serwera/bazy danych | `{ error: "Internal server error" }` |

## 5. Przepływ danych

### Diagram przepływu

```
1. Request: PUT /api/products/{id}
   ↓
2. Walidacja Path Parameters (id jako UUID)
   ↓
3. Walidacja Request Body (nazwa_produktu, kategoria_id)
   ↓
4. Wywołanie ProductsService.updateProduct()
   ↓
5. [Service] Sprawdzenie czy kategoria istnieje
   ↓ (błąd: 400 - Kategoria nie istnieje)
   ↓
6. [Service] Pobranie istniejącego produktu po ID
   ↓ (błąd: 404 - Produkt nie znaleziony)
   ↓
7. [Service] Sprawdzenie unikalności nazwy (user_id, nazwa_produktu)
   ↓ (błąd: 400 - Produkt o takiej nazwie już istnieje)
   ↓
8. [Service] Aktualizacja produktu w bazie (UPDATE)
   ↓
9. [Service] Zwrócenie zaktualizowanego ProductDTO
   ↓
10. Response: 200 OK + { message, product }
```

### Interakcje z bazą danych

**1. Sprawdzenie istnienia kategorii**
```sql
SELECT id FROM kategorie WHERE id = $1 LIMIT 1
```

**2. Pobranie produktu do aktualizacji**
```sql
SELECT * FROM produkty WHERE id = $1 LIMIT 1
```

**3. Sprawdzenie unikalności nazwy** (tylko jeśli nazwa się zmieniła)
```sql
SELECT id FROM produkty 
WHERE user_id = $1 
  AND nazwa_produktu = $2 
  AND id != $3 
LIMIT 1
```

**4. Aktualizacja produktu**
```sql
UPDATE produkty 
SET nazwa_produktu = $1, 
    kategoria_id = $2, 
    updated_at = NOW() 
WHERE id = $3 
RETURNING *
```

### Warunki brzegowe

| Warunek | Obsługa |
|---------|---------|
| Produkt nie istnieje | Zwróć 404 z odpowiednim komunikatem |
| Kategoria nie istnieje | Zwróć 400 z komunikatem o nieistniejącej kategorii |
| Duplikat nazwy dla user_id | Zwróć 400 z komunikatem o naruszeniu unikalności |
| Nazwa nie uległa zmianie | Aktualizuj tylko kategoria_id |
| Kategoria nie uległa zmianie | Aktualizuj tylko nazwa_produktu |
| Oba pola bez zmian | Aktualizuj updated_at i zwróć produkt |

## 6. Względy bezpieczeństwa

### ⚠️ UWAGA: Konfiguracja deweloperska

**Obecne uproszczenia:**
- Brak wymogu tokenu JWT
- Brak sprawdzania user_id
- Każdy może aktualizować dowolny produkt

**Przed wdrożeniem produkcyjnym wymagane:**
1. Włączenie autoryzacji JWT
2. Weryfikacja user_id z tokenu
3. Row Level Security (RLS) w Supabase
4. Rate limiting
5. CORS restrictions

### Implementowana walidacja

**1. Walidacja danych wejściowych (Zod)**
- Sprawdzenie formatu UUID dla path parameter `id`
- Sprawdzenie długości i typu dla `nazwa_produktu`
- Sprawdzenie formatu UUID dla `kategoria_id`
- Automatyczny trim dla `nazwa_produktu`

**2. Walidacja biznesowa**
- Sprawdzenie istnienia kategorii w bazie
- Sprawdzenie istnienia produktu w bazie
- Wymuszenie constraint UNIQUE (user_id, nazwa_produktu)

**3. Ochrona przed błędami**
- Obsługa błędów bazy danych
- Walidacja typu i struktury danych
- Używanie prepared statements (przez Supabase)
- Sanityzacja danych wejściowych (trim)

**4. Brak ochrony (do implementacji)**
- ~~Uwierzytelnianie użytkownika~~
- ~~Autoryzacja dostępu do zasobu~~
- ~~Rate limiting~~
- ~~CSRF protection~~

## 7. Obsługa błędów

### Macierz obsługi błędów

| Typ błędu | Scenariusz | Kod HTTP | Response | Źródło |
|-----------|-----------|----------|----------|--------|
| **Walidacja Path** | Nieprawidłowy UUID w `id` | 400 | `{ error: "Nieprawidłowy format UUID dla parametru id" }` | Endpoint |
| **Walidacja Body** | Brak pola `nazwa_produktu` | 400 | `{ error: "...", details: ZodError }` | Endpoint |
| **Walidacja Body** | Zbyt długa nazwa (>255) | 400 | `{ error: "...", details: ZodError }` | Endpoint |
| **Walidacja Body** | Nieprawidłowy UUID w `kategoria_id` | 400 | `{ error: "...", details: ZodError }` | Endpoint |
| **Nie znaleziono** | Produkt o podanym ID nie istnieje | 404 | `{ error: "Produkt nie został znaleziony" }` | Service |
| **Referencja** | Kategoria o podanym ID nie istnieje | 400 | `{ error: "Kategoria nie istnieje" }` | Service |
| **Constraint** | Nazwa produktu już istnieje dla user_id | 400 | `{ error: "Produkt o takiej nazwie już istnieje" }` | Service |
| **Baza danych** | Błąd połączenia/query | 500 | `{ error: "Internal server error" }` | Service/Endpoint |
| **Niespodziewany** | Wyjątki runtime | 500 | `{ error: "Internal server error" }` | Endpoint |

### Strategie obsługi

**W endpointcie (`src/pages/api/products/[id].ts`):**
```typescript
try {
  // Walidacja params i body przez Zod
  const params = getProductParamsSchema.parse({ id });
  const body = updateProductSchema.parse(requestBody);
  
  // Wywołanie service
  const product = await service.updateProduct(id, body.nazwa_produktu, body.kategoria_id);
  
  return new Response(JSON.stringify({
    message: 'Product updated successfully',
    product,
  }), { status: 200 });
  
} catch (error) {
  if (error instanceof ZodError) {
    return new Response(JSON.stringify({
      error: 'Błąd walidacji danych',
      details: error.errors,
    }), { status: 400 });
  }
  
  if (error instanceof Error) {
    // Rozpoznanie błędów serwisu po message
    if (error.message.includes('nie został znaleziony')) {
      return new Response(JSON.stringify({
        error: error.message,
      }), { status: 404 });
    }
    
    if (error.message.includes('nie istnieje') || 
        error.message.includes('już istnieje')) {
      return new Response(JSON.stringify({
        error: error.message,
      }), { status: 400 });
    }
  }
  
  // Ogólny błąd serwera
  console.error('Unexpected error:', error);
  return new Response(JSON.stringify({
    error: 'Internal server error',
  }), { status: 500 });
}
```

**W serwisie (`src/lib/services/products.service.ts`):**
- Rzucanie błędów z deskryptywnymi komunikatami
- Logowanie szczegółów błędów do console
- Propagacja błędów do endpointu

## 8. Rozważania dotyczące wydajności

### Potencjalne wąskie gardła

1. **Wielokrotne zapytania do bazy**
   - Sprawdzenie kategorii: 1 query
   - Pobranie produktu: 1 query
   - Sprawdzenie unikalności: 1 query (warunkowe)
   - Aktualizacja: 1 query
   - **Łącznie: 3-4 zapytania**

2. **Brak cache'owania**
   - Kategorie są statyczne i mogłyby być cache'owane
   - Obecnie każde żądanie sprawdza istnienie kategorii

3. **Brak optymalizacji dla częstych operacji**
   - Sprawdzenie unikalności zawsze wykonywane, nawet jeśli nazwa się nie zmieniła

### Strategie optymalizacji

**Zaimplementowane:**
- ✅ Indeksy na `id`, `user_id`, `kategoria_id` w tabeli produkty
- ✅ Indeks na `id` w tabeli kategorie
- ✅ Prepared statements (automatycznie przez Supabase)
- ✅ Walidacja po stronie aplikacji przed zapytaniami

**Do rozważenia w przyszłości:**
- 🔄 Cache kategorii w pamięci (Redis/in-memory)
- 🔄 Optymalizacja sprawdzania unikalności (tylko gdy nazwa się zmienia)
- 🔄 Połączenie niektórych query w jedną transakcję
- 🔄 Connection pooling (domyślnie w Supabase)
- 🔄 Monitoring czasu odpowiedzi endpointu

### Oczekiwana wydajność

| Metryka | Wartość oczekiwana |
|---------|-------------------|
| Czas odpowiedzi (p50) | < 100ms |
| Czas odpowiedzi (p95) | < 300ms |
| Czas odpowiedzi (p99) | < 500ms |
| Throughput | ~100 req/s (pojedynczy worker) |
| Rozmiar odpowiedzi | ~500 bytes (JSON) |

## 9. Etapy wdrożenia

### Krok 1: Rozszerzenie schematu walidacji

**Plik:** `src/lib/validations/product.validation.ts`

**Zadania:**
1. Dodać `updateProductSchema` (może być alias do `createProductSchema`)
2. Wyeksportować typ `UpdateProductInput`

**Kod do dodania:**
```typescript
/**
 * Schemat walidacji dla aktualizacji produktu
 * Identyczny z createProductSchema - wymaga nazwy i kategorii
 */
export const updateProductSchema = createProductSchema;

/**
 * Typ wejściowy dla aktualizacji produktu
 */
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
```

**Weryfikacja:**
- Import i użycie schematu w testach jednostkowych
- Sprawdzenie że schema poprawnie waliduje dane

---

### Krok 2: Rozszerzenie ProductsService

**Plik:** `src/lib/services/products.service.ts`

**Zadania:**
1. Dodać metodę `updateProduct()`
2. Zaimplementować logikę aktualizacji z walidacją biznesową
3. Dodać obsługę błędów

**Metoda do dodania:**
```typescript
/**
 * Aktualizuje produkt w bazie danych
 * 
 * @param productId - ID produktu do aktualizacji
 * @param nazwaProductu - Nowa nazwa produktu
 * @param kategoriaId - Nowe ID kategorii
 * @returns Zaktualizowany ProductDTO
 * @throws Error gdy produkt nie istnieje
 * @throws Error gdy kategoria nie istnieje
 * @throws Error gdy nowa nazwa narusza constraint unikalności
 */
async updateProduct(
  productId: string,
  nazwaProductu: string,
  kategoriaId: string
): Promise<ProductDTO> {
  // 1. Sprawdzenie czy kategoria istnieje
  const { data: category, error: categoryError } = await this.supabase
    .from('kategorie')
    .select('id')
    .eq('id', kategoriaId)
    .single();

  if (categoryError || !category) {
    throw new Error('Kategoria nie istnieje');
  }

  // 2. Pobranie istniejącego produktu
  const { data: existingProduct, error: fetchError } = await this.supabase
    .from('produkty')
    .select('*')
    .eq('id', productId)
    .maybeSingle();

  if (fetchError) {
    throw new Error(`Błąd podczas pobierania produktu: ${fetchError.message}`);
  }

  if (!existingProduct) {
    throw new Error('Produkt nie został znaleziony');
  }

  // 3. Sprawdzenie unikalności nazwy (tylko jeśli nazwa się zmienia)
  if (existingProduct.nazwa_produktu !== nazwaProductu) {
    const { data: duplicateProduct, error: checkError } = await this.supabase
      .from('produkty')
      .select('id')
      .eq('user_id', existingProduct.user_id)
      .eq('nazwa_produktu', nazwaProductu)
      .neq('id', productId)
      .maybeSingle();

    if (checkError) {
      throw new Error(`Błąd podczas sprawdzania duplikatów: ${checkError.message}`);
    }

    if (duplicateProduct) {
      throw new Error('Produkt o takiej nazwie już istnieje');
    }
  }

  // 4. Aktualizacja produktu
  const { data: updatedProduct, error: updateError } = await this.supabase
    .from('produkty')
    .update({
      nazwa_produktu: nazwaProductu,
      kategoria_id: kategoriaId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', productId)
    .select()
    .single();

  if (updateError || !updatedProduct) {
    throw new Error(`Nie udało się zaktualizować produktu: ${updateError?.message || 'Nieznany błąd'}`);
  }

  // 5. Mapowanie do DTO
  return {
    id: updatedProduct.id,
    nazwa_produktu: updatedProduct.nazwa_produktu,
    kategoria_id: updatedProduct.kategoria_id,
    user_id: updatedProduct.user_id,
    created_at: updatedProduct.created_at,
    updated_at: updatedProduct.updated_at,
  };
}
```

**Weryfikacja:**
- Testy jednostkowe dla różnych scenariuszy
- Testy edge cases (produkt nie istnieje, kategoria nie istnieje, duplikat nazwy)

---

### Krok 3: Implementacja endpointu PUT

**Plik:** `src/pages/api/products/[id].ts`

**Zadania:**
1. Dodać handler `PUT` obok istniejących `GET` i `DELETE`
2. Zaimplementować walidację params i body
3. Wywołać service z odpowiednią obsługą błędów
4. Zwrócić odpowiedź zgodną ze specyfikacją

**Struktura pliku:**
```typescript
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { ProductsService } from '../../../lib/services/products.service';
import { 
  getProductParamsSchema, 
  updateProductSchema 
} from '../../../lib/validations/product.validation';

export const prerender = false;

// Istniejące handlery GET i DELETE...

export const PUT: APIRoute = async (context) => {
  try {
    // 1. Pobranie Supabase client z context.locals
    const supabase = context.locals.supabase;
    
    // 2. Walidacja path parameters
    const params = getProductParamsSchema.parse({
      id: context.params.id,
    });

    // 3. Parsowanie i walidacja request body
    let requestBody;
    try {
      requestBody = await context.request.json();
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: 'Nieprawidłowy format JSON w body',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const validatedBody = updateProductSchema.parse(requestBody);

    // 4. Wywołanie service
    const service = new ProductsService(supabase);
    const updatedProduct = await service.updateProduct(
      params.id,
      validatedBody.nazwa_produktu,
      validatedBody.kategoria_id
    );

    // 5. Zwrócenie odpowiedzi sukcesu
    return new Response(
      JSON.stringify({
        message: 'Product updated successfully',
        product: updatedProduct,
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    // Obsługa błędów walidacji Zod
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: 'Błąd walidacji danych',
          details: error.errors,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obsługa błędów biznesowych z service
    if (error instanceof Error) {
      // 404 - Produkt nie znaleziony
      if (error.message.includes('nie został znaleziony')) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // 400 - Błędy walidacji biznesowej
      if (
        error.message.includes('nie istnieje') ||
        error.message.includes('już istnieje')
      ) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Ogólny błąd serwera
    console.error('Unexpected error in PUT /api/products/[id]:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

**Weryfikacja:**
- Test manualny przez curl/Postman
- Sprawdzenie wszystkich ścieżek błędów
- Weryfikacja formatowania odpowiedzi JSON

---

### Krok 4: Testy manualne

**Narzędzia:** curl, Postman, lub REST Client (VS Code)

**Scenariusze testowe:**

**Test 1: Pomyślna aktualizacja**
```bash
curl -X PUT http://localhost:4321/api/products/{valid-id} \
  -H "Content-Type: application/json" \
  -d '{
    "nazwa_produktu": "Nowa nazwa produktu",
    "kategoria_id": "{valid-category-id}"
  }'

# Oczekiwane: 200 OK + zaktualizowany produkt
```

**Test 2: Nieprawidłowy UUID w path**
```bash
curl -X PUT http://localhost:4321/api/products/invalid-uuid \
  -H "Content-Type: application/json" \
  -d '{
    "nazwa_produktu": "Test",
    "kategoria_id": "{valid-category-id}"
  }'

# Oczekiwane: 400 Bad Request + błąd walidacji UUID
```

**Test 3: Brak wymaganego pola**
```bash
curl -X PUT http://localhost:4321/api/products/{valid-id} \
  -H "Content-Type: application/json" \
  -d '{
    "nazwa_produktu": "Test"
  }'

# Oczekiwane: 400 Bad Request + błąd walidacji (brak kategoria_id)
```

**Test 4: Produkt nie istnieje**
```bash
curl -X PUT http://localhost:4321/api/products/00000000-0000-0000-0000-000000000000 \
  -H "Content-Type: application/json" \
  -d '{
    "nazwa_produktu": "Test",
    "kategoria_id": "{valid-category-id}"
  }'

# Oczekiwane: 404 Not Found
```

**Test 5: Kategoria nie istnieje**
```bash
curl -X PUT http://localhost:4321/api/products/{valid-id} \
  -H "Content-Type: application/json" \
  -d '{
    "nazwa_produktu": "Test",
    "kategoria_id": "00000000-0000-0000-0000-000000000000"
  }'

# Oczekiwane: 400 Bad Request + "Kategoria nie istnieje"
```

**Test 6: Duplikat nazwy produktu**
```bash
# Najpierw utwórz produkt z nazwą "Mleko"
# Następnie spróbuj zaktualizować inny produkt tego samego użytkownika na "Mleko"

curl -X PUT http://localhost:4321/api/products/{another-product-id} \
  -H "Content-Type: application/json" \
  -d '{
    "nazwa_produktu": "Mleko",
    "kategoria_id": "{valid-category-id}"
  }'

# Oczekiwane: 400 Bad Request + "Produkt o takiej nazwie już istnieje"
```

**Test 7: Zbyt długa nazwa produktu**
```bash
curl -X PUT http://localhost:4321/api/products/{valid-id} \
  -H "Content-Type: application/json" \
  -d '{
    "nazwa_produktu": "'$(python3 -c 'print("a"*256)')'",
    "kategoria_id": "{valid-category-id}"
  }'

# Oczekiwane: 400 Bad Request + błąd walidacji długości
```

---

### Krok 5: Weryfikacja i cleanup

**Zadania końcowe:**

1. **Sprawdzenie lintów**
   ```bash
   npm run lint
   ```

2. **Weryfikacja typecheck**
   ```bash
   npm run type-check
   # lub
   npx tsc --noEmit
   ```

3. **Test integracyjny wszystkich CRUD operacji**
   - CREATE → UPDATE → GET → DELETE
   - Weryfikacja że updated_at się zmienia
   - Weryfikacja że created_at pozostaje bez zmian

4. **Sprawdzenie w bazie danych**
   ```sql
   -- Sprawdź czy updated_at jest aktualizowany
   SELECT id, nazwa_produktu, created_at, updated_at 
   FROM produkty 
   WHERE id = '{test-product-id}';
   ```

5. **Dokumentacja**
   - Upewnij się że plan jest zapisany w `.ai/update-product-implementation-plan.md`
   - Dodaj komentarze JSDoc do nowej metody w service
   - Zaktualizuj README jeśli potrzebne

---

## 10. Notatki implementacyjne

### Uwagi techniczne

1. **Wykorzystanie istniejącego kodu:**
   - Endpoint może wykorzystać wzorzec z `GET` i `DELETE` w tym samym pliku
   - Service może wykorzystać pomocnicze metody z istniejących operacji
   - Walidacje mogą być współdzielone z innymi endpointami

2. **Konsystencja z innymi endpointami:**
   - Struktura odpowiedzi zgodna z `POST /api/products`
   - Obsługa błędów zgodna z `GET /api/products/{id}`
   - Format komunikatów błędów spójny w całym API

3. **updated_at vs created_at:**
   - `created_at` nie powinno być modyfikowane
   - `updated_at` musi być ustawiane na aktualny timestamp przy każdej aktualizacji
   - PostgreSQL automatycznie używa UTC dla TIMESTAMPTZ

4. **Obsługa NULL/undefined:**
   - Wszystkie pola w UpdateProductCommand są wymagane (nie ma partial update)
   - Zod automatycznie odrzuca undefined/null jeśli nie są explicite dozwolone

### Potencjalne problemy

1. **Race conditions:**
   - Dwa równoczesne PUT do tego samego produktu
   - Rozwiązanie: ostatni wygrywa (last-write-wins)
   - Do rozważenia: optimistic locking z version field

2. **Długość nazwy po trim:**
   - Trim może sprawić że nazwa stanie się pusta
   - Zod sprawdza `.min(1)` AFTER trim

3. **Case sensitivity nazw:**
   - PostgreSQL jest case-sensitive dla VARCHAR
   - "Mleko" ≠ "mleko"
   - Constraint unikalności respektuje case

### Checklist przed mergem

- [ ] Kod przechodzi linty bez błędów
- [ ] TypeScript nie zgłasza błędów
- [ ] Wszystkie testy manualne przechodzą
- [ ] Metoda service ma dokumentację JSDoc
- [ ] Endpoint obsługuje wszystkie kody błędów
- [ ] Response format jest zgodny ze specyfikacją API
- [ ] updated_at jest poprawnie aktualizowany
- [ ] Walidacja Zod działa dla wszystkich przypadków brzegowych
- [ ] Console logi są odpowiednie (tylko błędy, bez verbose)
- [ ] Plan implementacji jest kompletny i zapisany

---

## 11. Następne kroki po implementacji

Po zakończeniu implementacji endpointu UPDATE, rozważ:

1. **Implementacja DELETE** (jeśli jeszcze nie istnieje)
2. **Implementacja PATCH** (partial update) jako alternatywa do PUT
3. **Dodanie autoryzacji** gdy będzie gotowa infrastruktura
4. **Implementacja testów jednostkowych** dla service
5. **Implementacja testów E2E** dla całego przepływu CRUD
6. **Dodanie rate limiting** przed produkcją
7. **Monitoring i metryki** czasu odpowiedzi endpointu

---

## Podsumowanie

Ten plan implementacji dostarcza kompletne wytyczne do wdrożenia endpointu **PUT /api/products/{id}** zgodnie z:
- Specyfikacją API z `.ai/api-plan.md`
- Schematem bazy danych z `.ai/db-plan.md`
- Istniejącymi typami z `src/types.ts`
- Tech stackiem projektu (Astro, TypeScript, Supabase)
- Zasadami implementacji z workspace rules

**Uproszczenia deweloperskie:** Endpoint nie wymaga autoryzacji i może aktualizować dowolny produkt w bazie. Przed wdrożeniem produkcyjnym **konieczne** jest dodanie uwierzytelniania i autoryzacji.

