# Plan Testów dla Aplikacji "Home Budget"

**Wersja dokumentu:** 1.0  
**Data:** 2025-12-07

---

## 1. Wprowadzenie i Cele Testowania

### 1.1. Wprowadzenie

Niniejszy dokument przedstawia kompleksowy plan testów dla aplikacji "Home Budget". Aplikacja ta jest nowoczesnym narzędziem webowym zbudowanym w oparciu o technologie takie jak Astro, React, TypeScript, Supabase i Tailwind CSS. Główną funkcjonalnością aplikacji jest automatyzacja procesu kategoryzacji wydatków domowych poprzez przetwarzanie zdjęć paragonów za pomocą technologii OCR zintegrowanej z zewnętrznym dostawcą (OpenRouter). Użytkownicy mogą również zarządzać swoją bazą produktów i przeglądać podsumowania wydatków.

Plan testów jest kluczowym dokumentem, który definiuje strategię, zakres, zasoby i harmonogram działań testowych, mających na celu zapewnienie najwyższej jakości produktu końcowego.

### 1.2. Cele Testowania

Główne cele procesu testowego to:
*   **Weryfikacja funkcjonalna:** Upewnienie się, że wszystkie funkcje aplikacji działają zgodnie z dokumentacją i wymaganiami biznesowymi, w szczególności w obszarach uwierzytelniania, przetwarzania paragonów i zarządzania produktami.
*   **Zapewnienie jakości i niezawodności:** Identyfikacja, raportowanie i śledzenie defektów w celu ich eliminacji przed wdrożeniem produkcyjnym.
*   **Ocena użyteczności:** Sprawdzenie, czy interfejs użytkownika jest intuicyjny, spójny i przyjazny dla użytkownika końcowego.
*   **Weryfikacja integracji:** Potwierdzenie poprawnej komunikacji pomiędzy frontendem, backendem (API), bazą danych Supabase oraz zewnętrzną usługą OCR (OpenRouter).
*   **Zapewnienie bezpieczeństwa:** Weryfikacja podstawowych mechanizmów bezpieczeństwa, w tym autoryzacji i separacji danych użytkowników.
*   **Ocena wydajności:** Wstępna ocena czasu odpowiedzi kluczowych operacji, takich jak przetwarzanie paragonu i ładowanie listy produktów.

---

## 2. Zakres Testów

### 2.1. Funkcjonalności objęte testami

Testom poddane zostaną następujące moduły i funkcjonalności aplikacji:

*   **Moduł uwierzytelniania:**
    *   Rejestracja nowego użytkownika.
    *   Logowanie i wylogowywanie.
    *   Mechanizm resetowania hasła (dwuetapowy).
    *   Ochrona tras wymagających autentykacji.
*   **Moduł Dashboard (Przetwarzanie paragonów):**
    *   Przesyłanie pliku graficznego (paragonu) z walidacją formatu (JPEG/PNG) i rozmiaru (max. 10MB).
    *   Proces przetwarzania OCR i obsługa jego stanów (ładowanie, błąd, sukces).
    *   Weryfikacja i prezentacja wyników OCR (produkty dopasowane i niedopasowane).
    *   Automatyczne zapisywanie niedopasowanych produktów po przypisaniu kategorii.
    *   Dynamiczne przeliczanie i wyświetlanie podsumowania wydatków.
*   **Moduł Zarządzania Produktami:**
    *   Wyświetlanie listy produktów z paginacją.
    *   Wyszukiwanie i filtrowanie produktów po nazwie.
    *   Edycja kategorii produktu w trybie "inline".
    *   Usuwanie produktu z dialogiem potwierdzającym.
*   **Backend (API Endpoints):**
    *   Wszystkie endpointy w `src/pages/api/` zostaną przetestowane pod kątem poprawności działania, walidacji danych wejściowych i obsługi błędów.

### 2.2. Funkcjonalności wyłączone z testów

W bieżącej fazie testów, następujące obszary zostaną pominięte:

*   **Zaawansowane testy wydajnościowe i obciążeniowe:** Skupimy się na funkcjonalności, a nie na skalowalności pod dużym obciążeniem.
*   **Testy penetracyjne i zaawansowane testy bezpieczeństwa:** Podstawowe mechanizmy bezpieczeństwa zostaną zweryfikowane, ale pełny audyt bezpieczeństwa jest poza zakresem.
*   **Testy kompatybilności na szerokiej gamie przeglądarek i urządzeń:** Testy będą prowadzone na najnowszych wersjach Google Chrome i Firefox.
*   **Dokładność modelu OCR (OpenRouter):** Testujemy integrację z usługą, a nie jakość samego modelu AI.

---

## 3. Typy Testów

W projekcie zostaną przeprowadzone następujące rodzaje testów, aby zapewnić kompleksowe pokrycie:

*   **Testy Jednostkowe (Unit Tests):**
    *   **Cel:** Weryfikacja poprawności działania pojedynczych funkcji, hooków i serwisów w izolacji.
    *   **Zakres:** Funkcje w `lib/utils.ts`, logika w `lib/services/*.ts`, customowe hooki React (`hooks/*`), schematy walidacji Zod.
    *   **Przykład:** Test `ProductsService.createProduct` weryfikujący logikę biznesową (np. obsługę duplikatów).

*   **Testy Komponentów (Component Tests):**
    *   **Cel:** Testowanie poszczególnych komponentów React (`.tsx`) w izolacji, weryfikacja ich renderowania, stanu i interakcji.
    *   **Zakres:** Komponenty interaktywne w `src/components/`, np. `LoginForm`, `UploadDropzone`, `ProductsTable`.
    *   **Przykład:** Test komponentu `UploadDropzone` sprawdzający, czy poprawnie waliduje typ i rozmiar pliku.

*   **Testy Integracyjne (Integration Tests):**
    *   **Cel:** Sprawdzenie współpracy pomiędzy różnymi częściami systemu.
    *   **Zakres:**
        *   Interakcja komponentów frontendowych z endpointami API.
        *   Logika serwisów backendowych w połączeniu z bazą danych Supabase.
        *   Integracja z zewnętrznym API (OpenRouter).
    *   **Przykład:** Test endpointu `POST /api/receipts/process`, który wywołuje `ReceiptsService`, integruje się z OpenRouter i Supabase.

*   **Testy End-to-End (E2E):**
    *   **Cel:** Symulacja pełnych scenariuszy użytkownika w rzeczywistym środowisku przeglądarkowym.
    *   **Zakres:** Kluczowe ścieżki użytkownika, np. od rejestracji, przez zalogowanie, wgranie paragonu, kategoryzację produktu, aż po jego edycję na liście produktów.
    *   **Przykład:** Zautomatyzowany scenariusz, w którym użytkownik loguje się, przesyła plik `paragon.jpg`, przypisuje kategorię do jednego z produktów, a następnie przechodzi do widoku produktów i weryfikuje, czy nowo dodany produkt jest widoczny na liście.

*   **Testy Manualne i Eksploracyjne:**
    *   **Cel:** Wykrywanie błędów trudnych do zautomatyzowania, ocena ogólnej użyteczności (UX) i spójności wizualnej.
    *   **Zakres:** Cała aplikacja, ze szczególnym uwzględnieniem responsywności interfejsu i obsługi nietypowych przypadków brzegowych.

---

## 4. Scenariusze Testowe dla Kluczowych Funkcjonalności

Poniżej przedstawiono ogólne scenariusze testowe dla głównych modułów aplikacji. Każdy scenariusz zostanie rozwinięty w szczegółowe przypadki testowe.

### 4.1. Uwierzytelnianie

| ID Scenariusza | Opis | Oczekiwany Rezultat | Priorytet |
| :------------- | :--- | :--- | :--- |
| AUTH-01 | **Pomyślna rejestracja użytkownika:** Użytkownik podaje prawidłowy email i hasło, a następnie zatwierdza formularz. | Konto zostaje utworzone, użytkownik jest automatycznie zalogowany i przekierowany na stronę główną (Dashboard). | Krytyczny |
| AUTH-02 | **Próba rejestracji z istniejącym emailem:** Użytkownik próbuje założyć konto na adres email, który już istnieje w systemie. | Wyświetlony zostaje komunikat błędu "Konto z tym adresem email już istnieje". | Wysoki |
| AUTH-03 | **Pomyślne logowanie:** Zarejestrowany użytkownik podaje prawidłowe dane logowania. | Użytkownik zostaje zalogowany i przekierowany na stronę główną. | Krytyczny |
| AUTH-04 | **Próba logowania z błędnym hasłem:** Użytkownik podaje prawidłowy email, ale błędne hasło. | Wyświetlony zostaje komunikat błędu "Nieprawidłowy email lub hasło". | Wysoki |
| AUTH-05 | **Pomyślne wylogowanie:** Zalogowany użytkownik klika przycisk "Wyloguj się". | Sesja użytkownika zostaje zakończona, a on sam przekierowany na stronę logowania. | Krytyczny |
| AUTH-06 | **Pełny cykl resetowania hasła:** Użytkownik zgłasza chęć resetu hasła, klika w link otrzymany mailem i ustawia nowe hasło. | Użytkownik może zalogować się do aplikacji przy użyciu nowego hasła. | Wysoki |

### 4.2. Dashboard i Przetwarzanie Paragonów (OCR)

| ID Scenariusza | Opis | Oczekiwany Rezultat | Priorytet |
| :------------- | :--- | :--- | :--- |
| DASH-01 | **Przesłanie poprawnego paragonu:** Użytkownik przesyła plik JPG/PNG o rozmiarze < 10MB. | Rozpoczyna się proces przetwarzania OCR. Po jego zakończeniu wyświetlana jest lista produktów dopasowanych i niedopasowanych oraz podsumowanie. | Krytyczny |
| DASH-02 | **Próba przesłania pliku o nieprawidłowym formacie:** Użytkownik próbuje przesłać plik PDF. | Wyświetlany jest komunikat błędu walidacji informujący o nieprawidłowym formacie pliku. | Wysoki |
| DASH-03 | **Próba przesłania zbyt dużego pliku:** Użytkownik próbuje przesłać obraz o rozmiarze > 10MB. | Wyświetlany jest komunikat błędu walidacji informujący o przekroczeniu maksymalnego rozmiaru pliku. | Wysoki |
| DASH-04 | **Kategoryzacja niedopasowanego produktu:** Użytkownik wybiera kategorię dla produktu z listy "unmatched". | Produkt jest zapisywany w bazie danych (POST `/api/products`), wiersz aktualizuje swój status na "Zapisano", a podsumowanie wydatków jest przeliczane. | Krytyczny |
| DASH-05 | **Obsługa błędu podczas przetwarzania OCR:** Zewnętrzne API zwraca błąd 500. | Proces przetwarzania zostaje przerwany, a użytkownikowi wyświetlany jest komunikat o błędzie z możliwością ponowienia próby. | Wysoki |
| DASH-06 | **Resetowanie widoku:** Po przetworzeniu paragonu użytkownik klika "Wgraj kolejny paragon". | Widok wraca do stanu początkowego (uploader plików), a poprzednie wyniki są czyszczone. | Średni |

### 4.3. Zarządzanie Produktami

| ID Scenariusza | Opis | Oczekiwany Rezultat | Priorytet |
| :------------- | :--- | :--- | :--- |
| PROD-01 | **Wyświetlanie i paginacja listy produktów:** Użytkownik przechodzi na stronę produktów i nawiguje pomiędzy stronami. | Wyświetlana jest poprawna, posortowana alfabetycznie lista produktów. Przyciski paginacji działają prawidłowo. | Wysoki |
| PROD-02 | **Wyszukiwanie produktu:** Użytkownik wpisuje frazę w polu wyszukiwania. | Lista produktów jest dynamicznie filtrowana, wyświetlając tylko produkty pasujące do zapytania. | Wysoki |
| PROD-03 | **Edycja kategorii produktu:** Użytkownik zmienia kategorię dla jednego z produktów w tabeli. | Kategoria produktu zostaje zaktualizowana (PUT `/api/products/[id]`). Zmiana jest od razu widoczna w UI (optimistic update). | Wysoki |
| PROD-04 | **Usuwanie produktu:** Użytkownik klika ikonę usuwania, a następnie potwierdza operację w oknie dialogowym. | Produkt zostaje usunięty z bazy danych (DELETE `/api/products/[id]`) i znika z listy. | Wysoki |
| PROD-05 | **Wyświetlanie pustego stanu:** Użytkownik (nowy lub po usunięciu wszystkich produktów) wchodzi na stronę produktów. | Wyświetlany jest odpowiedni komunikat "Brak produktów" lub "Brak wyników wyszukiwania". | Średni |

---

## 5. Środowisko Testowe

*   **Infrastruktura:** Testy będą przeprowadzane na dedykowanej instancji deweloperskiej Supabase, odizolowanej od środowiska produkcyjnego. Zapewni to spójność danych i możliwość ich swobodnego modyfikowania.
*   **Dane testowe:** Zostanie przygotowany zestaw danych testowych, w tym:
    *   Konta użytkowników testowych z różnymi uprawnieniami (jeśli dotyczy).
    *   Zestaw predefiniowanych produktów w bazie danych.
    *   Przykładowe pliki paragonów (prawidłowe, nieczytelne, bez produktów, z rabatami).
*   **Przeglądarki:**
    *   Google Chrome (najnowsza wersja).
    *   Mozilla Firefox (najnowsza wersja).
*   **Systemy operacyjne:** Windows 11, macOS (najnowsza wersja).

---

## 6. Narzędzia do Testowania

| Narzędzie | Zastosowanie |
| :--- | :--- |
| **Vitest** | Framework do uruchamiania testów jednostkowych i komponentowych. Zapewnia szybkie i niezawodne środowisko testowe dla kodu JavaScript/TypeScript i komponentów React. |
| **React Testing Library** | Biblioteka do testowania komponentów React, promująca dobre praktyki i testowanie z perspektywy użytkownika. |
| **Playwright / Cypress** | Narzędzie do automatyzacji testów End-to-End. Umożliwia symulację interakcji użytkownika w przeglądarce i weryfikację pełnych przepływów aplikacji. |
| **Mock Service Worker (MSW)** | Narzędzie do mockowania API. Używane w testach jednostkowych i komponentowych do symulowania odpowiedzi z API backendu oraz zewnętrznych usług (np. OpenRouter). |
| **Storybook** | Narzędzie do dewelopmentu i testowania komponentów UI w izolacji. Może być wykorzystane do manualnych testów wizualnych oraz automatycznych testów regresji wizualnej. |
| **GitHub Issues / Jira** | System do śledzenia i zarządzania zgłoszonymi błędami. |

---

## 7. Harmonogram Testów

Harmonogram testów będzie realizowany równolegle z cyklem rozwojowym, zgodnie z podejściem zwinnym.

| Faza | Czas trwania | Kluczowe Działania |
| :--- | :--- | :--- |
| **Sprint 1: Uwierzytelnianie i Podstawy Produktów** | Tydzień 1-2 | - Pisanie i wykonanie testów jednostkowych dla `auth.validation.ts` i `products.service.ts`.<br>- Testy komponentów dla `LoginForm`, `RegisterForm`.<br>- Testy E2E dla pełnego cyklu rejestracji i logowania. |
| **Sprint 2: Dashboard i OCR** | Tydzień 3-4 | - Testy jednostkowe dla `receipts.service.ts` (z zamockowanym OpenRouter).<br>- Testy komponentów dla `UploadDropzone`, `VerificationList`.<br>- Testy integracyjne dla endpointu `POST /api/receipts/process`.<br>- Testy E2E dla scenariusza przesyłania i weryfikacji paragonu. |
| **Sprint 3: Zaawansowane Zarządzanie Produktami** | Tydzień 5 | - Testy komponentów dla `ProductsTable`, `PaginationControls`, `ConfirmDialog`.<br>- Testy E2E dla wyszukiwania, edycji i usuwania produktów. |
| **Faza Testów Regresji i Stabilizacji** | Tydzień 6 | - Pełne wykonanie wszystkich zautomatyzowanych testów (jednostkowych, integracyjnych, E2E).<br>- Przeprowadzenie testów eksploracyjnych.<br>- Weryfikacja wszystkich krytycznych i wysokich błędów. |

---

## 8. Kryteria Akceptacji Testów

### 8.1. Kryteria Wejścia (Rozpoczęcia Testów)

*   Zakończenie developmentu danej funkcjonalności.
*   Pomyślne przejście wszystkich testów jednostkowych napisanych przez deweloperów.
*   Dostępność stabilnego środowiska testowego.
*   Dostępność dokumentacji technicznej i przypadków użycia.

### 8.2. Kryteria Wyjścia (Zakończenia Testów)

*   Wykonanie 100% zaplanowanych przypadków testowych dla danego modułu.
*   Osiągnięcie pokrycia kodu testami jednostkowymi na poziomie min. 80% dla logiki biznesowej (serwisy).
*   Brak otwartych błędów o priorytecie Krytycznym lub Wysokim.
*   Wszystkie znane błędy o niższych priorytetach są udokumentowane i zaakceptowane przez Product Ownera do ewentualnej naprawy w przyszłych iteracjach.

---

## 9. Role i Odpowiedzialności

| Rola | Odpowiedzialność |
| :--- | :--- |
| **Deweloper** | - Tworzenie i utrzymanie testów jednostkowych dla własnego kodu.<br>- Naprawa błędów zgłoszonych przez zespół QA.<br>- Uczestnictwo w przeglądach kodu pod kątem testowalności. |
| **Inżynier QA / Tester** | - Projektowanie, tworzenie i utrzymanie planu testów, scenariuszy i przypadków testowych.<br>- Implementacja i utrzymanie testów automatycznych (integracyjnych i E2E).<br>- Przeprowadzanie testów manualnych i eksploracyjnych.<br>- Raportowanie i weryfikacja błędów. |
| **Product Owner / Manager Projektu** | - Definiowanie wymagań i kryteriów akceptacji.<br>- Priorytetyzacja błędów i funkcjonalności do testowania.<br>- Ostateczna akceptacja produktu po zakończeniu testów. |

---

## 10. Procedury Raportowania Błędów

Każdy zidentyfikowany błąd musi zostać zgłoszony w systemie do śledzenia błędów (np. GitHub Issues) i powinien zawierać następujące informacje:

*   **Tytuł:** Zwięzły i jednoznaczny opis problemu.
*   **Środowisko:** Wersja aplikacji, przeglądarka, system operacyjny.
*   **Kroki do odtworzenia:** Szczegółowa, numerowana lista kroków prowadzących do wystąpienia błędu.
*   **Obserwowany rezultat:** Co faktycznie się stało.
*   **Oczekiwany rezultat:** Co powinno się stać zgodnie z wymaganiami.
*   **Priorytet/Waga:** (np. Krytyczny, Wysoki, Średni, Niski) w celu określenia wpływu błędu na działanie systemu.
*   **Załączniki:** Zrzuty ekranu, nagrania wideo, logi z konsoli, które mogą pomóc w diagnozie problemu.