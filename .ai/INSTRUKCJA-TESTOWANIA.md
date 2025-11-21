# Instrukcja testowania Dashboard - Krok po kroku

## Przygotowanie środowiska

### 1. Sprawdź czy masz uruchomioną bazę danych Supabase

```bash
cd /Users/gdrzazga/Desktop/10xdevs/Projekty/my-home-budget
npx supabase status
```

**Oczekiwany wynik:** Status pokazuje że wszystkie serwisy są uruchomione
- API URL: `http://127.0.0.1:54321`
- DB URL: `postgresql://...`
- Studio URL: `http://127.0.0.1:54323`

**Jeśli nie działa:**
```bash
npx supabase start
```

### 2. Uruchom serwer deweloperski Astro

```bash
npm run dev
```

**Oczekiwany wynik:**
```
🚀 astro v5.5.5 started in XXms

  ┃ Local    http://localhost:4321/
  ┃ Network  use --host to expose
```

### 3. Otwórz aplikację w przeglądarce

1. Otwórz przeglądarkę (najlepiej Chrome lub Firefox z DevTools)
2. Przejdź do: `http://localhost:4321`
3. Otwórz konsołę deweloperską (F12 lub Cmd+Option+I na Mac)

## Test 1: Sprawdzenie ładowania strony

### Co sprawdzamy:
- Czy strona się załadowała
- Czy kategorie zostały pobrane z API
- Czy nie ma błędów w konsoli

### Kroki:
1. ✅ Sprawdź czy widać nagłówek: **"Dashboard Budżetu Domowego"**
2. ✅ Sprawdź czy widać kartę z napisem **"Wgraj paragon"**
3. ✅ Sprawdź czy widać przycisk **"Wybierz plik"**
4. ✅ Otwórz konsolę (F12) i przejdź do zakładki **Network**
5. ✅ Odśwież stronę (Cmd+R lub Ctrl+R)
6. ✅ Sprawdź czy widać request do `/api/categories` ze statusem **200 OK**
7. ✅ Kliknij na ten request i sprawdź w zakładce **Response** czy są kategorie:
   ```json
   {
     "categories": [
       { "id": "...", "nazwa_kategorii": "Alkohol i używki" },
       { "id": "...", "nazwa_kategorii": "Kosmetyki i przybory toaletowe" },
       ...
     ]
   }
   ```

### ✅ Test zaliczony jeśli:
- Strona się załadowała
- Request do `/api/categories` zwrócił 200 OK
- W konsoli nie ma błędów (czerwone komunikaty)

---

## Test 2: Walidacja pliku - Nieprawidłowy typ

### Co sprawdzamy:
- Walidację typu pliku
- Komunikaty błędów

### ⚠️ UWAGA - Prawidłowe zachowanie:
Przeglądarka **automatycznie filtruje** pliki w oknie wyboru dzięki atrybutowi `accept="image/jpeg,image/png"`.
To oznacza, że **NIE ZOBACZYSZ** plików innego typu (PDF, TXT, DOCX) w oknie wyboru pliku!

**To jest FEATURE, nie bug** - chroni użytkownika przed przypadkowym wybraniem złego pliku.

### Kroki (opcjonalne):
Jeśli chcesz przetestować komunikat błędu:
1. ✅ Otwórz DevTools (F12) → zakładka Console
2. ✅ Wklej poniższy kod (symuluje wybór złego pliku):
   ```javascript
   const input = document.querySelector('input[type="file"]');
   const fakeFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
   const dataTransfer = new DataTransfer();
   dataTransfer.items.add(fakeFile);
   input.files = dataTransfer.files;
   input.dispatchEvent(new Event('change', { bubbles: true }));
   ```
3. ✅ Sprawdź czy pojawił się **czerwony alert** z komunikatem:
   - Tytuł: **"Nieprawidłowy typ pliku"**
   - Treść zawiera: typ pliku i informację o dozwolonych formatach

### ✅ Test zaliczony jeśli:
- System file picker pokazuje **tylko** pliki JPEG/PNG ✅ (normalny przypadek)
- LUB Alert pojawia się po ręcznej symulacji (dev test)

---

## Test 3: Walidacja pliku - Za duży rozmiar

### Co sprawdzamy:
- Walidację rozmiaru pliku (max 10 MB)

### Kroki:
1. ✅ Przygotuj plik JPEG/PNG większy niż 10 MB
   - **Jeśli nie masz takiego pliku**, możesz pominąć ten test
2. ✅ Kliknij **"Wybierz plik"**
3. ✅ Wybierz duży plik
4. ✅ Sprawdź czy pojawił się **czerwony alert** z informacją o zbyt dużym pliku

### ✅ Test zaliczony jeśli:
- Alert pokazuje się dla dużych plików
- Rozmiar pliku jest pokazany w MB

---

## Test 4: Przepływ OCR - Przetwarzanie paragonu

### Co sprawdzamy:
- Upload prawidłowego pliku
- Loader podczas przetwarzania
- Wyświetlanie wyników

### Kroki:

#### 4.1. Upload pliku
1. ✅ Przygotuj **dowolny plik JPEG lub PNG** (nie musi być paragonem!)
   - Może to być zdjęcie z telefonu, screenshot, itp.
2. ✅ Kliknij **"Wybierz plik"**
3. ✅ Wybierz przygotowany plik

#### 4.2. Obserwacja loadera
1. ✅ Sprawdź czy pojawił się **loader** z napisem:
   - **"Przetwarzanie paragonu"**
   - **"Rozpoznajemy produkty i kategorie..."**
2. ✅ Sprawdź czy widać **animowany spinner** (kółko się kręci)
3. ✅ Otwórz zakładkę **Network** w DevTools
4. ✅ Sprawdź czy jest request do `/api/receipts/process` (status może być jeszcze Pending)

#### 4.3. Wyniki przetwarzania
Po kilku sekundach powinny pokazać się wyniki:

1. ✅ **Sekcja "Wyniki rozpoznawania"** powinna zawierać:

   **Produkty dopasowane (zielone tło):**
   - ✅ "Chleb pszenny" - 4.50 zł - z ikoną ✓
   - ✅ "Mleko 2%" - 3.20 zł - z ikoną ✓
   - ✅ "Coca-Cola 2L" - 5.99 zł - z ikoną ✓
   - ✅ Każdy ma napis: "Dopasowano automatycznie"

   **Produkty niedopasowane (pomarańczowe tło):**
   - ✅ "Baton czekoladowy" - 2.50 zł - z ikoną ⚠️
   - ✅ "Chipsy paprykowe" - 4.20 zł - z ikoną ⚠️
   - ✅ Każdy ma napis: "Wymagane przypisanie kategorii"
   - ✅ Każdy ma dropdown z kategoriami

2. ✅ **Sekcja "Podsumowanie wydatków"** powinna zawierać:
   - ✅ "Zakupy spożywcze" - 7.70 zł - 2 produkty
   - ✅ "Napoje" - 5.99 zł - 1 produkt
   - ✅ **"Suma całkowita: 13.69 zł"** (na czarnym tle)

3. ✅ Na dole powinien być przycisk **"Wgraj kolejny paragon"**

### ✅ Test zaliczony jeśli:
- Loader pojawił się i zniknął
- Widoczne są wszystkie produkty (3 matched, 2 unmatched)
- Podsumowanie pokazuje poprawne kwoty
- W Network request do `/api/receipts/process` ma status 200 OK

---

## Test 5: Przypisanie kategorii do produktu niedopasowanego

### Co sprawdzamy:
- Wybór kategorii z dropdowna
- Status zapisywania
- Wywołanie API do zapisania produktu

### Kroki:

#### 5.1. Pierwsza próba - sukces
1. ✅ Znajdź wiersz **"Baton czekoladowy"** (pomarańczowe tło)
2. ✅ Sprawdź czy dropdown jest aktywny (nie zablokowany)
3. ✅ Kliknij na dropdown
4. ✅ Sprawdź czy widzisz listę kategorii (powinna być "Słodycze i przekąski")
5. ✅ Wybierz kategorię **"Słodycze i przekąski"**
6. ✅ **NATYCHMIAST** obserwuj zmiany:
   - ✅ Dropdown powinien się **zablokować** (disabled)
   - ✅ Powinien pojawić się napis **"Zapisywanie..."** z spinnerem
7. ✅ Otwórz zakładkę **Network**
8. ✅ Sprawdź czy pojawił się request:
   - URL: `/api/products`
   - Method: **POST**
   - Status: **201 Created**
9. ✅ Kliknij na ten request i sprawdź w **Payload**:
   ```json
   {
     "nazwa_produktu": "Baton czekoladowy",
     "kategoria_id": "..." // UUID kategorii
   }
   ```
10. ✅ Po chwili powinien pojawić się napis **"Zapisano pomyślnie"** z ikoną ✓ (zielony tekst)
11. ✅ Dropdown powinien pozostać zablokowany

#### 5.2. Druga próba - duplikat (błąd)
1. ✅ Kliknij przycisk **"Wgraj kolejny paragon"** na dole
2. ✅ Wgraj kolejny plik (dowolny JPEG/PNG)
3. ✅ Poczekaj na wyniki
4. ✅ Znajdź ponownie **"Baton czekoladowy"**
5. ✅ Wybierz ponownie **"Słodycze i przekąski"**
6. ✅ Obserwuj komunikat błędu:
   - ✅ Powinien pojawić się **czerwony tekst** z ikoną ✗
   - ✅ Teraz powinien być czytelny komunikat typu: "Produkt 'Baton czekoladowy' już istnieje dla tego użytkownika"
7. ✅ W Network request do `/api/products` powinien mieć status **400**

### ⚠️ UWAGA - Prawidłowe zachowanie dropdowna po błędzie:
Po błędzie 400 (duplikat) dropdown **pozostaje aktywny**:
- ✅ **MOŻESZ** zmienić na inną kategorię (może pomyliłeś się przy pierwszym wyborze)
- ❌ **NIE MOŻESZ** cofnąć do "Wybierz kategorię..." (placeholder jest disabled)
- ✅ **MOŻESZ** spróbować ponownie z tą samą lub inną kategorią

**To jest celowe!** Daje użytkownikowi możliwość poprawy błędu.

### ✅ Test zaliczony jeśli:
- Pierwszy zapis działa (status "Zapisywanie..." → "Zapisano pomyślnie")
- Request POST `/api/products` ma status 201
- Duplikat zwraca błąd 400
- Komunikat błędu jest czytelny i szczegółowy (nie tylko "HTTP 400")
- Dropdown pozostaje aktywny po błędzie (możliwość zmiany kategorii)

---

## Test 6: Przypisanie kategorii do drugiego produktu

### Co sprawdzamy:
- Czy można zapisać wiele produktów
- Czy każdy wiersz działa niezależnie

### Kroki:
1. ✅ Po przetworzeniu paragonu znajdź **"Chipsy paprykowe"**
2. ✅ Wybierz kategorię (np. **"Słodycze i przekąski"**)
3. ✅ Sprawdź czy:
   - Dropdown się blokuje
   - Pojawia się "Zapisywanie..."
   - Po chwili "Zapisano pomyślnie"
4. ✅ Sprawdź w Network czy jest request POST `/api/products` ze statusem 201

### ✅ Test zaliczony jeśli:
- Drugi produkt zapisał się poprawnie
- Każdy wiersz działa niezależnie (jeden nie blokuje drugiego)

---

## Test 7: Restart przepływu

### Co sprawdzamy:
- Czy przycisk "Wgraj kolejny paragon" resetuje widok

### Kroki:
1. ✅ Na dole ekranu (po wynikach) kliknij **"Wgraj kolejny paragon"**
2. ✅ Sprawdź czy:
   - Wrócił widok z uploaderem
   - Stare wyniki zniknęły
   - Można wgrać nowy plik

### ✅ Test zaliczony jeśli:
- Widok wrócił do stanu początkowego
- Można wgrać kolejny paragon

---

## Test 8: Sprawdzenie zapisanych produktów w bazie

### Co sprawdzamy:
- Czy produkty faktycznie zapisały się w bazie danych

### Kroki:
1. ✅ Otwórz Supabase Studio: `http://127.0.0.1:54323`
2. ✅ Przejdź do zakładki **Table Editor**
3. ✅ Wybierz tabelę **`produkty`**
4. ✅ Sprawdź czy widzisz zapisane produkty:
   - "Baton czekoladowy" z przypisaną kategorią
   - "Chipsy paprykowe" z przypisaną kategorią
5. ✅ Sprawdź kolumny:
   - `nazwa_produktu` - nazwa produktu
   - `kategoria_id` - UUID kategorii
   - `user_id` - powinno być `00000000-0000-0000-0000-000000000001` (mock)
   - `created_at` - czas utworzenia
   - `updated_at` - czas aktualizacji

### ✅ Test zaliczony jeśli:
- Produkty są w bazie
- Mają przypisane kategorie
- Daty są poprawne

---

## Test 9: Obsługa błędów - Brak kategorii w API

### Co sprawdzamy:
- Reakcję UI na błędy serwera

### Symulacja błędu (opcjonalnie):
1. Zatrzymaj Supabase: `npx supabase stop`
2. Odśwież stronę
3. Sprawdź czy pojawił się czerwony alert: "Nie udało się pobrać kategorii"
4. Sprawdź czy przycisk "Wybierz plik" jest zablokowany
5. Uruchom ponownie Supabase: `npx supabase start`

---

## Checklist końcowy

Po zakończeniu wszystkich testów sprawdź:

### Funkcjonalność:
- [ ] Upload działa dla JPEG/PNG
- [ ] Walidacja blokuje nieprawidłowe pliki
- [ ] Loader pokazuje się podczas przetwarzania
- [ ] Wyniki OCR wyświetlają się poprawnie
- [ ] Matched products są na zielonym tle (read-only)
- [ ] Unmatched products są na pomarańczowym tle (edytowalne)
- [ ] Dropdown kategorii działa
- [ ] Zapisywanie produktu działa (status + API call)
- [ ] Duplikaty są obsługiwane (błąd 400)
- [ ] Podsumowanie wyświetla się poprawnie
- [ ] Przycisk "Wgraj kolejny paragon" resetuje widok

### Performance:
- [ ] Strona ładuje się szybko (< 2s)
- [ ] OCR przetwarza się w rozsądnym czasie (< 3s z mockiem)
- [ ] Brak opóźnień przy interakcjach

### UX/UI:
- [ ] Wszystkie komunikaty są po polsku
- [ ] Kolory są czytelne (zielony = sukces, pomarańczowy = uwaga, czerwony = błąd)
- [ ] Ikony pomagają w zrozumieniu statusu
- [ ] Loading states są widoczne

### DevTools (konsola):
- [ ] Brak czerwonych błędów w konsoli
- [ ] Wszystkie requesty API mają status 200/201 (oprócz testów błędów)

---

## Rozwiązywanie problemów

### Problem: Serwer nie startuje
```bash
# Sprawdź czy port 4321 nie jest zajęty
lsof -i :4321

# Jeśli jest zajęty, zabij proces:
kill -9 <PID>

# Uruchom ponownie
npm run dev
```

### Problem: Brak kategorii (API 500)
```bash
# Sprawdź status Supabase
npx supabase status

# Jeśli nie działa, zrestartuj
npx supabase stop
npx supabase start

# Sprawdź czy migracje się wykonały
npx supabase db reset
```

### Problem: Błąd CORS
- Sprawdź czy używasz `http://localhost:4321` (nie `127.0.0.1`)
- Sprawdź konfigurację Supabase w `supabase/config.toml`

### Problem: Request do API wraca 404
- Sprawdź czy endpoint ma `export const prerender = false`
- Sprawdź czy plik jest w folderze `src/pages/api/`
- Zrestartuj serwer dev

---

## Screenshoty do sprawdzenia

Po każdym teście możesz zrobić screenshot (Cmd+Shift+4 na Mac) w następujących momentach:

1. **Idle state** - widok uploadu
2. **Processing** - loader z spinnerem
3. **Results** - lista matched i unmatched
4. **Saving** - status "Zapisywanie..."
5. **Success** - status "Zapisano pomyślnie"
6. **Error** - komunikat błędu

---

## Gotowy do implementacji OCR?

Jeśli wszystkie testy przeszły pomyślnie, UI jest gotowe!

Następny krok to implementacja prawdziwego OCR:
1. Wyłącz mocka: `USE_MOCK_DATA = false` w `/api/receipts/process.ts`
2. Zintegruj serwis OCR (np. Google Cloud Vision, Tesseract)
3. Dodaj logikę dopasowywania produktów do bazy
4. Dodaj agregację podsumowania
5. Dodaj logowanie błędów do `ocr_error_logs`

**Powodzenia! 🚀**

