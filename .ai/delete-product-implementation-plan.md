# API Endpoint Implementation Plan: Delete a Product

## 1. Przegląd punktu końcowego
Endpoint umożliwia usunięcie określonego produktu z bazy danych. Aktualnie nie uwzględniamy autoryzacji użytkownika – w dalszym etapie zostanie ona dodana, a produkt nie będzie usuwany, jeśli nie należy do użytkownika. Obecna implementacja skupia się na weryfikacji poprawności przesłanego identyfikatora oraz poprawnym usunięciu rekordu.

## 2. Szczegóły żądania
- **Metoda HTTP:** DELETE
- **Struktura URL:** `/api/products/{id}`
- **Parametry:**
  - **Wymagane:**
    - `id` – identyfikator produktu w formacie UUID (przekazywany w ścieżce)
  - **Opcjonalne:** brak
- **Request Body:** Brak

## 3. Wykorzystywane typy
- **ProductDTO** – definicja produktu (zdefiniowany w `src/types.ts`)
- Schemat Zod do walidacji parametru `id` jako UUID

## 4. Przepływ danych
1. Klient wysyła żądanie DELETE na `/api/products/{id}`
2. Parametr `id` jest walidowany pod kątem formatu UUID.
3. Endpoint wywołuje funkcję `deleteProduct` w serwisie (`src/lib/services/products.service.ts`).
4. Funkcja `deleteProduct` sprawdza, czy produkt o danym `id` istnieje i wykonuje operację usunięcia z bazy danych.
5. W razie powodzenia, zwracany jest komunikat "Product deleted successfully" z kodem 200.

## 5. Względy bezpieczeństwa
- Aktualnie operacja nie zawiera mechanizmów autoryzacji – wszystkie żądania są traktowane jako legalne.
- Walidacja formatu UUID za pomocą Zod zabezpiecza przed niewłaściwymi danymi.
- W przyszłości należy dodać weryfikację, czy produkt należy do wykonującego żądanie użytkownika.

## 6. Obsługa błędów
- **400 Bad Request:** Przekazany `id` nie spełnia formatu UUID.
- **404 Not Found:** Produkt o podanym `id` nie istnieje.
- **500 Internal Server Error:** Błąd serwera, np. problemy z bazą danych.
- Logowanie błędów dla diagnozy problemów.

## 7. Rozważania dotyczące wydajności
- Upewnienie się, że kolumny `id` są indeksowane dla szybkiego wyszukiwania.
- Ograniczenie liczby zapytań do bazy przez integrację walidacji i operacji usunięcia w jednym zapytaniu, jeśli to możliwe.

## 8. Etapy wdrożenia
1. **Walidacja danych wejściowych:** Implementacja schematu Zod do walidacji UUID. ✅
2. **Implementacja funkcji w serwisie:** Utworzenie lub modyfikacja funkcji `deleteProduct` w `src/lib/services/products.service.ts` w celu usunięcia produktu z bazy danych. ✅
3. **Implementacja endpointu:** Aktualizacja API (np. `src/pages/api/products/[id].ts`) do obsługi żądania DELETE i wywołania funkcji serwisowej. ✅
4. **Testowanie:** Testy jednostkowe i integracyjne:
   - Pomyślne usunięcie produktu
   - Błędny format `id`
   - Próba usunięcia nieistniejącego produktu
5. **Dokumentacja:** Uaktualnienie dokumentacji API o nowy endpoint.

