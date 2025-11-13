# API Endpoint Implementation Plan: Create a Product

## 1. Przegląd punktu końcowego
Endpoint służy do tworzenia nowego produktu dla uwierzytelnionego użytkownika. Klient wysyła żądanie z nazwą produktu oraz identyfikatorem kategorii. Endpoint zapisuje wpis w tabeli `produkty`, dbając o unikalność kombinacji `user_id` i `nazwa_produktu`.

## 2. Szczegóły żądania
- **Metoda HTTP:** POST
- **Struktura URL:** `/api/products`
- **Parametry:**  
  - **Wymagane w body żądania:**  
    - `nazwa_produktu` (string)  
    - `kategoria_id` (uuid)
- **Request Body:**  
 
  {
    "nazwa_produktu": "string",
    "kategoria_id": "uuid"
  }
  ## 3. Wykorzystywane typy
- **DTO dla produktu:** `ProductDTO` (definiowany w `src/types.ts`)
- **Command Model:** `CreateProductCommand` (pomija pola generowane automatycznie: `id`, `user_id`, `created_at`, `updated_at`)

## 4. Szczegóły odpowiedzi
- **Odpowiedź przy sukcesie:**  
  - **Kod statusu:** 201 Created  
  - **Treść:**  
   
    {
      "message": "Product created successfully",
      "product": {
        "id": "uuid",
        "nazwa_produktu": "string",
        "kategoria_id": "uuid",
        "user_id": "uuid",
        "created_at": "timestamp",
        "updated_at": "timestamp"
      }
    }
    - **Kod statusu oraz błędy:**  
  - 400 Bad Request – nieprawidłowe dane wejściowe lub próba utworzenia duplikatu produktu (względem użytkownika)
  - 401 Unauthorized – jeżeli użytkownik nie spełnia wymogów autoryzacji (uwierzytelnienie zostanie zaimplementowane później)
  - 500 Internal Server Error – błędy serwerowe

## 5. Przepływ danych
1. Klient wysyła żądanie POST na `/api/products` z danymi produktu.
2. (Krok uwierzytelnienia zostanie zaimplementowany w kolejnej iteracji.)
3. Dane wejściowe są walidowane za pomocą Zod (sprawdzanie typu `nazwa_produktu` oraz prawidłowy format `kategoria_id`).
4. Przekazanie danych do warstwy serwisów – nowy produkt jest tworzony w bazie danych poprzez wywołanie serwisu odpowiedzialnego za obsługę logiki biznesowej.
5. W przypadku duplikatu (względem połączenia `user_id` i `nazwa_produktu`), zwracany jest błąd 400.
6. Po pomyślnym stworzeniu produktu, odpowiedź 201 z danymi nowo utworzonego produktu zostaje zwrócona do klienta.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie i autoryzacja:** Choć obecnie uwierzytelnienie zostanie obsłużone w kolejnej iteracji, endpoint musi zapewniać, że użytkownik ma prawo tworzyć produkt tylko dla własnego `user_id` (pobrane z kontekstu sesji).
- **Walidacja danych:** Użycie Zod do walidacji danych wejściowych, aby upewnić się, że zarówno `nazwa_produktu` jak i `kategoria_id` spełniają wymagania.
- **Ograniczenie duplikatów:** Sprawdzenie unikalności (`user_id`, `nazwa_produktu`) w bazie danych, co wyeliminuje możliwość utworzenia wielokrotnych wpisów.

## 7. Obsługa błędów
- **Błąd 400 Bad Request:**  
  - Gdy dane wejściowe nie spełniają wymogów walidacji (np. typ danych lub format UUID).
  - Gdy produkt o takiej samej nazwie już istnieje dla danego użytkownika.
- **Błąd 401 Unauthorized:**  
  - Status zwracany, gdy uwierzytelnienie (planowane na późniejszy etap) nie zostanie poprawnie wykonane.
- **Błąd 500 Internal Server Error:**  
  - Każdy błąd nieprzewidziany po stronie serwera, np. problem z połączeniem do bazy danych.

## 8. Rozważania dotyczące wydajności
- Wykorzystanie indeksów na kolumnach `user_id` i `nazwa_produktu` zapewnia szybkie wyszukiwanie duplikatów.
- Optymalizacja transakcji bazy danych przy tworzeniu produktu, aby zapewnić atomiczność operacji.
- Możliwość wykorzystania cache'owania (jeśli przewidziane przez zespół) przy częstym odczycie danych użytkownika.

## 9. Etapy wdrożenia
1. **(Pominięcie uwierzytelnienia):**  
   - Uwierzytelnienie zostanie zaimplementowane w kolejnej iteracji; obecnie zakładamy, że `user_id` dostępne jest w kontekście.
2. **Walidacja:**  
   - Implementacja walidacji wejściowych za pomocą Zod, która weryfikuje pola `nazwa_produktu` oraz `kategoria_id`.
3. **Logika biznesowa:**  
   - Stworzenie serwisu lub funkcji w `src/lib/services` odpowiedzialnej za tworzenie produktu. Serwis powinien:  
     - Sprawdzić unikalność produktu dla danego użytkownika.  
     - Zapisać produkt do bazy danych.
4. **Obsługa błędów:**  
   - Implementacja logiki zwracającej odpowiednie kody statusu HTTP w zależności od rodzaju błędu.
5. **Testowanie:**  
   - Napisanie testów jednostkowych i integracyjnych w celu weryfikacji poprawności działania endpointu.
6. **Dokumentacja:**  
   - Aktualizacja dokumentacji API, aby uwzględniała nowy endpoint oraz przykłady zapytań i odpowiedzi.
7. **Deployment:**  
   - Wdrożenie endpointu wraz z monitorowaniem logów błędów, w tym rejestrowaniem ewentualnych problemów w przypadku błędów serwera.