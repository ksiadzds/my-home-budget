# Dashboard Components - Dokumentacja

> **Wersja:** 1.0.0 MVP  
> **Data:** 2025-01-21  
> **Status:** ✅ Gotowe do testowania

## Spis treści

1. [Przegląd](#przegląd)
2. [Architektura](#architektura)
3. [Komponenty](#komponenty)
4. [Typy](#typy)
5. [Przepływ danych](#przepływ-danych)
6. [Integracja API](#integracja-api)
7. [Przykłady użycia](#przykłady-użycia)
8. [Testowanie](#testowanie)
9. [Roadmap](#roadmap)

---

## Przegląd

Zestaw komponentów React dla widoku Dashboard aplikacji HomeBudget.
Umożliwia:
- Upload i walidację zdjęć paragonów
- Przetwarzanie OCR (obecnie z mockiem)
- Weryfikację i kategoryzację produktów
- Prezentację podsumowania wydatków

### Stack technologiczny
- **React 19** - komponenty UI
- **TypeScript 5** - typowanie
- **Tailwind 4** - stylowanie
- **Shadcn/ui** - komponenty bazowe (Card, Button, Alert)
- **Astro 5** - hosting jako islands

### Założenia MVP
- ❌ Brak drag & drop
- ❌ Brak licznika czasu OCR
- ❌ Brak przycisku "Anuluj"
- ❌ Brak TanStack Query
- ❌ Brak optimistic updates
- ❌ Podsumowanie tylko z OCR (bez klientowego przeliczania)

---

## Architektura

### Hierarchia komponentów

```
DashboardView (kontener + logika)
├── UploadDropzone (idle step)
├── OcrProcessingPanel (processing step)
└── (result step)
    ├── VerificationList
    │   └── CategorySelect (dla unmatched)
    └── SummaryPanel
```

### Przepływ kroków

```
┌─────────┐    wybór pliku     ┌────────────┐    sukces OCR     ┌────────┐
│  IDLE   │ ─────────────────> │ PROCESSING │ ─────────────────> │ RESULT │
└─────────┘                     └────────────┘                    └────────┘
     ↑                                |                                |
     |                                | błąd OCR                       |
     └────────────────────────────────┴────────────────────────────────┘
                         "Wgraj kolejny paragon"
```

### Zarządzanie stanem

Stan jest przechowywany w `DashboardView` (nie ma globalnego store):

```typescript
// Krok przepływu
const [step, setStep] = useState<DashboardStep>('idle')

// Kategorie (pobierane raz przy montażu)
const [categories, setCategories] = useState<CategoryDTO[]>([])

// Wyniki OCR
const [ocrResult, setOcrResult] = useState<OcrResultViewModel | null>(null)

// Processing state
const [processing, setProcessing] = useState({ running: false })
```

---

## Komponenty

### 1. DashboardView

**Plik:** `DashboardView.tsx`  
**Typ:** Container component

#### Odpowiedzialności:
- Orkiestracja kroków przepływu
- Pobieranie kategorii przy montażu
- Wywołanie OCR i mapowanie odpowiedzi
- Auto-zapis produktów przy zmianie kategorii
- Obsługa błędów dla wszystkich API calls

#### Props:
```typescript
// Brak props - komponent strony
```

#### Stan lokalny:
```typescript
{
  step: 'idle' | 'processing' | 'result',
  categories: CategoryDTO[],
  ocrResult: OcrResultViewModel | null,
  processing: { running: boolean },
  // + error states
}
```

#### Kluczowe funkcje:

```typescript
// Pobieranie kategorii
async function fetchCategories(): Promise<void>

// Upload i OCR
async function handleValidFile(file: File): Promise<void>
async function startOcrProcessing(file: File): Promise<void>

// Zapis produktu
async function handleRowCategoryChange(
  rowId: string, 
  categoryId: string
): Promise<void>

// Reset widoku
function handleReset(): void
```

---

### 2. UploadDropzone

**Plik:** `UploadDropzone.tsx`  
**Typ:** Presentation component

#### Odpowiedzialności:
- Prezentacja UI uploadu
- Walidacja typu (JPEG/PNG) i rozmiaru (≤10MB)
- Komunikaty błędów z ikonami

#### Props:
```typescript
interface UploadDropzoneProps {
  onValidFile: (file: File) => void;
  disabled?: boolean;
}
```

#### Walidacja:
```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png'];

type UploadValidationError =
  | { code: 'invalid_type'; message: string }
  | { code: 'too_large'; message: string };
```

#### Użycie:
```tsx
<UploadDropzone
  onValidFile={(file) => handleUpload(file)}
  disabled={isProcessing}
/>
```

---

### 3. OcrProcessingPanel

**Plik:** `OcrProcessingPanel.tsx`  
**Typ:** Presentation component

#### Odpowiedzialności:
- Wyświetlenie loadera podczas OCR
- Animowany spinner
- Komunikat o przetwarzaniu

#### Props:
```typescript
// Brak props - czysta prezentacja
```

#### Użycie:
```tsx
{step === 'processing' && <OcrProcessingPanel />}
```

---

### 4. VerificationList

**Plik:** `VerificationList.tsx`  
**Typ:** Presentation + logic component

#### Odpowiedzialności:
- Wyświetlenie listy wierszy (matched + unmatched)
- Rozróżnienie wizualne (kolory + ikony)
- Obsługa wyboru kategorii dla unmatched
- Prezentacja statusów zapisu

#### Props:
```typescript
interface VerificationListProps {
  rows: VerificationRow[];
  categories: CategoryDTO[];
  onCategoryChange: (rowId: string, categoryId: string) => void;
}
```

#### Wiersze matched (zielone):
```tsx
<div className="bg-green-50 border-green-200">
  <svg>✓</svg>
  <span>Dopasowano automatycznie</span>
  {kategoria && <span>Kategoria: {kategoria.nazwa}</span>}
</div>
```

#### Wiersze unmatched (pomarańczowe):
```tsx
<div className="bg-orange-50 border-orange-200">
  <svg>⚠️</svg>
  <span>Wymagane przypisanie kategorii</span>
  <CategorySelect ... />
  {isSaving && <span>Zapisywanie...</span>}
  {created_product_id && <span>✓ Zapisano pomyślnie</span>}
  {error_message && <span>✗ {error_message}</span>}
</div>
```

#### Użycie:
```tsx
<VerificationList
  rows={[...matched, ...unmatched]}
  categories={allCategories}
  onCategoryChange={(rowId, catId) => saveProduct(rowId, catId)}
/>
```

---

### 5. CategorySelect

**Plik:** `CategorySelect.tsx`  
**Typ:** Controlled component

#### Odpowiedzialności:
- Dropdown z listą kategorii
- Dostępność (aria-label, focus states)
- Disabled state podczas zapisu

#### Props:
```typescript
interface CategorySelectProps {
  value?: string;
  onChange: (categoryId: string) => void;
  disabled?: boolean;
  categories: CategoryDTO[];
}
```

#### Implementacja:
```tsx
<select
  value={value || ''}
  onChange={(e) => onChange(e.target.value)}
  disabled={disabled}
  aria-label="Wybierz kategorię produktu"
>
  <option value="" disabled>Wybierz kategorię...</option>
  {categories.map(cat => (
    <option key={cat.id} value={cat.id}>
      {cat.nazwa_kategorii}
    </option>
  ))}
</select>
```

#### Użycie:
```tsx
<CategorySelect
  value={row.selected_category_id}
  onChange={(id) => handleChange(row.id, id)}
  disabled={row.isSaving}
  categories={suggestedCategories}
/>
```

---

### 6. SummaryPanel

**Plik:** `SummaryPanel.tsx`  
**Typ:** Presentation component

#### Odpowiedzialności:
- Wyświetlenie agregacji wydatków wg kategorii
- Prezentacja sumy całkowitej
- Dane nietrwałe (tylko z OCR)

#### Props:
```typescript
interface SummaryPanelProps {
  summary: ReceiptProcessingResponseDTO['summary'];
}

// Struktura summary:
{
  by_category: Array<{
    category: CategoryDTO;
    total_expense: number;
    items_count: number;
  }>;
  total: number;
}
```

#### Użycie:
```tsx
<SummaryPanel summary={ocrResult.summary} />
```

---

## Typy

### DashboardStep
```typescript
type DashboardStep = 'idle' | 'processing' | 'result';
```

### MatchedRow
```typescript
interface MatchedRow {
  type: 'matched';
  id: string;                // UUID v4 klienta
  nazwa_produktu: string;
  kategoria_id?: string;
  price: number;
}
```

### UnmatchedRow
```typescript
interface UnmatchedRow {
  type: 'unmatched';
  id: string;
  nazwa_produktu: string;
  price: number;
  suggested_categories: CategoryDTO[];
  selected_category_id?: string;
  isSaving: boolean;
  created_product_id?: string;
  error_message?: string;
}
```

### VerificationRow
```typescript
type VerificationRow = MatchedRow | UnmatchedRow;
```

### OcrResultViewModel
```typescript
interface OcrResultViewModel {
  matched_rows: MatchedRow[];
  unmatched_rows: UnmatchedRow[];
  summary: ReceiptProcessingResponseDTO['summary'];
}
```

---

## Przepływ danych

### 1. Inicjalizacja (montaż DashboardView)
```
useEffect → fetchCategories()
  → GET /api/categories
  → setCategories()
```

### 2. Upload pliku
```
User wybiera plik
  → UploadDropzone waliduje (typ + rozmiar)
  → onValidFile(file)
  → handleValidFile(file)
  → startOcrProcessing(file)
```

### 3. Przetwarzanie OCR
```
startOcrProcessing(file)
  → setStep('processing')
  → POST /api/receipts/process (FormData)
  → Mapowanie: ReceiptProcessingResponseDTO → OcrResultViewModel
  → Generowanie UUID dla wierszy (crypto.randomUUID)
  → setOcrResult()
  → setStep('result')
```

### 4. Wybór kategorii dla unmatched
```
User wybiera kategorię w CategorySelect
  → onChange(categoryId)
  → handleRowCategoryChange(rowId, categoryId)
  → Aktualizacja wiersza: isSaving = true
  → POST /api/products { nazwa_produktu, kategoria_id }
  → Sukces:
      → isSaving = false
      → created_product_id = response.product.id
  → Błąd:
      → isSaving = false
      → error_message = error.message
```

### 5. Reset widoku
```
User klika "Wgraj kolejny paragon"
  → handleReset()
  → setStep('idle')
  → setOcrResult(null)
  → setFile(null)
```

---

## Integracja API

### GET /api/categories
**Kiedy:** Przy montażu DashboardView  
**Response:**
```json
{
  "categories": [
    { "id": "uuid", "nazwa_kategorii": "Alkohol i używki" },
    ...
  ]
}
```
**Obsługa błędów:**
- 500: Alert + disable uploadu

---

### POST /api/receipts/process
**Kiedy:** Po wyborze prawidłowego pliku  
**Request:** `FormData { receipt: File }`  
**Response:**
```json
{
  "message": "...",
  "matched_products": [
    {
      "nazwa_produktu": "Chleb",
      "kategoria_id": "uuid",
      "confidence": 0.95,
      "price": 4.50
    }
  ],
  "unmatched_products": [
    {
      "nazwa_produktu": "Baton",
      "price": 2.50,
      "suggested_categories": [...]
    }
  ],
  "summary": {
    "by_category": [...],
    "total": 13.69
  }
}
```
**Obsługa błędów:**
- 400: Alert z komunikatem + możliwość retry
- 500: Alert + "Spróbuj ponownie"

---

### POST /api/products
**Kiedy:** Przy wyborze kategorii dla unmatched  
**Request:**
```json
{
  "nazwa_produktu": "Baton czekoladowy",
  "kategoria_id": "uuid"
}
```
**Response:**
```json
{
  "message": "Product created successfully",
  "product": { "id": "uuid", ... }
}
```
**Obsługa błędów:**
- 400 (duplikat): error_message w wierszu
- 500: error_message + możliwość retry

---

## Przykłady użycia

### Podstawowe użycie w Astro

```astro
---
// src/pages/index.astro
import Layout from '../layouts/Layout.astro';
import { DashboardView } from '../components/dashboard/DashboardView';
---

<Layout>
  <DashboardView client:load />
</Layout>
```

### Testowanie komponentu w izolacji

```tsx
// Storybook / test file
import { DashboardView } from './DashboardView';

export default {
  component: DashboardView,
};

export const Default = () => <DashboardView />;
```

---

## Testowanie

### Checklist testów manualnych

Szczegółowa instrukcja: `.ai/INSTRUKCJA-TESTOWANIA.md`

#### Quick check:
1. ✅ Strona ładuje się bez błędów
2. ✅ Kategorie pobierane z API
3. ✅ Walidacja pliku działa (typ + rozmiar)
4. ✅ Loader pokazuje się podczas OCR
5. ✅ Wyniki wyświetlają się poprawnie (matched + unmatched)
6. ✅ CategorySelect działa
7. ✅ Zapis produktu działa (POST /api/products)
8. ✅ Błędy są obsługiwane (duplikaty, 500)
9. ✅ Podsumowanie wyświetla się poprawnie
10. ✅ Reset widoku działa

### Testy automatyczne (TODO)

```bash
# Unit tests
npm run test:unit

# E2E tests
npm run test:e2e
```

---

## Roadmap

### Wersja 1.1 (post-MVP)
- [ ] Drag & drop w uploaderze
- [ ] Licznik czasu OCR
- [ ] Przycisk "Anuluj" (AbortController)
- [ ] Pokazywanie `confidence` dla matched
- [ ] TanStack Query dla API calls
- [ ] Optimistic updates

### Wersja 1.2
- [ ] Klientowe przeliczanie podsumowania po edycjach
- [ ] TanStack Table zamiast prostej listy
- [ ] Sortowanie i filtrowanie wierszy
- [ ] Bulk actions (zaznaczenie wielu wierszy)
- [ ] Export do CSV/PDF

### Wersja 2.0
- [ ] Historia paragonów
- [ ] Edycja zapisanych produktów
- [ ] Wykresy wydatków
- [ ] Porównania międzyokresowe
- [ ] Budżet miesięczny

---

## FAQ

### Czy mogę używać komponentów Dashboard osobno?

Tak, wszystkie komponenty (oprócz DashboardView) są niezależne i mogą być użyte w innych miejscach aplikacji.

### Dlaczego nie używamy TanStack Query?

Decyzja MVP - proste `useState`/`useEffect` wystarczają dla prostego przepływu. W przyszłości można dodać.

### Czy podsumowanie aktualizuje się po zmianie kategorii?

Nie w MVP. Podsumowanie pochodzi z OCR i jest niezmienne. Aby zaktualizować, trzeba wgrać paragon ponownie.

### Co jeśli OCR nie zwróci dopasowanych produktów?

Wszystkie produkty trafią do `unmatched_rows` i będą wymagały ręcznej kategoryzacji.

### Czy mogę edytować matched products?

Nie w MVP. Matched products są read-only. W przyszłości można dodać opcję ręcznej zmiany.

---

## Kontakt

W razie pytań lub problemów:
- Sprawdź logi konsoli (DevTools)
- Zobacz `.ai/INSTRUKCJA-TESTOWANIA.md`
- Sprawdź linter errors: `npm run lint`

---

**Dokumentacja wygenerowana:** 2025-01-21  
**Wersja komponentów:** 1.0.0 MVP  
**Status:** ✅ Ready for testing

