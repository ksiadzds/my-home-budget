# API Endpoint Implementation Plan: Assign Category to a Product

## 1. Przegląd punktu końcowego

Endpoint umożliwia ręczne przypisanie lub zmianę kategorii produktu. Służy do sytuacji, gdy automatyczne przypisanie kategorii przez system (OCR) nie powiodło się lub wymaga interwencji użytkownika. W obecnej wersji kwestie autoryzacji pomijamy, a odpowiednie zabezpieczenia wdrożymy w późniejszym etapie.

## 2. Szczegóły żądania

- **Metoda HTTP:** POST
- **Struktura URL:** `/api/products/{id}/assign-category`
- **Parametry URL:**
  - `id` (UUID) – identyfikator produktu, dla którego aktualizowana jest kategoria.
- **Request Body:**
  - Wymagany JSON o strukturze:
    ```json
    {
      "kategoria_id": "uuid"
    }
    ```
  - `kategoria_id` – UUID kategorii, którą chcemy przypisać.

## 3. Wykorzystywane typy

- **DTO dla produktu:** `ProductDTO` (definiowany w `src/types.ts`)
- **Command Model:** `AssignCategoryCommand` (definiowany w `src/types.ts`)
- **Response DTO:**
  - Nowa struktura odpowiedzi zawierająca komunikat oraz zaktualizowany obiekt `ProductDTO`

## 4. Szczegóły odpowiedzi

- **Sukces (200 OK):**
  - Treść odpowiedzi:
    ```json
    {
      "message": "Category assigned successfully",
      "product": {
        "id": "uuid",
        "nazwa_produktu": "string",
        "kategoria_id": "uuid",
        "user_id": "uuid",
        "created_at": "timestamp",
        "updated_at": "timestamp"
      }
    }
    ```
- **Błędy:**
  - 400 Bad Request – w przypadku nieprawidłowej struktury danych lub walidacji.
  - 404 Not Found – gdy produkt lub kategoria nie zostaną znalezione.
  - 500 Internal Server Error – w przypadku błędów serwera.

## 5. Przepływ danych

1. Użytkownik wykonuje żądanie POST do endpointu `/api/products/{id}/assign-category` z przesłanym `kategoria_id` w ciele żądania.
2. Po wstępnej walidacji danych wejściowych, system sprawdza, czy produkt o podanym `id` istnieje.
3. System weryfikuje istnienie kategorii o przekazanym `kategoria_id` w bazie danych.
4. Usługa (service) odpowiedzialna za produkty aktualizuje rekord produktu z nowym `kategoria_id`.
5. Zaktualizowany produkt jest zwracany w odpowiedzi po udanej operacji.
6. W przypadku wystąpienia błędów (np. brak produktu, błędna walidacja) zwracane są odpowiednie kody statusu HTTP oraz komunikaty błędów.

## 6. Względy bezpieczeństwa

W tej wersji przyjmujemy uproszczone podejście do bezpieczeństwa – kwestie autoryzacji oraz walidacji dostępu pomijamy, aby skupić się na głównej funkcjonalności. Prawidłowa implementacja zabezpieczeń zostanie wdrożona w późniejszych iteracjach.

## 7. Obsługa błędów

- **400 Bad Request:**
  - Nieprawidłowy format danych wejściowych (np. brak `kategoria_id` lub błędny UUID).
- **404 Not Found:**
  - Produkt o podanym `id` nie istnieje.
  - Kategoria o podanym `kategoria_id` nie istnieje.
- **500 Internal Server Error:**
  - Niespodziewane błędy podczas operacji na bazie danych lub wewnętrzne błędy serwera.

## 8. Rozważania dotyczące wydajności

- Użycie indeksów na kolumnach `user_id` i `kategoria_id` w tabeli `produkty` dla zoptymalizowania wyszukiwania.
- Minimalizacja liczby zapytań do bazy danych poprzez łączenie operacji sprawdzenia oraz aktualizacji w jedną transakcję.
- Opcjonalne cache’owanie predefiniowanych kategorii w celu zmniejszenia obciążenia bazy danych.

## 9. Etapy wdrożenia

1. **Przygotowanie środowiska:**
   - Upewnić się, że połączenie z bazą danych jest poprawnie skonfigurowane.
2. **Walidacja danych wejściowych:**
   - Implementacja walidacji requestu z użyciem biblioteki Zod (lub podobnej) w API endpoint.
3. **Implementacja endpointu:**
   - Utworzenie lub modyfikacja pliku w katalogu `/src/pages/api/products/[id]/assign-category.ts`.
   - Import niezbędnych typów (`AssignCategoryCommand`, `ProductDTO`).
   - Implementacja logiki sprawdzającej istnienie produktu oraz kategorii.
4. **Implementacja logiki serwisowej:**
   - Utworzenie/aktualizacja funkcji w serwisie produktów, np. `assignCategory(productId: string, command: AssignCategoryCommand)`.
   - Aktualizacja rekordu produktu z nowym `kategoria_id`.
5. **Testowanie:**
   - Pisanie testów jednostkowych oraz integracyjnych dla nowego endpointu.
6. **Obsługa błędów i logowanie:**
   - Implementacja przechwytywania wyjątków i logowania błędów serwera.
   - Odpowiednia obsługa kodów statusu HTTP.
7. **Dokumentacja:**
   - Uaktualnienie dokumentacji API oraz komunikacji z zespołem developerskim.
8. **Wdrożenie:**
   - Testy w środowisku deweloperskim, a następnie wdrożenie na produkcję.
