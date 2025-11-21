# Przewodnik testowania Dashboard View

## Status implementacji

✅ **Zrealizowane (Kroki 1-6)**

### Frontend:
- ✅ Typy TypeScript dla widoku Dashboard
- ✅ Struktura komponentów (`src/components/dashboard/`)
- ✅ `DashboardView` - główny kontener z logiką przepływu
- ✅ `UploadDropzone` - upload i walidacja pliku
- ✅ `OcrProcessingPanel` - loader podczas przetwarzania
- ✅ `VerificationList` - lista matched/unmatched wierszy
- ✅ `CategorySelect` - wybór kategorii
- ✅ `SummaryPanel` - podsumowanie wydatków
- ✅ Integracja z `src/pages/index.astro`

### Backend:
- ✅ Endpoint `/api/categories` (GET) - działa
- ✅ Endpoint `/api/receipts/process` (POST) - z mockowymi danymi OCR
- ✅ Endpoint `/api/products` (POST) - działa

## Jak przetestować

### 1. Uruchomienie serwera deweloperskiego

```bash
npm run dev
```

Serwer powinien być dostępny pod adresem: `http://localhost:4321`

### 2. Testy manualne

#### Test 1: Walidacja pliku
1. Otwórz `http://localhost:4321`
2. Kliknij "Wybierz plik"
3. Spróbuj wgrać plik inny niż JPEG/PNG
   - **Oczekiwany rezultat**: Komunikat błędu "Nieprawidłowy typ pliku"
4. Spróbuj wgrać plik większy niż 10 MB
   - **Oczekiwany rezultat**: Komunikat błędu "Plik za duży"

#### Test 2: Przepływ OCR (z mockowanymi danymi)
1. Wgraj prawidłowy plik JPEG/PNG (dowolny, nie musi być paragonem)
2. **Oczekiwany rezultat**:
   - Pokazuje się loader "Przetwarzanie paragonu"
   - Po chwili wyświetla się lista z produktami:
     - 3 wiersze **matched** (zielone tło): Chleb, Mleko, Coca-Cola
     - 2 wiersze **unmatched** (pomarańczowe tło): Baton, Chipsy
   - Podsumowanie wydatków:
     - Zakupy spożywcze: 7.70 zł
     - Napoje: 5.99 zł
     - **Suma całkowita: 13.69 zł**

#### Test 3: Przypisanie kategorii do unmatched
1. Po przetworzeniu paragonu, znajdź wiersz "Baton czekoladowy"
2. Wybierz kategorię z dropdowna
3. **Oczekiwany rezultat**:
   - Select blokuje się
   - Pojawia się status "Zapisywanie..."
   - Po chwili: "Zapisano pomyślnie"
4. Powtórz dla "Chipsy paprykowe"

#### Test 4: Obsługa błędów duplikatu
1. Przetwórz paragon po raz pierwszy i przypisz kategorię do produktu
2. Wgraj kolejny paragon (przycisk "Wgraj kolejny paragon")
3. Przypisz tę samą kategorię do tego samego produktu
4. **Oczekiwany rezultat**:
   - Powinien pojawić się komunikat błędu (produkt już istnieje)

#### Test 5: Pobieranie kategorii
1. Sprawdź konsolę przeglądarki (F12)
2. Odśwież stronę
3. **Oczekiwany rezultat**:
   - Brak błędów 500 przy GET `/api/categories`
   - Kategorie poprawnie załadowane

## Mockowe dane OCR

W pliku `src/pages/api/receipts/process.ts` znajduje się flaga:

```typescript
const USE_MOCK_DATA = true; // Zmień na false po implementacji OCR
```

### Wyłączenie mocka:
Ustaw `USE_MOCK_DATA = false`, aby endpoint zwracał puste dane (bez OCR):
- `matched_products: []`
- `unmatched_products: []`
- `summary: { by_category: [], total: 0 }`

W takim przypadku widok pokaże komunikat: "Nie znaleziono żadnych produktów na paragonie"

## Znane ograniczenia MVP

- ❌ Brak drag & drop w uploaderze
- ❌ Brak licznika czasu podczas OCR
- ❌ Brak przycisku "Anuluj" podczas przetwarzania
- ❌ Nie pokazujemy `confidence` dla matched products
- ❌ Podsumowanie wyłącznie z odpowiedzi OCR (bez klientowego przeliczania)
- ❌ Brak TanStack Query
- ❌ Brak optimistic updates
- ❌ Brak globalnej obsługi 401 (RLS wyłączony w MVP)

## Następne kroki

Po zaimplementowaniu prawdziwego OCR:
1. Ustaw `USE_MOCK_DATA = false` w `receipts/process.ts`
2. Zaimplementuj serwis OCR
3. Dodaj logikę dopasowywania produktów
4. Dodaj agregację podsumowania
5. Dodaj obsługę błędów OCR (tabela `ocr_error_logs`)

## Struktura plików

```
src/
├── components/
│   └── dashboard/
│       ├── DashboardView.tsx          # Główny kontener
│       ├── UploadDropzone.tsx         # Upload pliku
│       ├── OcrProcessingPanel.tsx     # Loader
│       ├── VerificationList.tsx       # Lista produktów
│       ├── CategorySelect.tsx         # Select kategorii
│       └── SummaryPanel.tsx           # Podsumowanie
├── pages/
│   ├── index.astro                    # Strona główna
│   └── api/
│       ├── categories.ts              # GET kategorii
│       ├── products.ts                # POST nowy produkt
│       └── receipts/
│           └── process.ts             # POST przetwarzanie OCR
└── types.ts                           # Wszystkie typy DTO + Dashboard
```

## Debugging

### Sprawdzanie requestów w konsoli
```javascript
// W konsoli przeglądarki:
localStorage.debug = '*'
```

### Sprawdzanie odpowiedzi API
```bash
# Test GET categories
curl http://localhost:4321/api/categories

# Test POST products
curl -X POST http://localhost:4321/api/products \
  -H "Content-Type: application/json" \
  -d '{"nazwa_produktu":"Test","kategoria_id":"UUID"}'

# Test POST receipts (wymaga FormData)
curl -X POST http://localhost:4321/api/receipts/process \
  -F "receipt=@test-image.jpg"
```

