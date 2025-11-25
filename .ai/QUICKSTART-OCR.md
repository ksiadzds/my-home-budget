# Integracja OpenRouter OCR - Quick Start

## Co zostało zaimplementowane?

✅ **ReceiptsService** (`src/lib/services/receipts.service.ts`)
- OCR paragonów przez GPT-4o-mini (TYLKO ekstrakcja nazw i cen!)
- Proste SQL matching produktów do bazy użytkownika
- Generowanie podsumowania wydatków

✅ **Zaktualizowany endpoint** (`src/pages/api/receipts/process.ts`)
- Integracja z ReceiptsService
- Zwracanie matched/unmatched produktów

✅ **Rozszerzone typy** (`src/lib/services/openrouter.types.ts`)
- Obsługa vision inputs (obrazy w base64)

## Jak to działa?

### 1. OCR przez AI
AI **TYLKO** ekstrahuje nazwy produktów i ceny z obrazu.

**Przykład:**
```
Paragon → AI → { produkty: [{ nazwa: "Chleb", cena: 4.50 }] }
```

### 2. SQL Matching (nie AI!)
Proste porównanie nazw z bazą użytkownika.

**Logika:**
- Jeśli produkt istnieje w bazie → **matched** (zwraca z kategorią z bazy)
- Jeśli produkt NIE istnieje → **unmatched** (użytkownik wybiera kategorię sam)

### 3. Użytkownik decyduje
Dla unmatched products użytkownik **ręcznie** wybiera kategorię z listy.

## Konfiguracja

### 1. Zmienne środowiskowe

Dodaj do pliku `.env`:

```bash
# OpenRouter API Key (wymagany)
OPENROUTER_API_KEY=sk-or-v1-...

# Opcjonalne
OPENROUTER_API_URL=https://openrouter.ai/api/v1/chat/completions
SITE_URL=http://localhost:4321
```

### 2. Gdzie wziąć API Key?

1. https://openrouter.ai/
2. Zarejestruj się / zaloguj
3. https://openrouter.ai/keys → Create Key
4. Skopiuj i dodaj do `.env`

### 3. Doładuj konto (wymagane)

Minimum $5 (wystarczy na ~50,000 paragonów!)
- https://openrouter.ai/credits

## Uruchomienie

```bash
# 1. Zainstaluj zależności
npm install

# 2. Uruchom Supabase
npx supabase start

# 3. Uruchom dev server
npm run dev

# 4. Otwórz aplikację
open http://localhost:4321
```

## Testowanie

### Test 1: Upload przez UI

1. http://localhost:4321
2. Upload zdjęcie paragonu (JPG, PNG, WEBP, max 10MB)
3. Sprawdź wyniki

### Test 2: API Test (curl)

```bash
curl -X POST http://localhost:4321/api/receipts/process \
  -F "receipt=@paragon.jpg"
```

**Przykładowa odpowiedź:**
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
      "suggested_categories": [...] // Wszystkie kategorie
    }
  ],
  "summary": {
    "by_category": [...],
    "total": 4.50
  }
}
```

## Koszty

**Model**: GPT-4o-mini
- 1 paragon ≈ $0.0001 (0.01 gr PLN)
- 1000 paragonów ≈ $0.10 (0.40 PLN)

**Bardzo tanie!** 🎉

## Troubleshooting

**Problem**: `OPENROUTER_API_KEY nie została znaleziona`
- **Rozwiązanie**: Sprawdź `.env`, upewnij się że klucz jest poprawny

**Problem**: `401 Unauthorized`
- **Rozwiązanie**: Nieprawidłowy API key lub brak kredytów

**Problem**: `Nie znaleziono produktów na paragonie`
- **Rozwiązanie**: Sprawdź czy obraz jest wyraźny

## Co dalej?

1. **Dodaj produkty testowe**
   - `POST /api/products` → dodaj produkty z kategoriami
   - Pozwoli to testować matched products

2. **Dodaj prawdziwe uwierzytelnienie**
   - Zastąp `mockUserId` prawdziwym `userId` z sesji

3. **Testuj różne paragony**
   - Sprawdź accuracy OCR
   - Sprawdź SQL matching

## Dokumentacja

Pełna dokumentacja: `.ai/receipts-service-integration.md`

---

**Powodzenia!** 🚀
