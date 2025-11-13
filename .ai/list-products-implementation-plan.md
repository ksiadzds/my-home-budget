# API Endpoint Implementation Plan: List Products

## 1. Przegląd punktu końcowego

Endpoint GET `/api/products` umożliwia pobranie paginowanej listy produktów należących do uwierzytelnionego użytkownika. Wspiera filtrowanie po kategoriach lub nazwie produktu oraz sortowanie po wybranych polach. Endpoint jest częścią systemu zarządzania budżetem domowym i zapewnia bezpieczny dostęp tylko do własnych produktów użytkownika.

## 2. Szczegóły żądania

- **Metoda HTTP:** GET
- **Struktura URL:** `/api/products`
- **Parametry:**
  - **Wymagane:** Brak
  - **Opcjonalne:**
    - `page` (integer, domyślnie 1) - Numer strony (minimum 1)
    - `limit` (integer, domyślnie 20, maksimum 100) - Liczba elementów na stronę
    - `filter` (string) - Filtr w formacie JSON: `{"category_id": "uuid"}` lub `{"product_name": "częściowa nazwa"}`
    - `sort` (string) - Sortowanie w formacie: `pole:asc` lub `pole:desc` (dozwolone pola: `nazwa_produktu`, `created_at`, `updated_at`)
- **Request Body:** Brak (żądanie typu GET)
- **Nagłówki:** Authorization header wymagany dla uwierzytelniania

## 3. Wykorzystywane typy

### Istniejące typy DTO:
- `ProductDTO` - Reprezentuje pojedynczy produkt z pełnymi metadanymi
- `CategoryDTO` - Reprezentuje kategorię produktu

### Nowe typy do dodania w `src/types.ts`:
```typescript
// Parametry zapytania dla listowania produktów
export interface ListProductsQuery {
  page?: number;
  limit?: number;
  filter?: string; // JSON string
  sort?: string;
}

// DTO dla metadanych paginacji
export interface PaginationMetaDTO {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

// DTO odpowiedzi dla listy produktów
export interface ListProductsResponseDTO {
  products: ProductDTO[];
  pagination: PaginationMetaDTO;
}

// Typy dla filtrowania
export interface ProductFilter {
  category_id?: string;
  product_name?: string;
}

// Typy dla sortowania
export type ProductSortField = 'nazwa_produktu' | 'created_at' | 'updated_at';
export type SortOrder = 'asc' | 'desc';
export interface ProductSort {
  field: ProductSortField;
  order: SortOrder;
}
```

## 4. Szczegóły odpowiedzi

- **Kod sukcesu:** 200 OK
- **Struktura odpowiedzi:**
```json
{
  "products": [
    {
      "id": "uuid",
      "nazwa_produktu": "string",
      "kategoria_id": "uuid",
      "user_id": "uuid",
      "created_at": "ISO 8601 timestamp",
      "updated_at": "ISO 8601 timestamp"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "total_pages": 5,
    "has_next": true,
    "has_prev": false
  }
}
```

## 5. Przepływ danych

1. **Uwierzytelnianie:** Middleware sprawdza token JWT i ustawia kontekst użytkownika
2. **Walidacja parametrów:** Zod schema waliduje parametry query (page, limit, filter, sort)
3. **Parsowanie filtrów:** JSON string z parametru `filter` zostaje sparsowany na obiekt `ProductFilter`
4. **Parsowanie sortowania:** String `sort` zostaje sparsowany na obiekt `ProductSort`
5. **Wywołanie serwisu:** `ProductsService.listProducts()` z parametrami użytkownika i zapytania
6. **Zapytanie do bazy:** Supabase wykonuje SELECT z filtrami WHERE, ORDER BY i LIMIT/OFFSET
7. **Mapowanie wyników:** Rezultaty z bazy mapowane są na `ProductDTO[]`
8. **Obliczenie paginacji:** Na podstawie total count i parametrów strony obliczane są metadane paginacji
9. **Formatowanie odpowiedzi:** Przygotowanie `ListProductsResponseDTO`

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie:** Na etapie developmentu pomijane - używany mock userId. W przyszłości wymagany JWT token w Authorization header.
- **Autoryzacja:** Na etapie developmentu używany stały mock userId. W przyszłości tylko produkty należące do uwierzytelnionego użytkownika (`user_id` filtr).
- **Walidacja wejścia:** Wszystkie parametry query walidowane przez Zod schemas
- **SQL Injection Protection:** Używanie bezpiecznych metod Supabase (.eq(), .ilike(), etc.)
- **Rate Limiting:** Rekomendowane na poziomie infrastruktury (po implementacji)
- **Dostęp do danych:** Row Level Security w Supabase (po włączeniu w produkcji)

## 7. Obsługa błędów

- **400 Bad Request:**
  - Nieprawidłowy format parametrów (page < 1, limit > 100, nieprawidłowy UUID)
  - Nieprawidłowy JSON w parametrze filter
  - Nieprawidłowy format parametru sort
  - Odpowiedź: `{"error": "Invalid request parameters", "details": {...}}`

- **500 Internal Server Error:**
  - Błędy połączenia z bazą danych
  - Nieoczekiwane błędy podczas przetwarzania
  - Odpowiedź: `{"error": "Internal server error"}`
  - Logowanie błędów do konsoli z szczegółami

**Uwaga:** Na etapie developmentu nie są zwracane błędy 401 Unauthorized, ponieważ uwierzytelnianie jest pomijane. Zostaną dodane po implementacji systemu autoryzacji.

## 8. Rozważania dotyczące wydajności

- **Indeksy bazy danych:** Wykorzystanie istniejących indeksów na `user_id`, `kategoria_id`, `created_at`
- **Paginacja:** LIMIT/OFFSET dla efektywności z dużymi zbiorami danych
- **Filtrowanie:** Indeksowe wyszukiwanie po `kategoria_id`, LIKE search po `nazwa_produktu`
- **Sortowanie:** Indeksowe sortowanie po `created_at` i `updated_at`
- **Cache:** Możliwość cache'owania wyników dla często używanych filtrów
- **Optymalizacja zapytań:** Single query z JOIN do tabeli `kategorie` jeśli potrzebne rozszerzone dane

## 9. Etapy wdrożenia

1. **Rozszerzenie typów w `src/types.ts`:**
   - Dodać nowe interfejsy: `ListProductsQuery`, `PaginationMetaDTO`, `ListProductsResponseDTO`, `ProductFilter`, `ProductSort`

2. **Utworzenie schematów walidacji w `src/lib/validations/product.validation.ts`:**
   - `listProductsQuerySchema` dla parametrów GET
   - `productFilterSchema` dla parsowania filtra
   - `productSortSchema` dla parsowania sortowania

3. **Rozszerzenie `ProductsService` w `src/lib/services/products.service.ts`:**
   - Dodać metodę `listProducts(userId, query)` zwracającą `ListProductsResponseDTO`
   - Zaimplementować logikę filtrowania, sortowania i paginacji
   - Dodać prywatne metody pomocnicze: `parseFilter()`, `parseSort()`, `calculatePagination()`

4. **Implementacja handlera GET w `src/pages/api/products.ts`:**
   - Dodać handler `export const GET: APIRoute`
   - Zaimplementować walidację parametrów query
   - Użyć mock userId dla celów deweloperskich (podobnie jak w POST handlerze)
   - Dodać TODO komentarz o przyszłej implementacji uwierzytelniania
   - Wywołać `productsService.listProducts()`
   - Zwrócić sformatowaną odpowiedź

5. **Aktualizacja middleware w `src/middleware/index.ts`:**
   - Na etapie developmentu bez zmian - uwierzytelnianie zostanie dodane w przyszłości
   - W przyszłości dodać obsługę uwierzytelniania JWT i ustawienie `userId` w `locals`

6. **Testowanie implementacji:**
   - Unit testy dla `ProductsService.listProducts()`
   - Integration testy dla endpointu `/api/products`
   - Testy dla różnych scenariuszy filtrowania i paginacji
   - Testy bezpieczeństwa (dostęp tylko do własnych produktów)

7. **Optymalizacja i refaktoryzacja:**
   - Przegląd wydajności zapytań
   - Dodanie ewentualnych indeksów bazodanowych
   - Refaktoryzacja kodu zgodnie z zasadami clean code
