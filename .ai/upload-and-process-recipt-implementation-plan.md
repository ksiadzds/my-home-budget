# API Endpoint Implementation Plan: Upload and Process Receipt

## 1. Przegląd punktu końcowego
Endpoint służy do przesłania obrazu paragonu, jego przetworzenia przez mechanizm OCR oraz automatycznego dopasowania rozpoznanych produktów do istniejących kategorii w bazie danych. Wynikiem jest zwrócenie podsumowania wydatków, zawierającego listę dopasowanych i niedopasowanych produktów oraz zagregowane koszty.

## 2. Szczegóły żądania
- **Metoda HTTP:** POST
- **Struktura URL:** `/api/receipts/process`
- **Parametry:**
  - **Wymagane:** 
    - `receipt` – plik obrazu, przesyłany jako form-data.
  - **Opcjonalne:** Brak
- **Request Body:** Multipart/form-data z przesłanym plikiem obrazu pod kluczem `receipt`.

## 3. Wykorzystywane typy
- **DTO odpowiadające odpowiedzi:**
  - `ReceiptProcessingResponseDTO` zawierający:
    - `message: string`
    - `matched_products: MatchedProductDTO[]`  
      - `nazwa_produktu: string`
      - `kategoria_id?: string`
      - `confidence: number`
      - `price: number`
    - `unmatched_products: UnmatchedProductDTO[]`  
      - `nazwa_produktu: string`
      - `price: number`
      - `suggested_categories: CategoryDTO[]`
    - `summary` – obiekt zawierający:
      - `by_category: Array<{ category: CategoryDTO, total_expense: number, items_count: number }>`
      - `total: number`
- **Inne modele:**
  - `CategoryDTO`, `ProductDTO` – wykorzystywane przy dopasowywaniu produktów.

## 4. Szczegóły odpowiedzi
- **Struktura odpowiedzi:**  
  Zwracany JSON musi zawierać:
  - `message` – komunikat informujący o sukcesie przetwarzania.
  - `matched_products` – lista produktów poprawnie rozpoznanych przez OCR.
  - `unmatched_products` – lista produktów, które nie mogły zostać dopasowane z automatu (do ręcznego przypisania).
  - `summary` – podsumowanie z wydatkami pogrupowanymi według kategorii.
- **Kody statusu:**
  - 200 OK – pomyślne przetworzenie i zwrócenie odpowiedzi.
  - 400 Bad Request – w przypadku braku przesłanego pliku lub nieprawidłowego formatu.
  - 401 Unauthorized – jeżeli użytkownik nie jest zalogowany.
  - 500 Internal Server Error – błąd serwera lub przetwarzania OCR.

## 5. Przepływ danych
1. Użytkownik przesyła żądanie POST z plikiem obrazu paragonu.
2. Warstwa API (endpoint) waliduje obecność oraz format pliku przy użyciu Zod.
3. Odpowiedni serwis (np. `receipts.service.ts` w `src/lib/services`) pobiera obraz i przekazuje go do mechanizmu OCR.
4. W wyniku przetwarzania OCR otrzymuje się dane tekstowe dotyczące produktów.
5. Logika dopasowywania porównuje rozpoznane produkty do danych w bazie (używając SQL lub ORM) zgodnie z zasadą unikalności produktów.
6. Na tej podstawie generowane jest podsumowanie wydatków wg kategorii.
7. W przypadku błędów przetwarzania, szczegóły błędu są zapisywane do tabeli `ocr_error_logs`.
8. Ostateczny wynik jest zwracany w odpowiedzi JSON według struktury `ReceiptProcessingResponseDTO`.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie i autoryzacja:**  
  Endpoint wymaga weryfikacji użytkownika (np. przy użyciu Supabase Auth). Każdy użytkownik może uzyskać dostęp tylko do swoich danych.
- **Walidacja pliku:**  
  Sprawdzenie typu (np. image/jpeg, image/png) oraz ograniczenie rozmiaru pliku.
- **Bezpieczeństwo danych:**  
  Zapewnienie, że dane przesyłane i przetwarzane przez OCR są odpowiednio zabezpieczone przed atakami, np. poprzez sanitizację danych wejściowych.
- **Bazy danych:**  
  Użycie zabezpieczeń na poziomie zapytań oraz weryfikacja zgodności z założeniami bazy danych (np. ograniczenia unikalności).

## 7. Obsługa błędów
- **Błędy walidacji (400 Bad Request):**  
  - Brak przesłanego pliku.
  - Nieprawidłowy format pliku.
- **Błędy uwierzytelnienia (401 Unauthorized):**  
  - Niezalogowany użytkownik.
- **Błędy serwera (500 Internal Server Error):**  
  - Błąd przetwarzania OCR.
  - Błąd połączenia z bazą danych.
- **Mechanizmy rejestrowania błędów:**  
  - W przypadku wystąpienia błędu, szczegóły (typ błędu, komunikat, dodatkowe dane) są zapisywane w tabeli `ocr_error_logs` dla dalszej diagnostyki.

## 8. Rozważania dotyczące wydajności
- Przetwarzanie OCR może być operacją czasochłonną; rozważenie implementacji jako zadania asynchronicznego lub w tle.
- Optymalizacja zapytań do bazy danych przy dopasowywaniu produktów (wykorzystanie indeksów na `user_id` i `kategoria_id`).
- Ograniczenie wielkości przesyłanych plików, aby uniknąć przeciążenia systemu.
- Możliwe buforowanie wyników OCR dla paragonów o podobnej treści.

## 9. Etapy wdrożenia
1. **Utworzenie szkieletu endpointu:**  
   - Utworzenie nowego pliku w `src/pages/api/receipts/process.ts`.
   - Ustawienie metody HTTP (POST) oraz konfiguracja, m.in. `export const prerender = false`.

2. **Walidacja wejściowych danych:**  
   - Implementacja walidacji przy użyciu Zod w celu sprawdzenia obecności i poprawności przesłanego pliku.
   
3. **Obsługa uploadu pliku:**  
   - Konfiguracja parsowania multipart/form-data, aby poprawnie odebrać plik obrazu.

4. **Integracja z serwisem OCR:**  
   - Utworzenie lub rozszerzenie istniejącego serwisu `receipts.service.ts` w `src/lib/services` do obsługi OCR.
   - Implementacja logiki przetwarzania obrazu oraz ekstrakcji danych.

5. **Logika dopasowywania produktów:**  
   - Implementacja mechanizmu dopasowywania rozpoznanych produktów do bazy danych.
   - Korzystanie z istniejących typów `MatchedProductDTO` i `UnmatchedProductDTO`.

6. **Agregacja i generowanie podsumowania:**  
   - Grupowanie rozpoznanych produktów wg kategorii i obliczanie łącznych kosztów.
   - Formatowanie wyniku zgodnie z `ReceiptProcessingResponseDTO`.

7. **Obsługa błędów i logowanie:**  
   - Dodanie obsługi błędów z odpowiednimi kodami HTTP.
   - Rejestrowanie błędów do tabeli `ocr_error_logs` w przypadku niepowodzenia przetwarzania.

8. **Testy i walidacja:**  
   - Utworzenie testów jednostkowych i integracyjnych, aby upewnić się, że endpoint działa zgodnie z założeniami.
   - Testowanie różnych scenariuszy: poprawny upload, brak pliku, błędne dane oraz błędy serwera.

9. **Dokumentacja i wdrożenie:**  
   - Aktualizacja dokumentacji API.
   - Przeprowadzenie code review oraz wdrożenie endpointu do środowiska developerskiego.
