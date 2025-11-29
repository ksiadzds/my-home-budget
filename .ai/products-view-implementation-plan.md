# Plan implementacji widoku Produkty (CRUD)

## 1. Przegląd

Widok Produkty umożliwia zalogowanemu użytkownikowi kompleksowe zarządzanie bazą mapowań produktów do kategorii. Użytkownik może przeglądać listę produktów, wyszukiwać ich po nazwie, edytować przypisanie kategorii oraz usuwać produkty. Widok realizuje historyjkę US-007 z PRD i stanowi kluczowy element utrzymania jakości automatycznego dopasowania produktów do kategorii w procesie OCR.

Główne funkcjonalności:
- Przeglądanie paginowanej listy produktów (domyślnie 20 na stronę)
- Wyszukiwanie produktów po nazwie (z debounce 300ms)
- Sortowanie alfabetyczne po nazwie produktu (case-insensitive, PL) z tie-breaker `updated_at DESC`
- Inline edycja kategorii produktu z obsługą błędów walidacji (duplikaty, naruszenia FK)
- Usuwanie produktów z potwierdzeniem
- Responsywny UX z komunikacją błędów, stanami ładowania i pustymi stanami

Widok zbudowany w oparciu o:
- Astro 5 (strona `/products`)
- React 19 (komponenty interaktywne)
- TypeScript 5 (statyczne typowanie)
- Tailwind 4 (stylowanie)
- Shadcn/ui (komponenty UI: Button, Input, Alert, Dialog)
- TanStack Table v8 (zaawansowane zarządzanie tabelą)

## 2. Routing widoku

**Ścieżka:** `/products`

**Pliki:**
- `src/pages/products.astro` - strona Astro hostująca komponent React `ProductsView`
- `src/components/products/ProductsView.tsx` - główny komponent zarządzający stanem i logiką
- `src/components/products/ProductsTable.tsx` - tabela z TanStack Table
- `src/components/products/SearchInput.tsx` - input z wyszukiwaniem i debounce
- `src/components/products/PaginationControls.tsx` - kontrolki paginacji
- `src/components/products/ConfirmDialog.tsx` - dialog potwierdzenia usunięcia
- `src/components/products/EmptyState.tsx` - stan pusty (brak produktów/wyników)

**Middleware:**
Widok wymaga uwierzytelnienia - middleware w `src/middleware/index.ts` przekierowuje niezalogowanych użytkowników na `/auth/login`.

## 3. Struktura komponentów

Hierarchia komponentów (drzewo):

```
ProductsView (główny kontener logiki i stanu)
├── SearchInput (wyszukiwanie z debounce)
├── ProductsTable (TanStack Table + Shadcn)
│   ├── Header (kolumny: Nazwa, Kategoria, Utworzono, Zaktualizowano, Akcje)
│   └── Body (wiersze)
│       ├── ProductRow (wiersz produktu)
│       │   ├── CategoryCell (CategorySelect inline)
│       │   └── ActionsCell (Button usuń → otwiera ConfirmDialog)
│       └── Skeleton (podczas ładowania)
├── EmptyState (brak produktów/wyników wyszukiwania)
├── PaginationControls (przejście między stronami)
└── ConfirmDialog (potwierdzenie usunięcia)
```

**Przepływ danych:**
1. `ProductsView` zarządza stanem: produkty, parametry zapytania (page, limit, filter, sort), kategorie
2. Pobiera dane z API (GET `/api/products`, GET `/api/categories`) przy zmianie parametrów
3. `SearchInput` emituje zdebounce'owane zmiany filtru do `ProductsView`
4. `ProductsTable` renderuje wiersze na podstawie danych z `ProductsView`
5. `CategorySelect` (inline w komórce) wywołuje mutację PUT `/api/products/{id}`
6. Przycisk usuń w `ActionsCell` otwiera `ConfirmDialog`, który wywołuje mutację DELETE `/api/products/{id}`
7. `PaginationControls` aktualizuje parametr `page` w stanie `ProductsView`

## 4. Szczegóły komponentów

### ProductsView

**Opis komponentu:**
Główny kontener zarządzający przepływem danych, stanem paginacji, sortowania, filtrowania oraz mutacjami (edycja, usunięcie). Odpowiedzialny za fetch danych z API, obsługę błędów i prezentację wszystkich podrzędnych komponentów. W przypadku braku kategorii z API, blokuje edycję i wyświetla Alert.

**Główne elementy HTML i komponenty:**
- `<div>` - kontener główny
- `<h1>` - tytuł widoku „Produkty"
- `<SearchInput />` - komponent wyszukiwania
- `<Alert />` (Shadcn/ui) - komunikaty błędów globalnych (np. błąd pobierania kategorii)
- `<ProductsTable />` - tabela produktów
- `<PaginationControls />` - kontrolki paginacji
- `<EmptyState />` - stan pusty (warunkowo, gdy `products.length === 0`)
- `<ConfirmDialog />` - dialog potwierdzenia usunięcia

**Obsługiwane interakcje:**
- `handleSearchChange(searchTerm: string)` - aktualizuje parametr `filter` i resetuje `page` do 1
- `handlePageChange(newPage: number)` - aktualizuje parametr `page`
- `handleCategoryChange(productId: string, categoryId: string | null)` - wywołuje PUT `/api/products/{id}` z optimistic update
- `handleDeleteProduct(productId: string)` - otwiera `ConfirmDialog`
- `handleConfirmDelete()` - wywołuje DELETE `/api/products/{id}` i odświeża listę

**Obsługiwana walidacja:**
- Walidacja parametrów zapytania przed fetch (page >= 1, limit <= 100)
- Walidacja odpowiedzi API (sprawdzenie struktury `ListProductsResponseDTO`)
- Walidacja dostępności kategorii przed umożliwieniem edycji (jeśli GET `/api/categories` zwróci błąd, `CategorySelect` jest wyłączony)

**Typy:**
- `ProductDTO` - DTO produktu z API
- `CategoryDTO` - DTO kategorii z API
- `ListProductsResponseDTO` - odpowiedź z GET `/api/products`
- `PaginationMetaDTO` - metadane paginacji
- `ProductsViewState` (nowy ViewModel)

**Propsy:**
Brak (komponent główny widoku, nie przyjmuje propsów).

---

### SearchInput

**Opis komponentu:**
Input tekstowy z wyszukiwaniem po nazwie produktu. Implementuje debounce 300ms, aby zminimalizować liczbę żądań do API. Wyświetla ikonę lupy i przycisk „Wyczyść" (X) po wprowadzeniu tekstu. Dostępny dla screen readerów (aria-label).

**Główne elementy HTML i komponenty:**
- `<Input />` (Shadcn/ui) - pole tekstowe
- `<svg>` - ikona lupy (Lucide React)
- `<Button />` (Shadcn/ui, variant="ghost", size="icon-sm") - przycisk „Wyczyść"

**Obsługiwane interakcje:**
- `onChange(event)` - aktualizuje lokalny stan (natychmiastowo) i emituje zdebounce'owaną wartość do rodzica
- `onClearClick()` - czyści input i emituje pustą wartość do rodzica

**Obsługiwana walidacja:**
- Trim whitespace przed emitowaniem
- Minimalna długość 0 znaków (pusta wartość resetuje filtr)

**Typy:**
- Standard `string` dla wartości inputa

**Propsy:**
```typescript
interface SearchInputProps {
  /** Wartość domyślna inputa */
  defaultValue?: string;
  /** Callback wywoływany po zdebounce'owaniu (300ms) */
  onSearchChange: (searchTerm: string) => void;
  /** Placeholder tekstu */
  placeholder?: string;
  /** Flaga wyłączająca input (np. podczas ładowania) */
  disabled?: boolean;
}
```

---

### ProductsTable

**Opis komponentu:**
Tabela produktów z TanStack Table v8 i stylami Shadcn/ui. Renderuje kolumny: Nazwa produktu, Kategoria (inline `CategorySelect`), Data utworzenia, Data aktualizacji, Akcje (przycisk Usuń). Sortowanie alfabetyczne (case-insensitive, PL) domyślnie po `nazwa_produktu ASC`, z tie-breaker `updated_at DESC`. Wyświetla Skeleton podczas ładowania. Obsługuje puste stany wewnętrznie (EmptyState).

**Główne elementy HTML i komponenty:**
- `<table>` - element tabeli HTML
- `<thead>` - nagłówki kolumn
- `<tbody>` - wiersze danych
- `<tr>` / `<th>` / `<td>` - elementy tabeli
- `<CategorySelect />` - inline select w kolumnie Kategoria
- `<Button />` (variant="destructive", size="icon-sm") - przycisk Usuń w kolumnie Akcje
- `<Skeleton />` - szkielet podczas ładowania (3-5 wierszy)
- `<EmptyState />` - stan pusty (brak danych)

**Obsługiwane interakcje:**
- Inline zmiana kategorii w `CategorySelect` → wywołuje `onCategoryChange` w rodzicu
- Kliknięcie przycisku Usuń → wywołuje `onDeleteClick` w rodzicu (otwiera dialog)

**Obsługiwana walidacja:**
- Brak walidacji wejściowej (tabela wyświetla dane dostarczone przez rodzica)
- Walidacja stanu: jeśli `isLoading === true`, renderuj Skeleton
- Walidacja pustego stanu: jeśli `products.length === 0 && !isLoading`, renderuj EmptyState

**Typy:**
- `ProductDTO[]` - lista produktów
- `CategoryDTO[]` - lista kategorii (dla CategorySelect)

**Propsy:**
```typescript
interface ProductsTableProps {
  /** Lista produktów do wyświetlenia */
  products: ProductDTO[];
  /** Lista kategorii dla inline CategorySelect */
  categories: CategoryDTO[];
  /** Flaga ładowania (renderuje Skeleton) */
  isLoading: boolean;
  /** Callback wywoływany po zmianie kategorii produktu */
  onCategoryChange: (productId: string, categoryId: string | null) => void;
  /** Callback wywoływany po kliknięciu przycisku Usuń */
  onDeleteClick: (productId: string) => void;
  /** Flaga wskazująca czy kategorie są dostępne (jeśli false, CategorySelect disabled) */
  categoriesAvailable: boolean;
}
```

---

### PaginationControls

**Opis komponentu:**
Kontrolki nawigacji paginacji. Wyświetla numery stron, przyciski Poprzednia/Następna, informację o aktualnej stronie i całkowitej liczbie stron. Wyłącza przyciski na granicznych stronach (np. „Poprzednia" na stronie 1). Dostępność: focus states, aria-labels, wskaźnik aktualnej strony (aria-current="page").

**Główne elementy HTML i komponenty:**
- `<nav>` - kontener nawigacji (aria-label="Paginacja produktów")
- `<Button />` (variant="outline") - przyciski Poprzednia / Następna / Numery stron
- `<span>` - tekst informacyjny (np. "Strona 2 z 10")

**Obsługiwane interakcje:**
- `onPreviousClick()` - przejście do poprzedniej strony (wyłączone jeśli `page === 1`)
- `onNextClick()` - przejście do następnej strony (wyłączone jeśli `page === total_pages`)
- `onPageClick(pageNumber)` - przejście do konkretnej strony

**Obsługiwana walidacja:**
- Sprawdzenie `has_prev` / `has_next` przed emitowaniem zmian
- Walidacja `pageNumber` w zakresie 1...total_pages

**Typy:**
- `PaginationMetaDTO` - metadane paginacji z API

**Propsy:**
```typescript
interface PaginationControlsProps {
  /** Metadane paginacji z odpowiedzi API */
  pagination: PaginationMetaDTO;
  /** Callback wywoływany przy zmianie strony */
  onPageChange: (newPage: number) => void;
  /** Flaga wyłączająca kontrolki (np. podczas ładowania) */
  disabled?: boolean;
}
```

---

### CategorySelect

**Opis komponentu:**
Komponent istniejący w `src/components/dashboard/CategorySelect.tsx`. Użyjemy go ponownie w widoku Products w trybie inline (wewnątrz komórki tabeli). Dropdown z listą predefiniowanych kategorii. Dostępność: aria-label, focus states, disabled state.

**Główne elementy HTML i komponenty:**
- `<select>` - natywny element HTML (lub Shadcn/ui `Select` w wersji rozszerzonej)
- `<option>` - opcje kategorii

**Obsługiwane interakcje:**
- `onChange(categoryId)` - zmiana wartości selecta

**Obsługiwana walidacja:**
- Wymagana wartość (nie można zapisać pustej kategorii dla istniejącego produktu)
- Walidacja FK w API (kategoria musi istnieć w bazie)

**Typy:**
- `CategoryDTO` - DTO kategorii

**Propsy:**
```typescript
interface CategorySelectProps {
  /** UUID wybranej kategorii */
  value?: string;
  /** Callback wywoływany przy zmianie kategorii */
  onChange: (categoryId: string) => void;
  /** Flaga wyłączająca select (np. podczas zapisywania) */
  disabled?: boolean;
  /** Lista kategorii do wyświetlenia */
  categories: CategoryDTO[];
}
```

---

### ConfirmDialog

**Opis komponentu:**
Dialog potwierdzenia usunięcia produktu. Wyświetla nazwę produktu w treści dialogu dla kontekstu. Zawiera przyciski Anuluj (ghost) i Usuń (destructive). Dostępność: focus trap, ESC zamyka dialog, focus na przycisk Anuluj po otwarciu.

**Główne elementy HTML i komponenty:**
- `<Dialog />` (Shadcn/ui) - kontener dialogu
- `<DialogTrigger />` - trigger (kontrolowany przez rodzica)
- `<DialogContent />` - treść dialogu
- `<DialogHeader />` - nagłówek („Potwierdź usunięcie")
- `<DialogDescription />` - opis (nazwa produktu)
- `<DialogFooter />` - stopka z przyciskami
- `<Button />` (variant="ghost") - Anuluj
- `<Button />` (variant="destructive") - Usuń

**Obsługiwane interakcje:**
- `onCancelClick()` - zamyka dialog bez akcji
- `onConfirmClick()` - wywołuje callback usunięcia i zamyka dialog

**Obsługiwana walidacja:**
- Brak walidacji (dialog jedynie potwierdza akcję)

**Typy:**
- `ProductDTO` - dane produktu do wyświetlenia w dialogu (opcjonalnie, może być tylko `productId` i `productName`)

**Propsy:**
```typescript
interface ConfirmDialogProps {
  /** Flaga otwartego dialogu (controlled) */
  open: boolean;
  /** Callback zamykający dialog */
  onOpenChange: (open: boolean) => void;
  /** Nazwa produktu do wyświetlenia w opisie */
  productName: string;
  /** Callback wywoływany po potwierdzeniu usunięcia */
  onConfirm: () => void;
  /** Flaga wyłączająca przyciski (np. podczas usuwania) */
  isDeleting?: boolean;
}
```

---

### EmptyState

**Opis komponentu:**
Komponent wyświetlany gdy lista produktów jest pusta. Rozróżnia dwa scenariusze: (1) brak produktów w bazie (nowy użytkownik), (2) brak wyników wyszukiwania. Wyświetla ikonę, tytuł i opis. W przypadku pustego wyszukiwania, sugeruje zmianę kryteriów lub czyszczenie filtra.

**Główne elementy HTML i komponenty:**
- `<div>` - kontener (centered, padding)
- `<svg>` - ikona (Lucide React: `PackageOpen` lub `SearchX`)
- `<h2>` - tytuł
- `<p>` - opis / sugestia

**Obsługiwane interakcje:**
- Opcjonalnie: przycisk „Wyczyść filtr" (jeśli typ to `no_results`)

**Obsługiwana walidacja:**
- Brak walidacji (tylko prezentacja)

**Typy:**
- `EmptyStateType` (nowy enum: `no_products` | `no_results`)

**Propsy:**
```typescript
interface EmptyStateProps {
  /** Typ pustego stanu */
  type: 'no_products' | 'no_results';
  /** Callback do czyszczenia filtra (opcjonalny, tylko dla type="no_results") */
  onClearFilter?: () => void;
}
```

## 5. Typy

### Istniejące DTO (z `src/types.ts`):

```typescript
// DTO dla kategorii
export interface CategoryDTO {
  id: string;
  nazwa_kategorii: string;
}

// DTO dla produktu
export interface ProductDTO {
  id: string;
  nazwa_produktu: string;
  kategoria_id: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// DTO odpowiedzi dla listy produktów
export interface ListProductsResponseDTO {
  products: ProductDTO[];
  pagination: PaginationMetaDTO;
}

// DTO metadanych paginacji
export interface PaginationMetaDTO {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

// Command model do aktualizacji produktu
export type UpdateProductCommand = {
  nazwa_produktu: string;
  kategoria_id: string | null;
};
```

### Nowe ViewModele (do dodania w `src/types.ts`):

```typescript
/**
 * ViewModel stanu widoku Produkty
 * 
 * @interface ProductsViewState
 * @description
 * Stan zarządzany przez komponent ProductsView.
 * Zawiera dane produktów, kategorie, parametry zapytania i flagi stanu.
 */
export interface ProductsViewState {
  /** Lista produktów z aktualnej strony */
  products: ProductDTO[];
  
  /** Metadane paginacji */
  pagination: PaginationMetaDTO;
  
  /** Lista wszystkich kategorii (prefetch) */
  categories: CategoryDTO[];
  
  /** Parametry zapytania do API */
  queryParams: {
    page: number;
    limit: number;
    filter?: ProductFilter; // { product_name?: string }
    sort?: ProductSort;     // { field: 'nazwa_produktu', order: 'asc' }
  };
  
  /** Flagi stanu */
  isLoadingProducts: boolean;
  isLoadingCategories: boolean;
  errorProducts?: string;
  errorCategories?: string;
  
  /** Dialog potwierdzenia usunięcia */
  confirmDialog: {
    open: boolean;
    productId?: string;
    productName?: string;
  };
  
  /** Flaga mutacji (edycja/usunięcie w toku) */
  isMutating: boolean;
}

/**
 * Parametry wyszukiwania produktów
 * 
 * @interface ProductSearchParams
 * @description
 * Parametry do konstruowania query string dla GET /api/products.
 */
export interface ProductSearchParams {
  page: number;
  limit: number;
  filter?: string; // JSON string: {"product_name": "mleko"}
  sort?: string;   // Format: "nazwa_produktu:asc"
}

/**
 * Typ pustego stanu widoku Products
 * 
 * @typedef {string} EmptyStateType
 * @property {'no_products'} no_products - Brak produktów w bazie
 * @property {'no_results'} no_results - Brak wyników wyszukiwania
 */
export type EmptyStateType = 'no_products' | 'no_results';

/**
 * Payload błędu mutacji produktu
 * 
 * @interface ProductMutationError
 * @description
 * Błąd zwracany z API podczas edycji lub usunięcia produktu.
 */
export interface ProductMutationError {
  error: string;
  details?: Record<string, string[]>; // Zod validation errors
}
```

### Typy zapytań API:

```typescript
/**
 * Request body dla PUT /api/products/{id}
 */
export interface UpdateProductRequest {
  nazwa_produktu: string;
  kategoria_id: string | null;
}

/**
 * Response body dla PUT /api/products/{id}
 */
export interface UpdateProductResponse {
  message: string;
  product: ProductDTO;
}

/**
 * Response body dla DELETE /api/products/{id}
 */
export interface DeleteProductResponse {
  message: string;
}

/**
 * Response body dla GET /api/categories
 */
export interface GetCategoriesResponse {
  categories: CategoryDTO[];
}
```

## 6. Zarządzanie stanem

### Główny stan w `ProductsView`:

Używamy `useState` do zarządzania stanem widoku. Dla lepszej organizacji, grupujemy stan w pojedynczy obiekt `ProductsViewState`.

```typescript
const [state, setState] = useState<ProductsViewState>({
  products: [],
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    total_pages: 0,
    has_next: false,
    has_prev: false,
  },
  categories: [],
  queryParams: {
    page: 1,
    limit: 20,
    sort: { field: 'nazwa_produktu', order: 'asc' },
  },
  isLoadingProducts: true,
  isLoadingCategories: true,
  confirmDialog: { open: false },
  isMutating: false,
});
```

### Custom hooki:

#### `useProductsData(queryParams)`

Zarządza fetch'owaniem danych produktów z API. Zwraca dane, stan ładowania i błąd.

```typescript
function useProductsData(params: ProductSearchParams) {
  const [data, setData] = useState<ListProductsResponseDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const queryString = buildQueryString(params);
        const response = await fetch(`/api/products?${queryString}`);
        if (!response.ok) {
          throw new Error('Błąd pobierania produktów');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Nieznany błąd');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [params]);

  return { data, isLoading, error };
}
```

#### `useCategories()`

Fetch'uje kategorie raz przy montażu komponentu. Zwraca dane, stan ładowania i błąd.

```typescript
function useCategories() {
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/categories');
        if (!response.ok) {
          throw new Error('Błąd pobierania kategorii');
        }
        const result = await response.json();
        setCategories(result.categories);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Nieznany błąd');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, isLoading, error };
}
```

#### `useDebouncedValue(value, delay)`

Generyczny hook dla debounce (używany w `SearchInput`).

```typescript
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

### Mutacje:

#### Aktualizacja produktu (PUT):

```typescript
async function handleCategoryChange(productId: string, categoryId: string | null) {
  setState(prev => ({ ...prev, isMutating: true }));
  
  // Optimistic update
  const previousProducts = [...state.products];
  setState(prev => ({
    ...prev,
    products: prev.products.map(p =>
      p.id === productId
        ? { ...p, kategoria_id: categoryId, updated_at: new Date().toISOString() }
        : p
    ),
  }));

  try {
    const response = await fetch(`/api/products/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nazwa_produktu: state.products.find(p => p.id === productId)!.nazwa_produktu,
        kategoria_id: categoryId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Błąd aktualizacji produktu');
    }

    const result: UpdateProductResponse = await response.json();
    
    // Zaktualizuj produkt prawdziwymi danymi z serwera
    setState(prev => ({
      ...prev,
      products: prev.products.map(p => (p.id === productId ? result.product : p)),
    }));
  } catch (error) {
    // Rollback optimistic update
    setState(prev => ({ ...prev, products: previousProducts }));
    
    // Wyświetl błąd (Alert lub Toast)
    alert(error instanceof Error ? error.message : 'Błąd aktualizacji produktu');
  } finally {
    setState(prev => ({ ...prev, isMutating: false }));
  }
}
```

#### Usunięcie produktu (DELETE):

```typescript
async function handleConfirmDelete() {
  const { productId } = state.confirmDialog;
  if (!productId) return;

  setState(prev => ({ ...prev, isMutating: true }));

  try {
    const response = await fetch(`/api/products/${productId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Błąd usuwania produktu');
    }

    // Usuń produkt z listy
    setState(prev => ({
      ...prev,
      products: prev.products.filter(p => p.id !== productId),
      confirmDialog: { open: false },
    }));

    // Odśwież dane jeśli aktualna strona jest teraz pusta
    if (state.products.length === 1 && state.pagination.page > 1) {
      setState(prev => ({
        ...prev,
        queryParams: { ...prev.queryParams, page: prev.queryParams.page - 1 },
      }));
    }
  } catch (error) {
    alert(error instanceof Error ? error.message : 'Błąd usuwania produktu');
  } finally {
    setState(prev => ({ ...prev, isMutating: false }));
  }
}
```

## 7. Integracja API

### GET `/api/products`

**Opis:** Pobiera paginowaną listę produktów użytkownika.

**Typy żądania:**
```typescript
// Query params
interface GetProductsQueryParams {
  page?: string;     // default: "1"
  limit?: string;    // default: "20", max: "100"
  filter?: string;   // JSON string: '{"product_name": "mleko"}'
  sort?: string;     // Format: "nazwa_produktu:asc"
}
```

**Typy odpowiedzi:**
```typescript
// 200 OK
interface GetProductsResponse {
  products: ProductDTO[];
  pagination: PaginationMetaDTO;
}

// 400 Bad Request
interface ErrorResponse {
  error: string;
  details?: Record<string, string[]>;
}

// 500 Internal Server Error
interface ErrorResponse {
  error: string;
}
```

**Użycie w komponencie:**
```typescript
// Konstruowanie query string
const queryString = new URLSearchParams({
  page: String(queryParams.page),
  limit: String(queryParams.limit),
  ...(queryParams.filter && { filter: JSON.stringify(queryParams.filter) }),
  ...(queryParams.sort && { sort: `${queryParams.sort.field}:${queryParams.sort.order}` }),
}).toString();

const response = await fetch(`/api/products?${queryString}`);
```

---

### GET `/api/categories`

**Opis:** Pobiera listę wszystkich predefiniowanych kategorii.

**Typy żądania:** Brak parametrów.

**Typy odpowiedzi:**
```typescript
// 200 OK
interface GetCategoriesResponse {
  categories: CategoryDTO[];
}

// 500 Internal Server Error
interface ErrorResponse {
  error: string;
  message: string;
}
```

**Użycie w komponencie:**
```typescript
const response = await fetch('/api/categories');
const result: GetCategoriesResponse = await response.json();
```

---

### PUT `/api/products/{id}`

**Opis:** Aktualizuje dane produktu (nazwa lub kategoria).

**Typy żądania:**
```typescript
// Path params
interface UpdateProductPathParams {
  id: string; // UUID produktu
}

// Request body
interface UpdateProductRequest {
  nazwa_produktu: string;
  kategoria_id: string | null;
}
```

**Typy odpowiedzi:**
```typescript
// 200 OK
interface UpdateProductResponse {
  message: string;
  product: ProductDTO;
}

// 400 Bad Request (duplikat, nieistniejąca kategoria, walidacja)
interface ErrorResponse {
  error: string;
  details?: Record<string, string[]>;
}

// 404 Not Found
interface ErrorResponse {
  error: string;
}

// 500 Internal Server Error
interface ErrorResponse {
  error: string;
}
```

**Użycie w komponencie:**
```typescript
const response = await fetch(`/api/products/${productId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nazwa_produktu: product.nazwa_produktu,
    kategoria_id: newCategoryId,
  }),
});
```

---

### DELETE `/api/products/{id}`

**Opis:** Usuwa produkt z bazy danych użytkownika.

**Typy żądania:**
```typescript
// Path params
interface DeleteProductPathParams {
  id: string; // UUID produktu
}
```

**Typy odpowiedzi:**
```typescript
// 200 OK
interface DeleteProductResponse {
  message: string;
}

// 404 Not Found
interface ErrorResponse {
  error: string;
}

// 500 Internal Server Error
interface ErrorResponse {
  error: string;
}
```

**Użycie w komponencie:**
```typescript
const response = await fetch(`/api/products/${productId}`, {
  method: 'DELETE',
});
```

## 8. Interakcje użytkownika

### 1. Przeglądanie listy produktów

**Scenariusz:**
Użytkownik otwiera stronę `/products` i widzi tabelę z produktami.

**Przepływ:**
1. Komponent `ProductsView` montuje się i automatycznie wywołuje GET `/api/products?page=1&limit=20&sort=nazwa_produktu:asc`
2. Podczas ładowania wyświetlany jest `Skeleton` (3-5 wierszy)
3. Po otrzymaniu danych, tabela renderuje produkty z kolumnami: Nazwa, Kategoria, Data utworzenia, Data aktualizacji, Akcje
4. U dołu widoczne są `PaginationControls` z informacją o aktualnej stronie

**Komunikaty:**
- Jeśli lista pusta i brak filtra → `EmptyState` typu `no_products`: „Nie masz jeszcze żadnych produktów. Dodaj produkty poprzez proces OCR na stronie głównej."
- Jeśli błąd sieci/500 → `Alert` (Shadcn/ui): „Wystąpił błąd podczas pobierania produktów. Spróbuj odświeżyć stronę."

---

### 2. Wyszukiwanie produktów po nazwie

**Scenariusz:**
Użytkownik wpisuje tekst w `SearchInput`.

**Przepływ:**
1. Użytkownik wpisuje „mleko" w input
2. Po 300ms (debounce) emitowany jest callback `onSearchChange("mleko")`
3. `ProductsView` aktualizuje `queryParams.filter = { product_name: "mleko" }` i resetuje `page = 1`
4. Automatycznie następuje re-fetch GET `/api/products?page=1&limit=20&filter={"product_name":"mleko"}&sort=nazwa_produktu:asc`
5. Tabela renderuje wyniki wyszukiwania
6. Jeśli brak wyników → `EmptyState` typu `no_results`: „Brak wyników dla wyszukiwania 'mleko'. Spróbuj użyć innych słów kluczowych lub wyczyść filtr."

**Komunikaty:**
- Placeholder inputa: „Wyszukaj produkt po nazwie..."
- Po wprowadzeniu tekstu widoczny przycisk „Wyczyść" (X)

---

### 3. Zmiana strony (paginacja)

**Scenariusz:**
Użytkownik klika przycisk „Następna" w `PaginationControls`.

**Przepływ:**
1. Użytkownik klika „Następna"
2. Callback `onPageChange(2)` aktualizuje `queryParams.page = 2`
3. Automatycznie następuje re-fetch GET `/api/products?page=2&limit=20&...`
4. Tabela renderuje produkty ze strony 2
5. Przyciski paginacji aktualizują się: „Poprzednia" aktywny, „Następna" wyłączony jeśli `page === total_pages`

**Komunikaty:**
- Tekst informacyjny: „Strona 2 z 5" (na podstawie `pagination.page` i `pagination.total_pages`)

---

### 4. Inline edycja kategorii produktu

**Scenariusz:**
Użytkownik zmienia kategorię produktu bezpośrednio w tabeli.

**Przepływ:**
1. Użytkownik klika `CategorySelect` w wierszu produktu „Mleko 3.2%"
2. Wybiera nową kategorię „Zakupy spożywcze" z listy rozwijanej
3. Callback `onCategoryChange(productId, categoryId)` wywoływany
4. Optimistic update: wiersz natychmiast aktualizuje kategorię i ustawia `isMutating = true`
5. Wywołanie PUT `/api/products/{id}` z `{ nazwa_produktu: "Mleko 3.2%", kategoria_id: "uuid-zakupow" }`
6. Po sukcesie (200): `isMutating = false`, wiersz aktualizowany prawdziwymi danymi z serwera (w tym `updated_at`)
7. Po błędzie (400/500): rollback optimistic update, wyświetlenie `Alert` z komunikatem błędu

**Komunikaty:**
- Podczas zapisu: `CategorySelect` wyłączony (disabled), opcjonalnie spinner w komórce
- Sukces (200): brak komunikatu (cicha aktualizacja)
- Błąd 400 (duplikat): Alert: „Produkt o nazwie 'Mleko 3.2%' z kategorią 'Zakupy spożywcze' już istnieje."
- Błąd 400 (nieistniejąca kategoria): Alert: „Wybrana kategoria nie istnieje. Odśwież stronę i spróbuj ponownie."
- Błąd 500: Alert: „Wystąpił błąd podczas zapisywania zmian. Spróbuj ponownie."

---

### 5. Usuwanie produktu

**Scenariusz:**
Użytkownik usuwa produkt z listy.

**Przepływ:**
1. Użytkownik klika przycisk „Usuń" (ikona kosza) w kolumnie Akcje dla produktu „Chleb"
2. Otwiera się `ConfirmDialog` z tytułem „Potwierdź usunięcie" i opisem „Czy na pewno chcesz usunąć produkt 'Chleb'? Ta akcja jest nieodwracalna."
3. Użytkownik klika „Usuń" (destructive button)
4. Callback `onConfirm()` wywołuje DELETE `/api/products/{id}`
5. Podczas usuwania: przyciski dialogu wyłączone, opcjonalnie spinner na przycisku „Usuń"
6. Po sukcesie (200): produkt usuwany z listy, dialog zamykany, jeśli lista pusta i `page > 1` → automatyczne przejście do poprzedniej strony
7. Po błędzie (404/500): Alert z komunikatem błędu, dialog pozostaje otwarty

**Komunikaty:**
- Dialog: „Czy na pewno chcesz usunąć produkt '{nazwa_produktu}'? Ta akcja jest nieodwracalna."
- Sukces (200): brak komunikatu (cicha aktualizacja)
- Błąd 404: Alert: „Produkt nie został znaleziony. Być może został już usunięty."
- Błąd 500: Alert: „Wystąpił błąd podczas usuwania produktu. Spróbuj ponownie."

---

### 6. Brak dostępnych kategorii (błąd GET /api/categories)

**Scenariusz:**
Endpoint GET `/api/categories` zwraca błąd 500.

**Przepływ:**
1. Komponent `ProductsView` wywołuje GET `/api/categories` przy montażu
2. Endpoint zwraca 500
3. `state.errorCategories = "Błąd pobierania kategorii"`
4. Tabela renderuje się, ale wszystkie `CategorySelect` są wyłączone (disabled)
5. Wyświetlany jest `Alert` (warning): „Nie udało się pobrać kategorii. Edycja produktów jest tymczasowo niedostępna. Odśwież stronę, aby spróbować ponownie."

**Komunikaty:**
- Alert: „Nie udało się pobrać kategorii. Edycja produktów jest tymczasowo niedostępna."

## 9. Warunki i walidacja

### Walidacja parametrów zapytania (klient)

**Komponenty:** `ProductsView`

**Warunki:**
- `page` >= 1
- `limit` >= 1 i <= 100
- `filter.product_name` - trim whitespace przed wysłaniem
- `sort.field` - jeden z: `nazwa_produktu`, `created_at`, `updated_at`
- `sort.order` - jeden z: `asc`, `desc`

**Implementacja:**
```typescript
function validateQueryParams(params: ProductSearchParams): boolean {
  if (params.page < 1) return false;
  if (params.limit < 1 || params.limit > 100) return false;
  return true;
}
```

**Efekt na UI:**
- Nieprawidłowe parametry blokują fetch i wyświetlają `Alert` z komunikatem: „Nieprawidłowe parametry zapytania."

---

### Walidacja dostępności kategorii

**Komponenty:** `ProductsView`, `CategorySelect`

**Warunki:**
- Jeśli GET `/api/categories` zwraca błąd lub pusta lista, `CategorySelect` jest wyłączony (disabled)
- Alert wyświetlany u góry widoku

**Implementacja:**
```typescript
const categoriesAvailable = categories.length > 0 && !errorCategories;

<CategorySelect
  disabled={!categoriesAvailable || isMutating}
  categories={categories}
  // ...
/>
```

**Efekt na UI:**
- `CategorySelect` disabled + Alert: „Nie udało się pobrać kategorii."

---

### Walidacja inline edycji kategorii

**Komponenty:** `CategorySelect`, `ProductsView`

**Warunki:**
- Kategoria musi być z listy predefiniowanych kategorii (walidacja FK w API)
- Kombinacja `(nazwa_produktu, kategoria_id)` musi być unikalna dla użytkownika (walidacja unique constraint w API)

**Implementacja:**
API zwraca 400 z komunikatem błędu:
```json
{
  "error": "Produkt o nazwie 'Mleko' z kategorią 'Zakupy spożywcze' już istnieje dla tego użytkownika."
}
```

Komponent obsługuje błąd:
```typescript
catch (error) {
  // Rollback optimistic update
  setState(prev => ({ ...prev, products: previousProducts }));
  
  // Wyświetl Alert z błędem
  setErrorAlert(error.message);
}
```

**Efekt na UI:**
- Rollback optimistic update
- Alert z komunikatem błędu z API

---

### Walidacja usuwania produktu

**Komponenty:** `ConfirmDialog`, `ProductsView`

**Warunki:**
- Produkt musi istnieć w bazie (404 jeśli nie)
- Użytkownik musi potwierdzić akcję w dialogu

**Implementacja:**
API zwraca 404:
```json
{
  "error": "Produkt nie został znaleziony"
}
```

Komponent obsługuje błąd:
```typescript
if (response.status === 404) {
  setErrorAlert('Produkt nie został znaleziony. Być może został już usunięty.');
  // Odśwież listę
  refetchProducts();
}
```

**Efekt na UI:**
- Alert z komunikatem: „Produkt nie został znaleziony."
- Odświeżenie listy (re-fetch)

---

### Walidacja paginacji

**Komponenty:** `PaginationControls`

**Warunki:**
- Przycisk „Poprzednia" wyłączony jeśli `pagination.has_prev === false` lub `page === 1`
- Przycisk „Następna" wyłączony jeśli `pagination.has_next === false` lub `page === total_pages`

**Implementacja:**
```typescript
<Button
  variant="outline"
  onClick={onPrevious}
  disabled={!pagination.has_prev || disabled}
>
  Poprzednia
</Button>
```

**Efekt na UI:**
- Przyciski disabled + `cursor-not-allowed`

## 10. Obsługa błędów

### Błędy globalne (sieć, 500)

**Scenariusz:** Endpoint nie odpowiada lub zwraca 500.

**Obsługa:**
- Catch w bloku `try/catch` podczas fetch
- Wyświetlenie `Alert` (Shadcn/ui, variant="destructive") u góry widoku
- Komunikat: „Wystąpił błąd podczas pobierania danych. Spróbuj odświeżyć stronę."

**Implementacja:**
```typescript
try {
  const response = await fetch('/api/products');
  if (!response.ok) throw new Error('Błąd pobierania produktów');
  // ...
} catch (error) {
  setState(prev => ({
    ...prev,
    errorProducts: error instanceof Error ? error.message : 'Nieznany błąd',
  }));
}
```

**UI:**
```typescript
{state.errorProducts && (
  <Alert variant="destructive">
    <AlertTitle>Błąd</AlertTitle>
    <AlertDescription>{state.errorProducts}</AlertDescription>
  </Alert>
)}
```

---

### Błędy walidacji API (400)

**Scenariusz:** API zwraca 400 Bad Request z szczegółami błędu.

**Przykłady:**
- Duplikat: `{ error: "Produkt o nazwie 'X' już istnieje" }`
- Nieistniejąca kategoria: `{ error: "Kategoria o ID 'uuid' nie istnieje" }`
- Walidacja Zod: `{ error: "Błąd walidacji", details: { nazwa_produktu: ["Pole wymagane"] } }`

**Obsługa:**
- Rollback optimistic update (jeśli dotyczy edycji)
- Wyświetlenie `Alert` z komunikatem błędu z API
- Opcjonalnie: wyświetlenie szczegółów walidacji (details) w formie listy

**Implementacja:**
```typescript
if (response.status === 400) {
  const errorData = await response.json();
  const errorMessage = errorData.details
    ? `${errorData.error}: ${JSON.stringify(errorData.details)}`
    : errorData.error;
  
  setState(prev => ({
    ...prev,
    products: previousProducts, // rollback
  }));
  
  alert(errorMessage); // lub Alert component
}
```

---

### Błędy 404 (produkt nie znaleziony)

**Scenariusz:** Użytkownik próbuje edytować/usunąć produkt, który nie istnieje (np. został usunięty w innej sesji).

**Obsługa:**
- Wyświetlenie `Alert`: „Produkt nie został znaleziony. Został usunięty lub nie masz do niego dostępu."
- Automatyczne odświeżenie listy (re-fetch)

**Implementacja:**
```typescript
if (response.status === 404) {
  alert('Produkt nie został znaleziony.');
  // Refetch
  setState(prev => ({
    ...prev,
    queryParams: { ...prev.queryParams }, // trigger re-fetch
  }));
}
```

---

### Błąd pobierania kategorii

**Scenariusz:** GET `/api/categories` zwraca 500.

**Obsługa:**
- Wyświetlenie `Alert` (warning): „Nie udało się pobrać kategorii. Edycja produktów jest tymczasowo niedostępna."
- Wyłączenie wszystkich `CategorySelect` (disabled)
- Tabela nadal wyświetla produkty (read-only dla kategorii)

**Implementacja:**
```typescript
{state.errorCategories && (
  <Alert variant="warning">
    <AlertTitle>Uwaga</AlertTitle>
    <AlertDescription>
      Nie udało się pobrać kategorii. Edycja produktów jest tymczasowo niedostępna. 
      <Button variant="link" onClick={() => window.location.reload()}>
        Odśwież stronę
      </Button>
    </AlertDescription>
  </Alert>
)}
```

---

### Brak produktów / pusty stan wyszukiwania

**Scenariusz:** Lista produktów pusta (nowy użytkownik lub brak wyników wyszukiwania).

**Obsługa:**
- Wyświetlenie `EmptyState` z odpowiednim komunikatem
- Typ `no_products`: „Nie masz jeszcze żadnych produktów. Dodaj produkty poprzez proces OCR na stronie głównej."
- Typ `no_results`: „Brak wyników dla wyszukiwania '{searchTerm}'. Spróbuj użyć innych słów kluczowych lub wyczyść filtr."

**Implementacja:**
```typescript
{state.products.length === 0 && !state.isLoadingProducts && (
  <EmptyState
    type={state.queryParams.filter?.product_name ? 'no_results' : 'no_products'}
    onClearFilter={() => setState(prev => ({
      ...prev,
      queryParams: { ...prev.queryParams, filter: undefined, page: 1 },
    }))}
  />
)}
```

---

### Obsługa timeout / brak odpowiedzi

**Scenariusz:** Request do API nie zwraca odpowiedzi (timeout).

**Obsługa:**
- Timeout po 30 sekundach
- Wyświetlenie `Alert`: „Żądanie przekroczyło limit czasu. Sprawdź połączenie i spróbuj ponownie."

**Implementacja:**
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000);

try {
  const response = await fetch('/api/products', { signal: controller.signal });
  clearTimeout(timeoutId);
  // ...
} catch (error) {
  if (error.name === 'AbortError') {
    setError('Żądanie przekroczyło limit czasu.');
  }
}
```

## 11. Kroki implementacji

### Krok 1: Przygotowanie struktury plików

**Akcje:**
1. Utwórz katalog `src/components/products/`
2. Utwórz pliki komponentów:
   - `ProductsView.tsx`
   - `ProductsTable.tsx`
   - `SearchInput.tsx`
   - `PaginationControls.tsx`
   - `ConfirmDialog.tsx`
   - `EmptyState.tsx`
3. Utwórz katalog `src/components/products/hooks/`
4. Utwórz custom hooki:
   - `useProductsData.ts`
   - `useCategories.ts`
   - `useDebouncedValue.ts`
5. Utwórz stronę `src/pages/products.astro`

**Weryfikacja:**
- Wszystkie pliki utworzone
- Import paths poprawne

---

### Krok 2: Dodanie nowych typów do `src/types.ts`

**Akcje:**
1. Dodaj `ProductsViewState`
2. Dodaj `ProductSearchParams`
3. Dodaj `EmptyStateType`
4. Dodaj `ProductMutationError`
5. Dodaj typy zapytań API: `UpdateProductRequest`, `UpdateProductResponse`, `DeleteProductResponse`, `GetCategoriesResponse`

**Weryfikacja:**
- Wszystkie typy zdefiniowane
- Brak błędów TypeScript

---

### Krok 3: Implementacja custom hooków

**Akcje:**
1. Implementuj `useDebouncedValue` (generyczny hook)
2. Implementuj `useCategories` (fetch kategorii przy montażu)
3. Implementuj `useProductsData` (fetch produktów z query params)

**Weryfikacja:**
- Hooki zwracają poprawne typy
- Fetch działa poprawnie (test z mock data)

---

### Krok 4: Implementacja komponentu `SearchInput`

**Akcje:**
1. Utwórz input z ikoną lupy (Lucide React: `Search`)
2. Dodaj lokalny stan dla wartości inputa
3. Implementuj debounce 300ms za pomocą `useDebouncedValue`
4. Dodaj przycisk „Wyczyść" (X) widoczny gdy input niepusty
5. Dodaj aria-label dla dostępności

**Weryfikacja:**
- Input renderuje się poprawnie
- Debounce działa (callback wywoływany po 300ms)
- Przycisk „Wyczyść" czyści input i emituje pusty string

---

### Krok 5: Implementacja komponentu `EmptyState`

**Akcje:**
1. Utwórz warianty dla `no_products` i `no_results`
2. Dodaj ikony (Lucide React: `PackageOpen`, `SearchX`)
3. Dodaj tytuł i opis dla każdego wariantu
4. Dodaj opcjonalny przycisk „Wyczyść filtr" dla `no_results`

**Weryfikacja:**
- Oba warianty renderują się poprawnie
- Przycisk „Wyczyść filtr" działa

---

### Krok 6: Implementacja komponentu `PaginationControls`

**Akcje:**
1. Utwórz kontener `<nav>` z aria-label
2. Dodaj przyciski „Poprzednia" / „Następna"
3. Dodaj tekst informacyjny „Strona X z Y"
4. Dodaj wyłączanie przycisków na podstawie `has_prev` / `has_next`
5. Dodaj aria-current="page" dla aktywnej strony

**Weryfikacja:**
- Przyciski renderują się poprawnie
- Wyłączanie działa (disabled state)
- Callback `onPageChange` wywoływany z poprawnym numerem strony

---

### Krok 7: Implementacja komponentu `ConfirmDialog`

**Akcje:**
1. Użyj `Dialog` z Shadcn/ui
2. Dodaj propsy: `open`, `onOpenChange`, `productName`, `onConfirm`, `isDeleting`
3. Dodaj header: „Potwierdź usunięcie"
4. Dodaj opis: „Czy na pewno chcesz usunąć produkt '{productName}'?"
5. Dodaj footer z przyciskami: „Anuluj" (ghost), „Usuń" (destructive)
6. Dodaj wyłączanie przycisków podczas `isDeleting`

**Weryfikacja:**
- Dialog otwiera się i zamyka poprawnie
- Przyciski działają
- Focus trap i ESC działa

---

### Krok 8: Implementacja komponentu `ProductsTable`

**Akcje:**
1. Zainstaluj TanStack Table: `npm install @tanstack/react-table`
2. Zdefiniuj kolumny: Nazwa, Kategoria, Utworzono, Zaktualizowano, Akcje
3. Dodaj `CategorySelect` w kolumnie Kategoria (inline, controlled)
4. Dodaj przycisk Usuń w kolumnie Akcje (ikona kosza, destructive)
5. Dodaj sortowanie domyślne: `nazwa_produktu ASC`
6. Dodaj `Skeleton` podczas `isLoading`
7. Dodaj `EmptyState` gdy `products.length === 0`

**Weryfikacja:**
- Tabela renderuje dane poprawnie
- Kolumny wyświetlane zgodnie z projektem
- `CategorySelect` działa (inline edycja)
- Przycisk Usuń wywołuje callback

---

### Krok 9: Implementacja komponentu `ProductsView` (główna logika)

**Akcje:**
1. Zdefiniuj stan `ProductsViewState`
2. Użyj hooków: `useCategories`, `useProductsData`
3. Implementuj handlery:
   - `handleSearchChange` - aktualizuje filter, resetuje page
   - `handlePageChange` - aktualizuje page
   - `handleCategoryChange` - optimistic update + PUT request
   - `handleDeleteClick` - otwiera `ConfirmDialog`
   - `handleConfirmDelete` - DELETE request
4. Dodaj obsługę błędów (Alert dla każdego typu błędu)
5. Renderuj komponenty: `SearchInput`, `ProductsTable`, `PaginationControls`, `ConfirmDialog`

**Weryfikacja:**
- Wszystkie interakcje działają
- Fetch działa przy zmianie query params
- Optimistic update i rollback działa
- Błędy obsługiwane poprawnie

---

### Krok 10: Utworzenie strony Astro `/products`

**Akcje:**
1. Utwórz `src/pages/products.astro`
2. Użyj layoutu `Layout.astro`
3. Osadź komponent `ProductsView` jako island (client:load)
4. Dodaj middleware check (użytkownik musi być zalogowany)

**Weryfikacja:**
- Strona `/products` renderuje się
- Komponent React działa (interaktywność)
- Middleware przekierowuje niezalogowanych użytkowników

---

### Krok 11: Stylowanie i responsywność

**Akcje:**
1. Dodaj style Tailwind dla wszystkich komponentów
2. Dodaj responsywność (mobile-first):
   - Tabela: horizontal scroll na mobile
   - Paginacja: stack buttons na mobile
3. Dodaj focus states dla wszystkich interaktywnych elementów
4. Dodaj loading states (Skeleton, disabled buttons)

**Weryfikacja:**
- Widok wygląda dobrze na desktop i mobile
- Focus states widoczne (ring)
- Loading states działają

---

### Krok 12: Testy ręczne i edge cases

**Akcje:**
1. Test: brak produktów (nowy użytkownik) → `EmptyState` typu `no_products`
2. Test: wyszukiwanie bez wyników → `EmptyState` typu `no_results`
3. Test: zmiana kategorii → optimistic update → rollback na błąd 400 (duplikat)
4. Test: usunięcie produktu → potwierdzenie → success
5. Test: usunięcie ostatniego produktu na stronie > 1 → auto przejście do poprzedniej strony
6. Test: błąd GET `/api/categories` → Alert + `CategorySelect` disabled
7. Test: błąd GET `/api/products` → Alert
8. Test: timeout (symulacja wolnej sieci) → Alert

**Weryfikacja:**
- Wszystkie scenariusze działają poprawnie
- Brak błędów w konsoli
- Komunikaty błędów czytelne

---

### Krok 13: Optymalizacje i refaktoring

**Akcje:**
1. Dodaj `React.memo()` dla `ProductsTable` (jeśli potrzebne)
2. Użyj `useCallback` dla handlerów przekazywanych do dzieci
3. Użyj `useMemo` dla danych tabelowych (jeśli ciężkie przeliczenia)
4. Dodaj komentarze JSDoc dla wszystkich komponentów i hooków
5. Dodaj propTypes lub TypeScript interfaces dla wszystkich propsów

**Weryfikacja:**
- Brak zbędnych re-renderów
- Kod czytelny i dobrze udokumentowany

---

### Krok 14: Dokumentacja i finalizacja

**Akcje:**
1. Utwórz `README.md` w katalogu `src/components/products/` z opisem komponentów
2. Dodaj komentarze w kodzie dla złożonych logik
3. Zaktualizuj `.ai/ui-plan.md` jeśli zaszły zmiany w projekcie
4. Commit zmian do repozytorium

**Weryfikacja:**
- Dokumentacja kompletna
- Kod gotowy do code review

---

## Podsumowanie

Ten plan implementacji dostarcza kompletny przewodnik dla programisty frontendowego do zbudowania widoku Produkty (CRUD) w aplikacji HomeBudget OCR. Widok realizuje historyjkę US-007 i zapewnia użytkownikom wygodny sposób zarządzania bazą mapowań produktów do kategorii.

**Kluczowe punkty:**
- Routing: `/products`
- Tech stack: Astro 5 + React 19 + TypeScript 5 + Tailwind 4 + Shadcn/ui + TanStack Table
- Funkcjonalności: paginacja, wyszukiwanie (debounce 300ms), inline edycja kategorii, usuwanie produktów
- Obsługa błędów: 400, 404, 500, timeout
- Dostępność: ARIA, focus states, keyboard navigation
- Responsywność: mobile-first design

**Następne kroki po implementacji:**
- Code review
- Testy integracyjne (opcjonalnie: Playwright)
- Deployment na środowisko deweloperskie
- Feedback użytkowników

