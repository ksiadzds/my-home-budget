# Plan implementacji OpenRouter Service

## Cel
Utworzenie serwisu do komunikacji z API OpenRouter w celu przetwarzania obrazów paragonów przez AI (OCR).

## Wymagania

### Funkcjonalne
1. Wysyłanie zapytań do OpenRouter API z obrazem paragonu
2. Parsowanie odpowiedzi JSON zgodnie ze zdefiniowanym schematem
3. Walidacja odpowiedzi względem schematu
4. Obsługa błędów komunikacji i parsowania

### Techniczne
- TypeScript 5
- Astro 5 (server-side only)
- Integracja z istniejącym kodem (products.service, categories.service)
- Konfiguracja przez zmienne środowiskowe

## Struktura plików

```
src/lib/services/
├── openrouter.service.ts       # Główny serwis
├── openrouter.types.ts         # Typy TypeScript
└── receipts.service.ts         # Serwis do przetwarzania paragonów (integracja)
```

## Implementacja OpenRouter Service

### 1. Typy (`openrouter.types.ts`)

```typescript
// Typ dla komunikatu w konwersacji
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | MessageContent[];
}

export type MessageContent = 
  | string 
  | Array<{
      type: 'text' | 'image_url';
      text?: string;
      image_url?: { url: string };
    }>;

// Schemat JSON dla response format
export interface JsonSchemaDefinition {
  type: string;
  properties?: Record<string, any>;
  required?: string[];
  additionalProperties?: boolean;
}

// Response format zgodny z OpenRouter API
export interface ResponseFormat {
  type: 'json_schema';
  json_schema: {
    name: string;
    strict: boolean;
    schema: JsonSchemaDefinition;
  };
}

// Parametry modelu
export interface ModelParameters {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

// Konfiguracja serwisu
export interface OpenRouterConfig {
  model: string;
  parameters?: ModelParameters;
  response_format?: ResponseFormat;
  systemMessage?: string;
}

// Odpowiedź z API
export interface OpenRouterResponse {
  id: string;
  model: string;
  created: number;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Typy błędów
export type OpenRouterErrorType = 
  | 'authorization_error'
  | 'network_error'
  | 'validation_error'
  | 'server_error';

export interface OpenRouterError {
  type: OpenRouterErrorType;
  message: string;
  originalError?: any;
  retryable: boolean;
}
```

### 2. Główny serwis (`openrouter.service.ts`)

**Konstruktor:**
- Walidacja API key z zmiennych środowiskowych
- Konfiguracja domyślna (model, parametry, response_format)

**Metoda `sendRequest()`:**
- Przygotowanie payloadu z komunikatami
- Wysłanie zapytania POST do OpenRouter API
- Obsługa błędów HTTP

**Metoda `parseResponse()`:**
- Parsowanie JSON z odpowiedzi
- Walidacja względem schematu
- Fallback: ekstrakcja JSON z markdown

### 3. Receipts Service (`receipts.service.ts`)

**Integracja:**
```typescript
export class ReceiptsService {
  private openRouterService: OpenRouterService;
  private productsService: ProductsService;

  constructor(supabase: SupabaseClient) {
    this.productsService = new ProductsService(supabase);
    
    // Konfiguracja OpenRouter dla OCR
    this.openRouterService = new OpenRouterService({
      model: 'openai/gpt-4o-mini',
      systemMessage: 'Jesteś specjalistą od analizy paragonów...',
      response_format: { /* JSON schema */ }
    });
  }

  async processReceipt(userId: string, receiptFile: File) {
    // 1. Konwersja obrazu do base64
    // 2. OCR przez OpenRouter
    // 3. Proste SQL matching produktów
    // 4. Generowanie podsumowania
  }
}
```

## Zmienne środowiskowe

```bash
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_API_URL=https://openrouter.ai/api/v1/chat/completions
SITE_URL=http://localhost:4321
```

## Model AI

**GPT-4o-mini:**
- Vision support (obrazy)
- JSON schema mode
- Niski koszt ($0.15 / 1M tokens)
- Szybkość ~2-5s

## Proces przetwarzania

1. **OCR** - wyciągnięcie produktów i cen z obrazu
2. **SQL Matching** - proste porównanie nazw z bazą użytkownika
3. **Klasyfikacja:**
   - Matched: produkt istnieje w bazie → zwracamy z kategorią
   - Unmatched: produkt nie istnieje → użytkownik wybiera kategorię
4. **Podsumowanie** - agregacja wydatków według kategorii

## Status
✅ Zaplanowano
🔄 W trakcie implementacji

