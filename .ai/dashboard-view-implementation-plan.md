# Plan implementacji widoku Dashboard (Upload → OCR → Weryfikacja → Podsumowanie)

## 1. Przegląd

Widok Dashboard prowadzi użytkownika przez przepływ: wgranie zdjęcia paragonu → przetwarzanie OCR → weryfikacja dopasowanych i niedopasowanych pozycji → podsumowanie wydatków wg kategorii. Dane podsumowania są nietrwałe (nie zapisujemy ich w bazie). Używamy Astro 5 (routing), React 19 (interaktywność), TypeScript 5, Tailwind 4 (styling) i Shadcn/ui (komponenty UI).

Zakres MVP-lite (uzgodniony):
- Tylko prosty input file (bez drag & drop).
- Tylko loader podczas OCR (bez licznika i „Anuluj”).
- Zamiast tabeli – prosta lista wierszy (ul/li lub prosty grid).
- Brak Tooltipów, Toastów, Skeletonów, EmptyState – komunikaty błędów/pustych stanów jako zwykły tekst/Alert.
- Nie pokazujemy „confidence”; tylko nazwa i cena.
- Podsumowanie wyłącznie z odpowiedzi OCR (bez klientowego przeliczania po edycjach).
- Brak TanStack Query; proste `useState`/`useEffect` i `fetch`.
- Brak globalnego fetch wrappera i obsługi 401 (MVP dev).
- Brak optimistic update i rollbacków; po wyborze kategorii – POST i blokada selecta na czas zapisu.
- API używane w MVP: GET `/api/categories`, POST `/api/receipts/process`, POST `/api/products`.

## 2. Routing widoku

- Ścieżka: `/`
- Pliki:
  - `src/pages/index.astro` – hostuje Reactowy komponent `DashboardView` (island).
  - `src/components/dashboard/*` – komponenty widoku.
  - Jednorazowe pobranie kategorii po wejściu (`useEffect` + `fetch`).

## 3. Struktura komponentów

- `DashboardView` (kontener logiki kroku i stanu)
  - `UploadDropzone` (wersja uproszczona – tylko input file)
  - Krok „Przetwarzanie”: `OcrProcessingPanel` (tylko loader)
  - Krok „Wynik”:
    - `VerificationList`
      - dla wierszy unmatched: `CategorySelect`
    - `SummaryPanel`
  - Globalnie: zwykłe komunikaty tekstowe/`Alert` dla błędów i pustych stanów

Hierarchia (drzewo):
- DashboardView
  - UploadDropzone
  - OcrProcessingPanel
  - VerificationList
    - CategorySelect (dla wierszy unmatched)
  - SummaryPanel

## 4. Szczegóły komponentów

### DashboardView
- Opis: Orkiestruje cały przepływ (krok: idle → processing → result), przechowuje stan OCR, prezentuje loader w trakcie przetwarzania, zarządza prostą weryfikacją bez licznika/Anuluj.
- Główne elementy:
  - Sekcja uploadu (widoczna w kroku idle)
  - Panel przetwarzania (sam loader)
  - Sekcja wyników (tabela + panel podsumowania)
- Obsługiwane interakcje:
  - onFileSelected(file)
  - onStartOcr() – wywoływany automatycznie po poprawnym wyborze pliku
  - onRowCategoryChange(rowId, categoryId) – auto-zapis dla unmatched
- Obsługiwana walidacja:
  - Plik: typ JPEG/PNG; rozmiar ≤ 10 MB (walidacja klienta przed POST).
  - Brak licznika/timeoutu – proste oczekiwanie na wynik.
- Typy:
  - `DashboardStep`, `OcrResultViewModel`, `VerificationRow`, `MatchedRow`, `UnmatchedRow`
- Propsy: brak (komponent-strona).

### UploadDropzone
- Opis: Prosty input file; walidacja typu/rozmiaru; po akceptacji trigger OCR.
- Główne elementy:
  - Przycisk „Wybierz plik” (input type="file")
  - Komunikaty walidacji (tekst + ikony; nie polegamy tylko na kolorze)
- Obsługiwane interakcje:
  - change (input type="file")
- Obsługiwana walidacja:
  - Tylko `image/jpeg`, `image/png`; rozmiar ≤ 10 MB
- Typy:
  - `UploadValidationError` (lokalne), standard `File`
- Propsy:
  - `onValidFile(file: File): void`

### OcrProcessingPanel
- Opis: Prezentuje postęp przetwarzania OCR (tylko loader).
- Główne elementy:
  - Loader/progress
- Obsługiwane interakcje:
  - Brak
- Obsługiwana walidacja:
  - Wyłącznie logika sterująca widocznością i licznik (brak danych wejściowych)
- Typy:
  - `ProcessingState` (running: boolean)
- Propsy:
  - brak

### VerificationList
- Opis: Prosta lista wyników OCR. Wiersze matched w zielonym tle (read-only); unmatched w pomarańczowym (edycja kategorii, auto-zapis). Bez TanStack Table.
- Główne elementy:
  - Wiersze: nazwa, cena, kategoria (dla unmatched: `CategorySelect`), tekstowy status zapisu („Zapisywanie…/Zapisano/Błąd”)
  - Oznaczenia kolorami + status text (bez tooltipów)
- Obsługiwane interakcje:
  - Dla unmatched: onCategoryChange(rowId, categoryId) → auto-POST `/api/products`
  - Prosty retry po błędzie (ponowny wybór kategorii lub przycisk „Spróbuj ponownie”)
- Obsługiwana walidacja:
  - Wymagana kategoria przed zapisem nowego produktu
  - Blokada selecta na czas zapisu (`isSaving`)
- Typy:
  - `VerificationRow` (discriminated union)
- Propsy:
  - `rows: VerificationRow[]`
  - `onCategoryChange(rowId: string, categoryId: string): void`

### CategorySelect
- Opis: Prosty dropdown z listą kategorii dostarczoną z rodzica; dostępne etykiety, focus states.
- Główne elementy:
  - Natywny `<select>` lub prosty Shadcn/ui `Select`
- Obsługiwane interakcje:
  - onValueChange
- Obsługiwana walidacja:
  - Wymagana wartość dla unmatched (wyświetlenie błędu w wierszu)
- Typy:
  - `CategoryDTO`
- Propsy:
  - `value?: string`
  - `onChange(categoryId: string): void`
  - `disabled?: boolean`
  - `categories: CategoryDTO[]`

### SummaryPanel
- Opis: Prezentuje agregację kosztów wg kategorii i sumę całkowitą. Dane nietrwałe; w MVP pokazujemy wyłącznie to, co zwraca OCR (bez klientowego przeliczania po edycjach).
- Główne elementy:
  - Lista kategorii z sumą
  - Suma całkowita
- Obsługiwane interakcje:
  - Brak (read-only; odświeżane na podstawie stanu)
- Obsługiwana walidacja:
  - Brak (tylko prezentacja)
- Typy:
  - `SummaryItemDTO`, `ReceiptProcessingResponseDTO`
- Propsy:
  - `summary: ReceiptProcessingResponseDTO['summary']`

## 5. Typy

Wykorzystujemy istniejące DTO z `src/types.ts` i dodajemy ViewModel-e na potrzeby widoku.

Nowe typy (proponowane):

```ts
// Przepływ kroku widoku
export type DashboardStep = 'idle' | 'processing' | 'result';

// Wiersz dopasowany (read-only)
export interface MatchedRow {
  type: 'matched';
  id: string;                // lokalne ID wiersza (UUID v4 klienta)
  nazwa_produktu: string;
  kategoria_id?: string;     // jeśli wykryto dopasowanie
  price: number;
}

// Wiersz niedopasowany (edytowalny)
export interface UnmatchedRow {
  type: 'unmatched';
  id: string;                // lokalne ID wiersza
  nazwa_produktu: string;
  price: number;
  suggested_categories: CategoryDTO[];
  selected_category_id?: string;
  isSaving: boolean;
  created_product_id?: string; // po udanym POST /api/products
  error_message?: string;      // z ostatniej mutacji
}

export type VerificationRow = MatchedRow | UnmatchedRow;

// Wynik OCR w modelu widoku
export interface OcrResultViewModel {
  matched_rows: MatchedRow[];
  unmatched_rows: UnmatchedRow[];
  summary: ReceiptProcessingResponseDTO['summary'];
}

// Błędy walidacji uploadu
export type UploadValidationError =
  | { code: 'invalid_type'; message: string }
  | { code: 'too_large'; message: string };
```

Brak TanStack Query – dane pobierane imperatywnie przez `fetch` i trzymane w lokalnym stanie.

## 6. Zarządzanie stanem

- Lokalny stan w `DashboardView`:
  - `step: DashboardStep`
  - `file?: File`
  - `processing: { running: boolean }`
  - `ocrResult?: OcrResultViewModel`
- Dane kategorii:
  - `categories: CategoryDTO[]` – jednorazowo pobrane w `useEffect` po montażu
- Mutacje:
  - `createProduct` (POST `/api/products`) – wywoływany przy zmianie kategorii dla `unmatched`; blokuje select (`isSaving`), po sukcesie ustawia `created_product_id`, po błędzie `error_message`.
- Custom hooki (opcjonalnie):
  - `useOcrProcessing()` – wywołanie POST `/api/receipts/process` (bez timeoutu/abort)
  - `useVerificationList()` – prosta kapsułka do zarządzania `isSaving`/`error_message`

## 7. Integracja API

- GET `/api/categories`
  - Request: brak
  - Response: `{ categories: CategoryDTO[] }`
  - Użycie: jednokrotne pobranie w `useEffect`; błąd → `Alert` + wyłączenie `CategorySelect`

- POST `/api/receipts/process`
  - Request: `FormData` z polem `receipt: File`
  - Response: `ReceiptProcessingResponseDTO`:
    - `matched_products: MatchedProductDTO[]`
    - `unmatched_products: UnmatchedProductDTO[]`
    - `summary: { by_category: SummaryItemDTO[]; total: number }`
  - Użycie: po wyborze pliku; bez licznika/abortu; po sukcesie mapowanie na `OcrResultViewModel`

- POST `/api/products`
  - Request: `{ nazwa_produktu: string; kategoria_id: string | null }`
  - Response: `{ message: string; product: ProductDTO }` (201)
  - Użycie: auto-zapis po wyborze kategorii w wierszu unmatched
  - Obsługa 400: duplikat / FK – pokaż `error_message` w wierszu; pozostaw możliwość ponownego wyboru

Uwagi dot. auth: każde wywołanie (poza publicznymi) z nagłówkiem `Authorization: Bearer <token>` w globalnym fetch wrapperze; 401 → czyszczenie sesji i redirect na `/auth`.

## 8. Interakcje użytkownika

- Wrzucenie pliku (wybór) → walidacja → start OCR
- Podczas przetwarzania – tylko loader (bez „Anuluj”)
- Weryfikacja:
  - Matched: podgląd (read-only, zielone tło)
  - Unmatched: wybór kategorii z `CategorySelect` → auto-POST → status „Zapisywanie…” → „Zapisano” lub błąd (tekst)
- Podsumowanie: wyłącznie z odpowiedzi OCR (brak klientowego przeliczania po zmianach)
- Retry: przy błędach sieci/serwera i błędach zapisu wiersza

## 9. Warunki i walidacja

- Upload:
  - typ: tylko JPEG/PNG
  - rozmiar: ≤ 10 MB
  - błąd walidacji: czytelny komunikat + blokada wywołania OCR
- OCR:
  - 400 (brak pliku/zły format) → Alert; 500 → prosty komunikat i opcja „Spróbuj ponownie”
- Weryfikacja:
  - Dla unmatched wymagany `selected_category_id` przed POST
  - Blokada selecta na czas zapisu (`isSaving`)
  - Brak optimistic update/rollback – stan aktualizujemy po odpowiedzi
- Dostępność:
  - Nie polegać tylko na kolorze – ikony/status text; focus states; etykiety Select

## 10. Obsługa błędów

- Globalnie:
  - 401: w MVP dev – brak globalnej obsługi (RLS off)
- `/api/categories`:
  - 500: `Alert` w miejscu Selecta + disable
- `/api/receipts/process`:
  - 400: walidacja pliku na UI; wyświetl komunikat z sugestią ponowienia
  - 500: „Spróbuj ponownie” – możliwość powtórzenia procesu
- `/api/products` (POST):
  - 400: duplikat / nieistniejąca kategoria → pokaż `error_message` w wierszu + pozwól ponowić wybór
  - 500: prosty komunikat i retry

## 11. Kroki implementacji

1) Routing i szkielety:
   - Utwórz `src/pages/index.astro` i osadź `DashboardView` (island).
   - Bez QueryProvider/globalnego fetch wrappera.
2) Pobranie kategorii:
   - W `DashboardView` użyj `useEffect` i `fetch` do GET `/api/categories`; trzymaj w `useState`.
3) Komponent `UploadDropzone`:
   - Walidacja typu/rozmiaru; emituj `onValidFile`.
4) Logika OCR:
   - POST multipart do `/api/receipts/process`; mapuj odpowiedź do `OcrResultViewModel`; generuj lokalne `id` wierszy.
5) Komponent `OcrProcessingPanel`:
   - Tylko loader w trakcie trwania requestu.
6) Komponent `VerificationList`:
   - Prosta lista; pola: nazwa, cena, select kategorii (dla unmatched), status tekstowy.
7) Komponent `CategorySelect`:
   - Otrzymuje `categories` z rodzica; zapewnij etykiety i focus states.
8) Zapis `createProduct`:
   - POST `/api/products` po zmianie kategorii w wierszu unmatched; ustaw `isSaving`; po sukcesie zapisz `created_product_id`; po błędzie wypełnij `error_message`.
9) Komponent `SummaryPanel`:
   - Wyświetlanie `summary` z OCR; brak klientowego przeliczania po edycjach.
10) Błędy i UX:
   - Proste Alerty/teksty dla 400/500; komunikaty nie polegają tylko na kolorze.
11) Testy ręczne:
   - Zły typ/rozmiar pliku; błąd OCR (500); brak kategorii w wierszu; 400/500 w POST; 500 w GET kategorii.
12) Porządki:
   - Dostrajanie styli Tailwind; refaktory drobne; dokumentacja propsów i typów.


