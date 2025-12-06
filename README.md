# HomeBudget OCR

[![Node Version](https://img.shields.io/badge/node-22.14.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Nowoczesna aplikacja webowa do automatycznego przetwarzania paragonów i śledzenia wydatków z wykorzystaniem technologii OCR.

## 📋 Spis treści

- [Opis projektu](#opis-projektu)
- [Stack technologiczny](#stack-technologiczny)
- [Uruchomienie lokalne](#uruchomienie-lokalne)
- [Dostępne skrypty](#dostępne-skrypty)
- [Zakres projektu](#zakres-projektu)
- [Status projektu](#status-projektu)
- [Historyjki użytkowników](#historyjki-użytkowników)
- [Metryki sukcesu](#metryki-sukcesu)
- [Licencja](#licencja)

## 📖 Opis projektu

HomeBudget OCR to aplikacja webowa, która upraszcza śledzenie wydatków poprzez automatyzację procesu przetwarzania paragonów. Aplikacja rozwiązuje powszechny problem użytkowników: ręczne wprowadzanie wydatków do aplikacji budżetowych jest czasochłonne i podatne na błędy, co prowadzi do rezygnacji z procesu.

### Kluczowe funkcje

- **Przesyłanie i OCR paragonów**: Prześlij zdjęcie paragonu z Biedronki i automatycznie wyodrębnij nazwy produktów oraz ceny dzięki OCR opartemu na AI
- **Inteligentna kategoryzacja**: Automatyczne dopasowanie produktów do kategorii z wrażliwym na wielkość liter porównaniem z Twoją osobistą bazą produktów
- **Wizualny interfejs weryfikacji**: 
  - Rozpoznane produkty podświetlone na zielono
  - Nierozpoznane produkty podświetlone na pomarańczowo do ręcznego przypisania kategorii
- **Podsumowanie wydatków**: Jednorazowy wykaz wydatków według predefiniowanych kategorii
- **Zarządzanie produktami**: Pełny interfejs CRUD do zarządzania mapowaniami produktów i kategorii z funkcjami wyszukiwania, edycji i usuwania
- **Uwierzytelnianie użytkowników**: Bezpieczna rejestracja, logowanie i zarządzanie sesją z prywatnymi bazami produktów dla każdego użytkownika

## 🛠 Stack technologiczny

### Frontend
- **[Astro 5](https://astro.build/)** - Szybki, wydajny generator stron statycznych z minimalnym JavaScript
- **[React 19](https://react.dev/)** - Interaktywne komponenty UI
- **[TypeScript 5](https://www.typescriptlang.org/)** - Statyczne typowanie i ulepszone wsparcie IDE
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Framework CSS oparty na klasach użytkowych
- **[Shadcn/ui](https://ui.shadcn.com/)** - Biblioteka dostępnych komponentów React

### Backend
- **[Supabase](https://supabase.com/)** - Backend-as-a-Service
  - Baza danych PostgreSQL
  - Wbudowane uwierzytelnianie użytkowników
  - Open-source z możliwością self-hostingu
  - Wsparcie SDK w wielu językach

### Integracja AI
- **[Openrouter.ai](https://openrouter.ai/)** - Warstwa dostępu do modeli AI
  - Dostęp do wielu dostawców (OpenAI, Anthropic, Google i innych)
  - Limity finansowe dla kluczy API
  - Opłacalny dobór modeli

### Testowanie
- **[Vitest](https://vitest.dev/)** - Szybki framework do testów jednostkowych i komponentowych
- **[React Testing Library](https://testing-library.com/react)** - Testowanie komponentów z perspektywy użytkownika
- **[Mock Service Worker (MSW)](https://mswjs.io/)** - Mockowanie API w testach
- **[Playwright](https://playwright.dev/)** - Testy End-to-End i automatyzacja przeglądarki

### CI/CD i Hosting
- **[GitHub Actions](https://github.com/features/actions)** - Pipeline'y ciągłej integracji i wdrażania
- **[DigitalOcean](https://www.digitalocean.com/)** - Hosting aplikacji oparty na Dockerze

## 🚀 Uruchomienie lokalne

### Wymagania wstępne

- **Node.js**: Wersja 22.14.0 (użyj `nvm` do zarządzania wersjami)
- **npm**: Dołączone do Node.js
- **Konto Supabase**: Do konfiguracji bazy danych i uwierzytelniania

### Kroki instalacji

1. **Sklonuj repozytorium:**
   ```bash
   git clone https://github.com/yourusername/my-home-budget.git
   cd my-home-budget
   ```

2. **Użyj odpowiedniej wersji Node.js:**
   ```bash
   nvm use
   ```
   To automatycznie użyje wersji Node.js określonej w `.nvmrc` (22.14.0)

3. **Zainstaluj zależności:**
   ```bash
   npm install
   ```

4. **Skonfiguruj zmienne środowiskowe:**
   Utwórz plik `.env` w głównym katalogu projektu z Twoimi danymi dostępowymi do Supabase i kluczami API:
   ```env
   SUPABASE_URL=twoj_url_supabase
   SUPABASE_ANON_KEY=twoj_klucz_supabase
   OPENROUTER_API_KEY=twoj_klucz_openrouter
   ```

5. **Uruchom migracje bazy danych:**
   ```bash
   # Instrukcje dotyczące uruchamiania migracji Supabase
   ```

6. **Uruchom serwer deweloperski:**
   ```bash
   npm run dev
   ```
   Aplikacja będzie dostępna pod adresem `http://localhost:4321`

## 📜 Dostępne skrypty

### Skrypty deweloperskie

| Skrypt | Opis |
|--------|------|
| `npm run dev` | Uruchamia serwer deweloperski Astro z hot reload |
| `npm run build` | Buduje projekt do wersji produkcyjnej |
| `npm run preview` | Serwuje lokalnie build produkcyjny do testowania |
| `npm run astro` | Uruchamia komendy CLI Astro |

### Skrypty testowe

#### Testy jednostkowe i integracyjne
| Skrypt | Opis |
|--------|------|
| `npm test` | Uruchamia Vitest w trybie watch |
| `npm run test:ui` | Otwiera UI Vitest do interaktywnego testowania |
| `npm run test:run` | Uruchamia wszystkie testy jeden raz |
| `npm run test:coverage` | Uruchamia testy z raportem pokrycia |
| `npm run test:watch` | Uruchamia testy w trybie watch |
| `npm run test:unit` | Uruchamia tylko testy jednostkowe w `src/` |
| `npm run test:integration` | Uruchamia tylko testy integracyjne w `__tests__/` |

#### Testy End-to-End
| Skrypt | Opis |
|--------|------|
| `npm run e2e` | Uruchamia wszystkie testy E2E Playwright |
| `npm run e2e:ui` | Otwiera UI Playwright do interaktywnego testowania E2E |
| `npm run e2e:headed` | Uruchamia testy E2E z widoczną przeglądarką |
| `npm run e2e:debug` | Uruchamia testy E2E w trybie debugowania |
| `npm run e2e:report` | Wyświetla raport testów Playwright |
| `npm run e2e:codegen` | Generuje testy E2E automatycznie poprzez nagrywanie |

#### Testy łączone
| Skrypt | Opis |
|--------|------|
| `npm run test:all` | Uruchamia wszystkie testy jednostkowe, integracyjne i E2E |

### Skrypty jakości kodu

| Skrypt | Opis |
|--------|------|
| `npm run lint` | Analizuje kod za pomocą ESLint |
| `npm run lint:fix` | Automatycznie naprawia problemy ESLint |
| `npm run format` | Formatuje kod za pomocą Prettier |

## 🎯 Zakres projektu

### Co zawiera MVP

✅ **Uwierzytelnianie użytkowników**
- Rejestracja za pomocą adresu e-mail i hasła
- Bezpieczne logowanie i zarządzanie sesją
- Prywatna baza produktów dla każdego użytkownika

✅ **Przetwarzanie paragonów**
- Interfejs przesyłania zdjęć (tylko paragony z Biedronki)
- OCR oparty na AI do wyodrębniania nazw produktów i cen
- Obsługa błędów z przyjaznymi dla użytkownika komunikatami

✅ **Automatyczne dopasowanie produktów**
- Porównanie wrażliwe na wielkość liter z istniejącą bazą produktów
- Wizualne wskaźniki dla dopasowanych (zielony) i niedopasowanych (pomarańczowy) produktów

✅ **Ręczna weryfikacja i kategoryzacja**
- Interaktywny interfejs weryfikacji
- Rozwijana lista wyboru kategorii dla nierozpoznanych produktów
- Zapisywanie nowych mapowań produkt-kategoria

✅ **Podsumowanie wydatków**
- Jednorazowe generowanie podsumowania według kategorii
- Brak trwałego przechowywania podsumowań

✅ **Zarządzanie produktami (CRUD)**
- Dedykowana strona zarządzania produktami
- Wyszukiwanie produktów po nazwie
- Edycja przypisań kategorii produktów
- Usuwanie produktów z bazy danych

✅ **Predefiniowane kategorie**
Statyczne kategorie (alfabetycznie):
1. Alkohol i używki
2. Kosmetyki i przybory toaletowe
3. Napoje
4. Pozostałe
5. Rozrywka
6. Słodycze i przekąski
7. Suplemencja
8. Środki czystości
9. Ubranie i obuwie
10. Zakupy spożywcze

### Co NIE jest zawarte (poza zakresem)

❌ Trwałe przechowywanie podsumowań wydatków  
❌ Zaawansowana analityka i wykresy  
❌ Normalizacja nazw produktów  
❌ Obsługa wielu sklepów (tylko Biedronka)  
❌ Obsługa wielu języków  
❌ Aplikacje mobilne  
❌ Kategorie definiowane przez użytkownika  
❌ Modyfikacja kategorii przez użytkowników  

## 📊 Status projektu

**Aktualny etap:** Minimum Viable Product (MVP) - Aktywny rozwój

### Zaimplementowane funkcje
- ✅ Rejestracja i uwierzytelnianie użytkowników
- ✅ Interfejs przesyłania paragonów
- ✅ Integracja OCR z modelami AI
- ✅ Automatyczna kategoryzacja produktów
- ✅ Interfejs weryfikacji z wizualnymi wskaźnikami
- ✅ Generowanie jednorazowego podsumowania wydatków
- ✅ Operacje CRUD zarządzania produktami
- ✅ Kompleksowe pokrycie testami (jednostkowe, integracyjne, E2E)
- ✅ Pipeline CI/CD z GitHub Actions

### Plan rozwoju
- 🔄 Optymalizacje wydajności
- 🔄 Ulepszona obsługa błędów i logowanie
- 🔄 Ulepszenia doświadczenia użytkownika
- 📋 W przyszłości: Obsługa wielu sklepów
- 📋 W przyszłości: Zaawansowana analityka i raportowanie
- 📋 W przyszłości: Aplikacja mobilna

## 📝 Historyjki użytkowników

<details>
<summary><strong>US-001: Rejestracja konta</strong></summary>

**Jako** nowy użytkownik  
**Chcę** zarejestrować konto  
**Aby** mieć dostęp do własnej bazy produktów i móc analizować swoje paragony

**Kryteria akceptacji:**
- Formularz rejestracyjny zawiera pola na adres e-mail i hasło
- Po poprawnym wypełnieniu formularza i weryfikacji danych konto jest aktywowane
- Użytkownik otrzymuje potwierdzenie pomyślnej rejestracji i zostaje zalogowany
</details>

<details>
<summary><strong>US-002: Logowanie do aplikacji</strong></summary>

**Jako** zarejestrowany użytkownik  
**Chcę** móc się zalogować  
**Aby** mieć dostęp do mojej bazy produktów i móc analizować paragony

**Kryteria akceptacji:**
- Po podaniu prawidłowych danych logowania użytkownik zostaje przekierowany do strony dashboard, gdzie może załadować zdjęcie paragonu
- Błędne dane logowania wyświetlają komunikat o nieprawidłowych danych
- Dane dotyczące logowania przechowywane są w bezpieczny sposób
</details>

<details>
<summary><strong>US-003: Przesyłanie zdjęcia paragonu i OCR</strong></summary>

**Jako** zalogowany użytkownik  
**Chcę** przesłać zdjęcie paragonu  
**Aby** system mógł automatycznie odczytać nazwy produktów i ceny za pomocą technologii OCR

**Kryteria akceptacji:**
- Użytkownik ma możliwość przesłania zdjęcia paragonu (tylko z Biedronki)
- System przesyła zdjęcie do modelu AI, który zwraca listę pozycji z nazwami i cenami
- W przypadku nieczytelności zdjęcia, system wyświetla czytelny komunikat o błędzie
</details>

<details>
<summary><strong>US-004: Automatyczne dopasowanie produktów do kategorii</strong></summary>

**Jako** zalogowany użytkownik  
**Chcę**, aby system automatycznie dopasowywał rozpoznane produkty do istniejących w bazie kategorii  
**Aby** szybko potwierdzić poprawność danych

**Kryteria akceptacji:**
- System porównuje rozpoznane pozycje z zapisanymi w bazie, uwzględniając wielkość liter
- Pozycje automatycznie dopasowane do bazy są oznaczone zielonym tłem w interfejsie weryfikacji
</details>

<details>
<summary><strong>US-005: Ręczne przypisanie kategorii do nowych produktów</strong></summary>

**Jako** zalogowany użytkownik  
**Chcę** móc ręcznie przypisać kategorię do nowych, nierozpoznanych pozycji  
**Aby** uwzględnić je w podsumowaniu wydatków

**Kryteria akceptacji:**
- Nierozpoznane pozycje są oznaczone pomarańczowym tłem w interfejsie weryfikacji
- Użytkownik ma możliwość wyboru kategorii z rozwijanej listy dla każdej nierozpoznanej pozycji
- Po zatwierdzeniu przypisania kategorii, nowy produkt zostaje zapisany w bazie
</details>

<details>
<summary><strong>US-006: Wyświetlanie podsumowania wydatków</strong></summary>

**Jako** zalogowany użytkownik  
**Chcę** otrzymać podsumowanie wydatków według kategorii po przetworzeniu paragonu  
**Aby** szybko ocenić rozkład wydatków

**Kryteria akceptacji:**
- System wyświetla listę kategorii z sumą wydatków dla każdej kategorii
- Podsumowanie jest generowane po zakończeniu weryfikacji pozycji przez użytkownika
</details>

<details>
<summary><strong>US-007: Zarządzanie produktami (CRUD)</strong></summary>

**Jako** zalogowany użytkownik  
**Chcę** mieć możliwość przeglądania, wyszukiwania, edycji oraz usuwania zapisanych produktów  
**Aby** zarządzać moją bazą mapowań produktów

**Kryteria akceptacji:**
- Użytkownik ma dostęp do dedykowanej strony zarządzania produktami
- System umożliwia wyszukiwanie produktów według nazwy
- Użytkownik może edytować kategorię produktu lub usunąć produkt z bazy
</details>

## 📈 Metryki sukcesu

Aplikacja ma na celu osiągnięcie następujących wskaźników wydajności i użyteczności:

| Metryka | Cel | Opis |
|---------|-----|------|
| **Czas przetwarzania** | < 2 minuty | Użytkownik otrzymuje podsumowanie wydatków dla paragonu zawierającego 10+ pozycji |
| **Efektywność weryfikacji** | < 5 minut | Użytkownik kończy proces weryfikacji (przypisania kategorii) dla 10+ nierozpoznanych pozycji |
| **Skuteczność automatycznego dopasowania** | ≥ 90% | Procent rozpoznanych pozycji poprawnie dopasowanych do właściwych kategorii |
| **Czytelność komunikatów o błędach** | 100% | Użytkownicy otrzymują jasne, zrozumiałe komunikaty o błędach w przypadku problemów z OCR |

## 📄 Licencja

Ten projekt jest licencjonowany na warunkach **licencji MIT**.

---

**Stworzone z ❤️ przy użyciu Astro, React i Supabase**
