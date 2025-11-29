# Architektura UI dla HomeBudget OCR

## 1. Przegląd struktury UI

- **Widoki**: `/auth` (publiczny), `/` (Dashboard: upload → OCR → weryfikacja → podsumowanie), `/products` (zarządzanie produktami).  
- **Nawigacja desktop**: topbar z linkami (Dashboard, Produkty) i menu konta (avatar, wyloguj).  
- **Zarządzanie stanem i API**: TanStack Query (prefetch kategorii, cache/invalidate), react-hook-form + zod, globalny fetch wrapper z nagłówkiem Authorization i obsługą 401 (czyszczenie sesji + redirect na `/auth`).  
- **Dostępność i UX**: tylko desktop (container 1200–1440 px), pełne tabele, elipsowanie długich treści z tooltipami, nie polegać wyłącznie na kolorze.  
- **Bezpieczeństwo**: middleware chroniący wszystkie trasy poza `/auth`; retry 1× z backoff; limit i walidacja pliku po stronie klienta.  

## 2. Lista widoków

### Widok: Uwierzytelnianie
- **Ścieżka widoku**: `/auth` (jedyne publiczne)  
- **Główny cel**: logowanie/rejestracja/reset hasła; po sukcesie redirect do `/`.  
- **Kluczowe informacje do wyświetlenia**:
  - Formularze: Login, Rejestracja, Reset (zakładki/sekcje).
  - Komunikaty błędów walidacji i błędów sieci.
  - Linki pomocnicze (przełączanie zakładek).  
- **Kluczowe komponenty widoku**:
  - `AuthTabs` (Login/Register/Reset), `AuthForm` (react-hook-form + zod), `SubmitButton`, `FormField`, `Alert` (błędy), `Toasts`.
  - Integracja: globalny fetch wrapper + Supabase Auth (token → Authorization).  
- **UX, dostępność i względy bezpieczeństwa**:
  - Jasne etykiety pól, komunikaty błędów tekstowe, focus states.
  - Po sukcesie: prefetch kategorii i redirect na `/`.
  - Brak SSR; ochrona pozostałych tras przez middleware i 401 handler.

### Widok: Dashboard (Upload → OCR → Weryfikacja → Podsumowanie)
- **Ścieżka widoku**: `/`  
- **Główny cel**: szybkie przetworzenie paragonu oraz weryfikacja i kategoryzacja pozycji.  
- **Kluczowe informacje do wyświetlenia**:
  - Sekcja Upload: status wyboru pliku, walidacja typu (JPEG/PNG) i rozmiaru (≤10 MB).
  - Krok „Przetwarzanie”: loader, licznik czasu (timeout 60 s), możliwość „Anuluj”.
  - Krok „Wynik”:
    - Tabela pozycji z wyróżnieniem matched (zielone tło) i unmatched (pomarańczowe tło).
    - Dla unmatched: lista kategorii (dropdown), status auto-zapisu i wynik mutacji.
  - Panel Podsumowania: agregacja kosztów wg kategorii i suma całkowita (nietrwałe).  
- **Kluczowe komponenty widoku**:
  - `UploadDropzone` (drag & drop + input file; walidacja; brak kompresji w MVP).
  - `OcrProcessingPanel` (progress, licznik, „Anuluj” – czyści stan klienta).
  - `VerificationTable` (TanStack Table + Shadcn): kolory wierszy matched/unmatched; kolumny: nazwa, cena, kategoria (Select), status.
  - `CategorySelect` (prefetch `categories`, staleTime 24h).
  - `SummaryPanel` (agregacja wg kategorii, nietrwała).
  - `Toasts`, `Tooltip`, `Alert`, `EmptyState`, `Skeleton`.  
  - Integracja API:
    - POST `/api/receipts/process` – wynik OCR (matched/unmatched + summary).
    - POST `/api/products` – tworzenie nowych pozycji podczas weryfikacji.
    - PUT `/api/products/{id}` – aktualizacja istniejących pozycji/kategorii.
    - GET `/api/categories` – prefetch i cache.  
- **UX, dostępność i względy bezpieczeństwa**:
  - Nie polegać tylko na kolorze (ikony/status text). Etykiety dla Select.
  - Optimistic update przy POST/PUT z rollbackiem i czytelnymi toastami.
  - „Anuluj” przerywa jedynie przepływ po stronie klienta (czyści lokalny stan).
  - Timeout 60 s: spójny komunikat z sugestią powtórzenia (lepsze zdjęcie).

### Widok: Produkty (CRUD)
- **Ścieżka widoku**: `/products`  
- **Główny cel**: przeglądanie, wyszukiwanie, edycja produktu z moliwością zmiany kategorii i usuwanie produktów użytkownika.  
- **Kluczowe informacje do wyświetlenia**:
  - Tabela produktów z sortowaniem po `nazwa_produktu` ASC (case-insensitive, PL) i tie-breaker `updated_at DESC`.
  - Wyszukiwanie po nazwie (debounce 300 ms), paginacja z API.
  - Inline edycja kategorii, obsługa 400 (duplikat/naruszenia walidacji).  
- **Kluczowe komponenty widoku**:
  - `ProductsTable` (TanStack Table + Shadcn): kolumny: nazwa, kategoria (inline `CategorySelect`), daty, akcje (Usuń).
  - `SearchInput` (debounce 300 ms), `PaginationControls`, `SortControl` (steruje parametrami zapytania do API).
  - `ConfirmDialog` (usunięcie), `Toasts`, `Tooltip`, `EmptyState`, `Skeleton`.
  - Integracja API:
    - GET `/api/products` (paginacja, sort, filter).
    - PUT `/api/products/{id}` (edycja nazwy/kategorii).
    - DELETE `/api/products/{id}` (usuwanie).
    - GET `/api/categories` (prefetch/stale cache).  
- **UX, dostępność i względy bezpieczeństwa**:
  - Elipsowanie i tooltipy dla długich nazw; focus states dla elementów interaktywnych.
  - Czyste komunikaty na 400 (np. duplikat) i możliwość cofnięcia zmian (rollback optimistic).
  - Brak wirtualizacji do ~200 wierszy; spójna paginacja.

### Widok: Globalne stany i błędy
- **Ścieżka widoku**: globalnie (middleware/handler)  
- **Główny cel**: jednolite zarządzanie 401, błędami sieci/serwera i stanami pustymi.  
- **Kluczowe informacje do wyświetlenia**:
  - 401: czyszczenie sesji, redirect na `/auth`, toast informujący.
  - 4xx/5xx: przyjazne komunikaty w kontekście widoku; CTA „Spróbuj ponownie”.
  - Stany puste/szkieletowe (ładowanie, brak danych, błąd).  
- **Kluczowe komponenty widoku**:
  - `GlobalFetchProvider` (nagłówek Authorization + interceptory 401).
  - `ErrorBoundary`, `GlobalToasts`, `RetryButton`, `Skeleton`, `EmptyState`.
  - Integracja: wszystkie wywołania API przez wrapper; retry 1× z backoff.  
- **UX, dostępność i względy bezpieczeństwa**:
  - Komunikaty nie zdradzają szczegółów technicznych; wystandaryzowane teksty.
  - Przejrzysta nawigacja po błędzie (pozostanie w kontekście lub bezpieczny redirect).

## 3. Mapa podróży użytkownika

1) Wejście na `/auth` → logowanie/rejestracja/reset → sukces → redirect na `/` (prefetch kategorii).  
2) Na `/`:  
   - Użytkownik wrzuca obraz (drag & drop lub wybór pliku). Walidacja typu/rozmiaru.  
   - Start przetwarzania: POST `/api/receipts/process` → „Przetwarzanie” z licznikiem i opcją „Anuluj”.  
   - Po sukcesie: „Wynik” – tabela pozycji:  
     - Matched: zielone tło, podgląd read-only.  
     - Unmatched: pomarańczowe tło; przypisanie kategorii w `CategorySelect`.  
       - Dla nowych pozycji: POST `/api/products` (optimistic).  
       - Dla istniejących: PUT `/api/products/{id}` (optimistic).  
   - Panel „Podsumowanie” pokazuje koszty wg kategorii i sumę całkowitą.  
3) Opcjonalnie przejście do `/products` w celu edycji/porządków:  
   - Wyszukiwanie (debounce), sort, paginacja; inline edycja kategorii, usuwanie.  
4) Globalnie: błędy 401 → wylogowanie + redirect do `/auth`; inne błędy → toasty/alerty z retry.

## 4. Układ i struktura nawigacji

- **Topbar**: logo/nazwa aplikacji, linki: „Dashboard” (`/`), „Produkty” (`/products`), po prawej `AvatarMenu` (profil/wyloguj).  
- **Layout**: stały container 1200–1440 px; sekcje w Dashboard: Upload, Przetwarzanie (krok), Wynik (tabela), Podsumowanie.  
- **Ochrona tras**: middleware blokuje wszystko poza `/auth`; globalny handler 401 czyści sesję i przekierowuje.  
- **Routing**: brak SSR; lekki prefetch danych krytycznych (kategorie) po zalogowaniu.  

## 5. Kluczowe komponenty

- **GlobalFetchProvider**: dołączanie Authorization, obsługa 401, retry 1× z backoff.  
- **QueryProvider (TanStack Query)**: klucze `categories` (staleTime 24h), `products:list` (staleTime ~2 min), `products:byId`; invalidacje po mutacjach.  
- **UploadDropzone**: pojedynczy plik JPEG/PNG ≤10 MB; walidacja klienta; drag & drop + input.  
- **OcrProcessingPanel**: loader, licznik 60 s, „Anuluj” (czyści stan).  
- **VerificationTable**: TanStack Table + Shadcn; kolory matched/unmatched; kolumny: nazwa, cena, kategoria (Select), status operacji.  
- **CategorySelect**: dropdown z prefetchowanymi kategoriami; dostępne etykiety i focus states.  
- **SummaryPanel**: agregacja wydatków wg kategorii + suma; nietrwałe dane.  
- **ProductsTable**: sort ASC (case-insensitive, PL) + tie-breaker; wyszukiwanie (debounce), paginacja, inline edycja, usuwanie.  
- **SearchInput**: debounce 300 ms; integracja z parametrami zapytania do API.  
- **PaginationControls**: sterowanie `page`/`limit`; spójne z API.  
- **Toasts/Alerts**: sukces/błąd; rollback optimistic updates.  
- **ConfirmDialog**: potwierdzenie usunięcia.  
- **Tooltip**, **EmptyState**, **Skeleton**, **ErrorBoundary**: wspólne wzorce stanu i dostępności.  

---

### Zgodność z planem API i mapowanie wymagań

- **Endpoints**:
  - `/api/categories`: prefetch na start; wykorzystywane w `CategorySelect` i tabelach.  
  - `/api/receipts/process`: główny przepływ OCR na Dashboardzie.  
  - `/api/products` (GET/POST): lista i tworzenie nowych pozycji (weryfikacja i CRUD).  
  - `/api/products/{id}` (PUT/DELETE): edycja/usuwanie istniejących produktów.  
- **Mapowanie historyjek PRD**:
  - US-001 (Auth): widok `/auth`, redirect do `/`, prefetch kategorii.  
  - US-002 (Upload + OCR): Dashboard → `UploadDropzone` → POST `/api/receipts/process`.  
  - US-003 (Auto-matching): `VerificationTable` z wyróżnieniem matched (zielone).  
  - US-004 (Ręczne przypisanie): `CategorySelect` + POST/PUT produktów (optimistic).  
  - US-005 (Podsumowanie): `SummaryPanel` (nietrwałe dane).  
  - US-006 (CRUD produktów): `/products` z wyszukiwaniem, sortem, inline edycją, usuwaniem.  
- **Przypadki brzegowe/błędy**:
  - Upload: zły typ/rozmiar → komunikat walidacji; brak kompresji w MVP.  
  - OCR: timeout 60 s, parsing/network → spójne komunikaty + retry.  
  - Weryfikacja: konflikty 400 (duplikaty, walidacje) → toasty + rollback.  
  - Produkty: puste listy, błędy paginacji/sortu → EmptyState + jasne CTA.  
  - Bezpieczeństwo: 401 globalnie → wylogowanie i redirect; brak ujawniania szczegółów błędów.  


