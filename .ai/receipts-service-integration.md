# Integracja Receipts Service z OpenRouter AI

## Przegląd

Zintegrowano OpenRouter Service z Products Service i Categories Service w celu przetwarzania paragonów za pomocą AI (OCR). Rozwiązanie używa **prostego SQL matching** do dopasowania produktów - AI służy **TYLKO do OCR** (ekstrakcji nazw produktów i cen z obrazu).

## Architektura

### Komponenty

```
┌─────────────────────────────────────────────────────────────┐
│                    POST /api/receipts/process               │
│                  (Endpoint API - Astro)                     │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    ReceiptsService                          │
│  • Konwersja obrazu do base64                              │
│  • OCR przez OpenRouter (tylko ekstrakcja!)                │
│  • Proste SQL matching produktów                           │
│  • Generowanie podsumowania wydatków                       │
└────────┬────────────────┬──────────────────┬───────────────┘
         │                │                  │
         ▼                ▼                  ▼
┌─────────────┐  ┌─────────────────┐  ┌──────────────────┐
│ OpenRouter  │  │ Products        │  │ Categories       │
│ Service     │  │ Service         │  │ Service          │
│             │  │                 │  │                  │
│ • OCR tylko │  │ • CRUD          │  │ • List           │
│             │  │ • SQL matching  │  │   categories     │
└─────────────┘  └─────────────────┘  └──────────────────┘
```

## Implementacja

### 1. ReceiptsService (`src/lib/services/receipts.service.ts`)

#### Główna metoda: `processReceipt()`

**Krok 1: OCR przez AI**
- Konwersja obrazu do base64
- Wysłanie do GPT-4o-mini z vision
- AI ekstrahuje TYLKO nazwę produktu i cenę
- Zwraca JSON: `{ produkty: [{ nazwa_produktu, cena }] }`

**Krok 2: Proste SQL matching**
- Pobiera wszystkie produkty użytkownika z bazy
- Dla każdego produktu z OCR:
  - **Dokładne dopasowanie**: `nazwa_ocr === nazwa_baza` (confidence: 1.0)
  - **Częściowe dopasowanie**: nazwa zawiera drugą nazwę (confidence: 0.8)
  - **Brak dopasowania**: produkt trafia do unmatched

**Krok 3: Klasyfikacja wyników**
- **Matched products**: Produkty znalezione w bazie → zwraca z kategorią z bazy
- **Unmatched products**: Produkty NIE znalezione → użytkownik wybiera kategorię sam

**Krok 4: Generowanie podsumowania**
- Agregacja wydatków według kategorii (tylko matched products)
- Suma całkowita

#### Schema JSON dla OCR

```typescript
{
  type: 'object',
  properties: {
    produkty: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          nazwa_produktu: { type: 'string' },
          cena: { type: 'number' }
        },
        required: ['nazwa_produktu', 'cena']
      }
    }
  },
  required: ['produkty']
}
```

#### Algorytm SQL matching

```typescript
// 1. Dokładne dopasowanie (confidence: 1.0)
const exactMatch = userProducts.find(
  p => p.nazwa_produktu.toLowerCase().trim() === ocrName.toLowerCase().trim()
);

// 2. Częściowe dopasowanie (confidence: 0.8)
const partialMatch = userProducts.find(p => 
  p.nazwa_produktu.includes(ocrName) || ocrName.includes(p.nazwa_produktu)
);

// 3. Brak dopasowania → unmatched
if (!exactMatch && !partialMatch) {
  unmatchedProducts.push({
    nazwa_produktu: ocrName,
    price: ocrPrice,
    suggested_categories: allCategories // Wszystkie kategorie, użytkownik wybiera
  });
}
```

### 2. Endpoint API (`src/pages/api/receipts/process.ts`)

#### Przepływ

1. **Walidacja pliku**: Zod schema (format, rozmiar)
2. **OCR + Matching**: `receiptsService.processReceipt()`
3. **Zwrócenie wyników**: JSON z matched/unmatched produktami

#### Response

```json
{
  "message": "Paragon został przetworzony pomyślnie",
  "matched_products": [
    {
      "nazwa_produktu": "Chleb pszenny",
      "kategoria_id": "uuid-zakupy-spozywcze",
      "confidence": 1.0,
      "price": 4.50
    }
  ],
  "unmatched_products": [
    {
      "nazwa_produktu": "Nowy produkt",
      "price": 2.50,
      "suggested_categories": [...] // Wszystkie kategorie z bazy
    }
  ],
  "summary": {
    "by_category": [
      {
        "category": { id: "...", nazwa_kategorii: "Zakupy spożywcze" },
        "total_expense": 4.50,
        "items_count": 1
      }
    ],
    "total": 4.50
  }
}
```

## Co AI ROBI i czego NIE ROBI

### ✅ AI ROBI (OCR)

- Ekstrahuje nazwy produktów z obrazu paragonu
- Ekstrahuje ceny produktów
- Zwraca structured JSON

### ❌ AI NIE ROBI

- ~~Dopasowanie produktów do kategorii~~ → **SQL matching**
- ~~Sugestie kategorii~~ → **Użytkownik wybiera sam**
- ~~Retry mechanism~~ → **Brak (na razie)**
- ~~Error logging~~ → **Brak (na razie)**

## Konfiguracja

### Zmienne środowiskowe

```bash
# OpenRouter API
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_API_URL=https://openrouter.ai/api/v1/chat/completions  # Opcjonalne

# Supabase
SUPABASE_URL=https://...
SUPABASE_KEY=eyJ...

# Site URL
SITE_URL=http://localhost:4321
```

### Model AI

**Użyty model**: `openai/gpt-4o-mini`

**Parametry:**
- `temperature: 0.1` - niska losowość dla precyzji OCR
- `max_tokens: 2000` - wystarczające dla paragonu

## Przepływ danych

### 1. Upload paragonu

```
User → Frontend → POST /api/receipts/process
Body: multipart/form-data { receipt: File }
```

### 2. OCR przez AI

```
ReceiptsService → OpenRouter API
{
  model: "openai/gpt-4o-mini",
  messages: [
    { role: "system", content: "Jesteś specjalistą od OCR paragonów..." },
    { 
      role: "user", 
      content: [
        { type: "text", text: "Wyekstrahuj produkty i ceny" },
        { type: "image_url", image_url: { url: "data:image/jpeg;base64,..." } }
      ]
    }
  ]
}
```

### 3. Odpowiedź AI (tylko OCR!)

```json
{
  "produkty": [
    { "nazwa_produktu": "Chleb pszenny", "cena": 4.50 },
    { "nazwa_produktu": "Mleko 2%", "cena": 3.20 }
  ]
}
```

### 4. SQL Matching (nie AI!)

```typescript
// Pobierz produkty użytkownika z bazy
const userProducts = await productsService.listProducts(userId);

// Dla każdego produktu z OCR:
for (const ocrItem of ocrResult.produkty) {
  const match = userProducts.find(p => 
    p.nazwa_produktu.toLowerCase() === ocrItem.nazwa_produktu.toLowerCase()
  );
  
  if (match) {
    // Matched → zwróć z kategorią z bazy
    matched.push({
      nazwa_produktu: ocrItem.nazwa_produktu,
      kategoria_id: match.kategoria_id,
      confidence: 1.0,
      price: ocrItem.cena
    });
  } else {
    // Unmatched → użytkownik wybierze kategorię
    unmatched.push({
      nazwa_produktu: ocrItem.nazwa_produktu,
      price: ocrItem.cena,
      suggested_categories: allCategories // Wszystkie kategorie
    });
  }
}
```

### 5. Generowanie podsumowania

Tylko dla **matched products** (które mają kategorię):

```typescript
summary: {
  by_category: [
    {
      category: { id: "uuid", nazwa_kategorii: "Zakupy spożywcze" },
      total_expense: 7.70,
      items_count: 2
    }
  ],
  total: 7.70
}
```

## Obsługa edge cases

### 1. Pusty paragon / nieczytelny obraz

```json
{
  "message": "Nie znaleziono produktów na paragonie. Sprawdź czy obraz jest wyraźny.",
  "matched_products": [],
  "unmatched_products": [],
  "summary": { "by_category": [], "total": 0 }
}
```

### 2. Wszystkie produkty nowe (unmatched)

```json
{
  "matched_products": [],
  "unmatched_products": [
    { "nazwa_produktu": "Produkt 1", "price": 10.00, "suggested_categories": [...] }
  ],
  "summary": { "by_category": [], "total": 0 }
}
```

### 3. Mix matched + unmatched

```json
{
  "matched_products": [
    { "nazwa_produktu": "Chleb", "kategoria_id": "...", "price": 4.50 }
  ],
  "unmatched_products": [
    { "nazwa_produktu": "Nowy produkt", "price": 2.50, "suggested_categories": [...] }
  ],
  "summary": {
    "by_category": [...],
    "total": 4.50  // Tylko matched!
  }
}
```

## Bezpieczeństwo

### 1. Walidacja pliku

- **Format**: tylko JPEG, PNG, WEBP
- **Rozmiar**: max 10MB
- **Walidacja**: Zod schema

### 2. Ochrona API Key

- Przechowywany w `.env`
- Nie wysyłany do frontendu
- Server-side only

### 3. Izolacja danych

- Każdy użytkownik widzi tylko swoje produkty
- `user_id` filtrowanie w SQL

## Monitoring

### Logi konsoli

```typescript
[ReceiptsService] OCR Result: { productCount: 5 }
[ReceiptsService] Processing completed: { matched: 3, unmatched: 2 }
[Receipts API] File uploaded: { name: "paragon.jpg", size: 245612 }
```

## Koszty OpenRouter

**GPT-4o-mini pricing:**
- Input: $0.15 / 1M tokens
- Output: $0.60 / 1M tokens

**Koszt 1 paragonu:**
- ~$0.0001 (0.01 gr PLN) 💰

**Koszt 1000 paragonów:**
- ~$0.10 (0.40 PLN) 🎉

## Testowanie

### 1. Test manualny

```bash
npm run dev
# Upload paragon przez UI
```

### 2. Test API (curl)

```bash
curl -X POST http://localhost:4321/api/receipts/process \
  -F "receipt=@paragon.jpg"
```

## Przyszłe ulepszenia (TODO)

- [ ] Retry mechanism dla błędów sieciowych
- [ ] Logowanie błędów OCR do `ocr_error_logs`
- [ ] Cache wyników OCR
- [ ] Bulk processing paragonów
- [ ] Prawdziwe uwierzytelnienie (zamiast mockUserId)

## Podsumowanie

✅ **Zaimplementowano:**
- OCR paragonów przez GPT-4o-mini (TYLKO ekstrakcja!)
- Proste SQL matching produktów do bazy użytkownika
- Generowanie podsumowania wydatków
- Zwracanie wszystkich kategorii dla unmatched products

❌ **Nie zaimplementowano (świadomie):**
- AI categorization (użytkownik wybiera sam)
- Retry mechanism (na później)
- Error logging (na później)

🎯 **Proste i skuteczne!**
