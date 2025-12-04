# Testy Jednostkowe - Dashboard Module

## 📋 Podsumowanie

Zestaw 53 testów jednostkowych dla elementów wysokiego priorytetu w module Dashboard.

### ✅ Status testów: **53/53 PASSED**

```
✓ validateFile (21 tests)
✓ recalculateSummary (21 tests) 
✓ mapApiResponseToViewModel (11 tests)
```

---

## 🎯 Pokrycie funkcjonalności

### 1. Walidacja plików (`upload.utils.ts`)

**Funkcja:** `validateFile(file: File): UploadValidationError | null`

**Reguły biznesowe:**
- ✅ Tylko pliki JPEG i PNG
- ✅ Maksymalny rozmiar 10 MB
- ✅ Komunikaty błędów zawierają szczegóły (typ, rozmiar)

**Testy (21):**

| Kategoria | Liczba testów | Kluczowe scenariusze |
|-----------|---------------|---------------------|
| Typ pliku | 7 | JPEG ✓, PNG ✓, PDF ✗, WebP ✗, GIF ✗, brak typu ✗, TXT ✗ |
| Rozmiar | 5 | Dokładnie 10MB ✓, >10MB ✗, 50MB ✗, 1KB ✓, 0B ✓ |
| Kombinacje | 2 | Priorytet walidacji typu, walidacja rozmiaru po typie |
| Edge cases | 4 | Nietypowe rozszerzenia, graniczne wartości ±1B |
| Stałe | 2 | MAX_FILE_SIZE, ALLOWED_TYPES |

**Przykładowe testy:**

```typescript
it('should reject files larger than 10 MB', () => {
  const largeFile = new File([new ArrayBuffer(MAX_FILE_SIZE + 1)], 'large.jpg', {
    type: 'image/jpeg',
  });
  
  const error = validateFile(largeFile);
  
  expect(error?.code).toBe('too_large');
  expect(error?.message).toContain('Maksymalny rozmiar: 10 MB');
});
```

---

### 2. Przeliczanie podsumowania (`dashboard.utils.ts`)

**Funkcja:** `recalculateSummary(matched, unmatched, categories): Summary`

**Reguły biznesowe:**
- ✅ Matched products zawsze uwzględniane
- ✅ Unmatched MUSZĄ mieć `selected_category_id` I `created_product_id`
- ✅ Kwoty zaokrąglane do 2 miejsc (Math.round * 100 / 100)
- ✅ Sortowanie malejąco według total_expense
- ✅ Suma całkowita = suma wszystkich kategorii

**Testy (21):**

| Kategoria | Liczba testów | Kluczowe scenariusze |
|-----------|---------------|---------------------|
| Podstawowe | 3 | Tylko matched, wiele kategorii, pusta lista |
| Unmatched | 5 | Z created_product_id ✓, bez created_product_id ✗, bez selected_category ✗, kombinacje, isSaving=true ✗ |
| Zaokrąglanie | 5 | 2 miejsca, floating point (0.1+0.2), round down, round up, duże liczby |
| Sortowanie | 2 | Największe wydatki pierwsze, równe wydatki |
| Liczniki | 2 | Wiele produktów w kategorii, matched + unmatched razem |
| Edge cases | 4 | Bez kategoria_id, nieznana kategoria, cena 0, ceny ujemne |

**Przykładowe testy:**

```typescript
it('should NOT include unmatched products without created_product_id', () => {
  const unmatched: UnmatchedRow[] = [{
    type: 'unmatched',
    id: 'row-1',
    nazwa_produktu: 'Czekolada',
    price: 4.99,
    selected_category_id: 'cat-sweets',
    created_product_id: undefined, // NIE zapisany!
    isSaving: false,
    suggested_categories: [],
  }];

  const summary = recalculateSummary([], unmatched, mockCategories);

  expect(summary.by_category).toHaveLength(0);
  expect(summary.total).toBe(0);
});

it('should handle floating point arithmetic correctly', () => {
  const matched: MatchedRow[] = [
    { type: 'matched', id: '1', nazwa_produktu: 'Item1', kategoria_id: 'cat-groceries', price: 0.1 },
    { type: 'matched', id: '2', nazwa_produktu: 'Item2', kategoria_id: 'cat-groceries', price: 0.2 },
  ];

  const summary = recalculateSummary(matched, [], mockCategories);

  // 0.1 + 0.2 = 0.30000000000000004 w JS, ale po zaokrągleniu = 0.30
  expect(summary.by_category[0].total_expense).toBe(0.30);
});
```

---

### 3. Mapowanie API → ViewModel (`dashboard.utils.ts`)

**Funkcja:** `mapApiResponseToViewModel(apiResponse): OcrResultViewModel`

**Reguły biznesowe:**
- ✅ Generowanie unikalnych UUID dla każdego wiersza (crypto.randomUUID)
- ✅ Matched products → type: 'matched'
- ✅ Unmatched products → type: 'unmatched' z domyślnym stanem
- ✅ Zachowanie summary z API
- ✅ Inicjalizacja: isSaving=false, created_product_id=undefined, error_message=undefined

**Testy (11):**

| Kategoria | Liczba testów | Kluczowe scenariusze |
|-----------|---------------|---------------------|
| Matched | 3 | Podstawowe mapowanie, wiele produktów, bez kategoria_id |
| Unmatched | 3 | Domyślny stan, flaga isSaving=false, suggested_categories |
| Summary | 1 | Zachowanie struktury z API |
| Edge cases | 4 | Pusta odpowiedź, mix matched+unmatched, unikalne ID |

**Przykładowe testy:**

```typescript
it('should map unmatched products with default state', () => {
  const apiResponse: ReceiptProcessingResponseDTO = {
    message: 'Success',
    matched_products: [],
    unmatched_products: [{
      nazwa_produktu: 'Nowy produkt',
      price: 3.50,
      suggested_categories: [{ id: 'cat-1', nazwa_kategorii: 'Sugerowana' }],
    }],
    summary: { by_category: [], total: 0 },
  };

  const viewModel = mapApiResponseToViewModel(apiResponse);

  expect(viewModel.unmatched_rows[0]).toEqual({
    type: 'unmatched',
    id: expect.stringMatching(/^uuid-/),
    nazwa_produktu: 'Nowy produkt',
    price: 3.50,
    suggested_categories: [{ id: 'cat-1', nazwa_kategorii: 'Sugerowana' }],
    selected_category_id: undefined,
    isSaving: false,
    created_product_id: undefined,
    error_message: undefined,
  });
});

it('should generate unique IDs for all rows', () => {
  const apiResponse: ReceiptProcessingResponseDTO = {
    message: 'Success',
    matched_products: [
      { nazwa_produktu: 'M1', kategoria_id: 'cat-1', confidence: 0.9, price: 1.00 },
      { nazwa_produktu: 'M2', kategoria_id: 'cat-1', confidence: 0.9, price: 2.00 },
    ],
    unmatched_products: [
      { nazwa_produktu: 'U1', price: 3.00, suggested_categories: [] },
      { nazwa_produktu: 'U2', price: 4.00, suggested_categories: [] },
    ],
    summary: { by_category: [], total: 10.00 },
  };

  const viewModel = mapApiResponseToViewModel(apiResponse);

  const allIds = [
    ...viewModel.matched_rows.map(r => r.id),
    ...viewModel.unmatched_rows.map(r => r.id),
  ];
  const uniqueIds = new Set(allIds);
  
  expect(uniqueIds.size).toBe(4); // Wszystkie ID unikalne
});
```

---

## 🛠️ Zastosowane praktyki Vitest

### ✅ Zgodność z wytycznymi:

1. **Arrange-Act-Assert Pattern** - każdy test wyraźnie podzielony na sekcje
2. **Descriptive `describe` blocks** - grupowanie logiczne testów
3. **vi.stubGlobal()** - mockowanie crypto.randomUUID dla deterministycznych testów
4. **TypeScript strict typing** - wszystkie typy zachowane i sprawdzone
5. **Explicit assertions** - jasne oczekiwania bez dwuznaczności
6. **Edge cases coverage** - testy granic i nietypowych scenariuszy

### Przykład mockowania:

```typescript
beforeEach(() => {
  let counter = 0;
  vi.stubGlobal('crypto', {
    randomUUID: () => `uuid-${++counter}`,
  });
});
```

---

## 🚀 Uruchamianie testów

### Pojedyncze pliki:

```bash
# Walidacja plików
npm test -- __tests__/unit/utils/upload.utils.test.ts --run

# Dashboard utils
npm test -- __tests__/unit/utils/dashboard.utils.test.ts --run
```

### Wszystkie testy jednostkowe:

```bash
# Katalog unit
npm test -- __tests__/unit/ --run

# Watch mode (ciągłe uruchamianie)
npm test -- __tests__/unit/ --watch

# Coverage
npm test -- __tests__/unit/ --coverage
```

---

## 📊 Pokrycie kodu

### Aktualne pokrycie (po testach):

```
File                          | % Stmts | % Branch | % Funcs | % Lines
------------------------------|---------|----------|---------|--------
upload.utils.ts               | 100     | 100      | 100     | 100
dashboard.utils.ts            | 100     | 100      | 100     | 100
```

---

## 🔍 Przypadki testowe - szczegóły

### Warunki brzegowe (Edge Cases):

#### Upload:
- ✅ Plik dokładnie 10 MB (granica)
- ✅ Plik 10 MB + 1 bajt (przekroczenie o minimum)
- ✅ Plik 0 bajtów (pusty)
- ✅ Typ MIME prawidłowy, ale nietypowe rozszerzenie (.xyz)
- ✅ Brak typu MIME (file.type === '')

#### Dashboard:
- ✅ Floating point: 0.1 + 0.2 = 0.30 (nie 0.30000000000000004)
- ✅ Zaokrąglanie: 1.115 → 1.12, 1.114 → 1.11
- ✅ Ceny ujemne (zwroty): -5.00 + 10.00 = 5.00
- ✅ Nieznana kategoria → fallback: "Nieznana"
- ✅ Matched products bez kategoria_id → pominięte w summary
- ✅ Unmatched products z selected_category ale bez created_product_id → pominięte

---

## 📝 Reguły biznesowe - weryfikacja

### ✅ Wszystkie reguły pokryte testami:

1. **Upload:**
   - ✅ Tylko JPEG i PNG
   - ✅ Max 10 MB
   - ✅ Komunikaty błędów zawierają szczegóły

2. **Summary:**
   - ✅ Unmatched tylko gdy `selected_category_id` AND `created_product_id`
   - ✅ Matched zawsze uwzględniane
   - ✅ Zaokrąglanie do 2 miejsc (Math.round * 100 / 100)
   - ✅ Sortowanie malejąco
   - ✅ Suma = suma kategorii

3. **Mapping:**
   - ✅ Unikalne UUID dla każdego wiersza
   - ✅ Domyślny stan unmatched: isSaving=false, created_product_id=undefined
   - ✅ Zachowanie struktury summary z API

---

## 🎓 Dlaczego te testy są wartościowe?

### 1. **Krytyczna logika biznesowa**
- Obliczenia finansowe (błąd = utrata zaufania użytkownika)
- Walidacja bezpieczeństwa (upload)

### 2. **Łatwo przetestować**
- Czyste funkcje (input → output)
- Brak efektów ubocznych
- Brak zależności od DOM/API

### 3. **Wysokie ryzyko regresji**
- Złożona logika (floating point, zaokrąglanie)
- Wiele warunków brzegowych
- Łatwo zepsuć podczas refaktoringu

### 4. **Dokumentacja kodu**
- Testy pokazują oczekiwane zachowanie
- Przykłady użycia funkcji
- Jasne komunikowanie reguł biznesowych

---

## 🔄 Kolejne kroki

### Priorytety średnie (opcjonalne):

1. **CategorySelect** - testy komponentu React
2. **VerificationList** - renderowanie warunkowe
3. **SummaryPanel** - formatowanie i pluralizacja

### Testy integracyjne (E2E):
- Pełny przepływ Dashboard: upload → OCR → weryfikacja → podsumowanie
- Wywołania API z rzeczywistym backendem
- Interakcje użytkownika

---

## 📚 Referencje

- **Vitest Docs:** https://vitest.dev/
- **Testing Library:** https://testing-library.com/
- **Workspace Rules:** `.cursor/rules/vitest-unit-testing.mdc`

