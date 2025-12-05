// src/lib/services/openrouter.service.ts

import type {
  ChatMessage,
  MessageContent,
  JsonSchemaDefinition,
  OpenRouterConfig,
  OpenRouterError,
  OpenRouterErrorType,
  OpenRouterResponse,
  RequestPayload,
  ResponseFormat,
} from "./openrouter.types";

/**
 * Serwis do komunikacji z API OpenRouter
 *
 * @description
 * Moduł integrujący funkcjonalności API OpenRouter w celu uzupełnienia czatów
 * opartych na LLM. Umożliwia wysyłanie zapytań, odbieranie i walidację odpowiedzi
 * zgodnie z ustalonym schematem JSON.
 *
 * @example
 * ```typescript
 * const service = new OpenRouterService({
 *   model: 'openai/gpt-4o-mini',
 *   systemMessage: 'Jesteś asystentem analizy paragonów',
 *   response_format: {
 *     type: 'json_schema',
 *     json_schema: {
 *       name: 'receipt_analysis',
 *       strict: true,
 *       schema: { type: 'object', properties: {...} }
 *     }
 *   }
 * });
 *
 * const result = await service.sendRequest('Przeanalizuj paragon...');
 * const parsed = service.parseResponse(result);
 * ```
 */
export class OpenRouterService {
  // Prywatne pola konfiguracyjne
  private readonly apiKey: string;
  private readonly apiUrl: string;
  private readonly config: OpenRouterConfig;
  private readonly maxRetries: number;
  private readonly retryDelay: number;

  // Publiczne pole z konfiguracją domyślną
  public readonly defaultConfig: OpenRouterConfig;

  /**
   * Konstruktor serwisu OpenRouter
   *
   * @param config - Konfiguracja serwisu zawierająca ustawienia modelu i parametry
   * @throws Error gdy brak wymaganego klucza API w zmiennych środowiskowych
   * @throws Error gdy konfiguracja jest nieprawidłowa
   *
   * @description
   * Inicjalizuje serwis z konfiguracją API, domyślnymi wartościami dla komunikatów
   * oraz walidacją ustawień response_format i parametrów modelu.
   */
  constructor(config: OpenRouterConfig) {
    // Walidacja klucza API
    const apiKey = import.meta.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY nie została znaleziona w zmiennych środowiskowych");
    }

    // Walidacja konfiguracji
    this.validateConfig(config);

    // Inicjalizacja pól prywatnych
    this.apiKey = apiKey;
    this.apiUrl = import.meta.env.OPENROUTER_API_URL || "https://openrouter.ai/api/v1/chat/completions";
    this.config = config;
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 sekunda

    // Ustawienie domyślnej konfiguracji
    this.defaultConfig = {
      model: config.model || "openai/gpt-4o-mini",
      parameters: {
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 1.0,
        frequency_penalty: 0,
        presence_penalty: 0,
        ...config.parameters,
      },
      systemMessage: config.systemMessage || "Jesteś pomocnym asystentem AI.",
      response_format: config.response_format,
    };
  }

  /**
   * Wysyła zapytanie do API OpenRouter
   *
   * @param userMessage - Komunikat użytkownika do przetworzenia (string lub array dla vision)
   * @param customConfig - Opcjonalna niestandardowa konfiguracja dla tego zapytania
   * @returns Odpowiedź z API OpenRouter
   * @throws OpenRouterError w przypadku błędów komunikacji lub autoryzacji
   *
   * @description
   * Przygotowuje komunikaty systemowe i użytkownika, buduje payload
   * zgodny z API OpenRouter i wysyła zapytanie z obsługą retry.
   * Obsługuje zarówno zwykłe teksty jak i vision inputs (obrazy).
   */
  async sendRequest(
    userMessage: MessageContent,
    customConfig?: Partial<OpenRouterConfig>
  ): Promise<OpenRouterResponse> {
    // Walidacja komunikatu użytkownika
    if (!userMessage) {
      throw this.createError("validation_error", "Komunikat użytkownika nie może być pusty", null, false);
    }

    // Jeśli userMessage jest stringiem, sprawdź czy nie jest pusty
    if (typeof userMessage === "string" && userMessage.trim().length === 0) {
      throw this.createError("validation_error", "Komunikat użytkownika nie może być pusty", null, false);
    }

    // Połączenie domyślnej konfiguracji z niestandardową
    const effectiveConfig: OpenRouterConfig = {
      ...this.defaultConfig,
      ...customConfig,
      parameters: {
        ...this.defaultConfig.parameters,
        ...customConfig?.parameters,
      },
    };

    // Przygotowanie payloadu
    const payload = this._preparePayload(userMessage, effectiveConfig);

    // Wysłanie zapytania z mechanizmem retry
    return await this._sendWithRetry(payload);
  }

  /**
   * Parsuje i waliduje odpowiedź z API
   *
   * @param response - Odpowiedź z API OpenRouter
   * @returns Sparsowany obiekt JSON zgodny ze schematem
   * @throws OpenRouterError gdy odpowiedź nie jest zgodna ze schematem
   *
   * @description
   * Waliduje strukturę odpowiedzi i parsuje JSON content zgodnie
   * z zdefiniowanym response_format. Implementuje logikę fallback
   * w przypadku niezgodności formatu.
   */
  parseResponse<T = any>(response: OpenRouterResponse): T {
    // Walidacja struktury odpowiedzi
    if (!response.choices || response.choices.length === 0) {
      throw this.createError("validation_error", "Odpowiedź z API nie zawiera wyników", response, false);
    }

    const messageContent = response.choices[0].message.content;

    // Walidacja zawartości wiadomości
    if (!messageContent) {
      throw this.createError("validation_error", "Odpowiedź z API nie zawiera treści wiadomości", response, false);
    }

    // Próba parsowania JSON
    try {
      const parsed = JSON.parse(messageContent) as T;

      // Jeśli zdefiniowano schemat, przeprowadź dodatkową walidację
      if (this.config.response_format?.json_schema.schema) {
        this.validateAgainstSchema(parsed, this.config.response_format.json_schema.schema);
      }

      return parsed;
    } catch (error) {
      // Logika fallback - próba ekstrakcji JSON z tekstu
      const extractedJson = this.extractJsonFromText(messageContent);

      if (extractedJson) {
        console.warn("Użyto logiki fallback do ekstrakcji JSON z odpowiedzi");
        return extractedJson as T;
      }

      throw this.createError("validation_error", "Nie udało się sparsować odpowiedzi jako JSON", error, false);
    }
  }

  /**
   * Przygotowuje payload dla zapytania do API
   *
   * @param userMessage - Komunikat użytkownika (string lub array dla vision)
   * @param config - Konfiguracja dla zapytania
   * @returns Przygotowany payload
   * @private
   *
   * @description
   * Buduje ładunek requestu zawierający:
   * 1. Komunikat systemowy
   * 2. Komunikat użytkownika (tekst lub vision content)
   * 3. Parametry response_format
   * 4. Nazwę modelu i jego parametry
   */
  private _preparePayload(userMessage: MessageContent, config: OpenRouterConfig): RequestPayload {
    // Przygotowanie komunikatów
    const messages: ChatMessage[] = [];

    // Dodanie komunikatu systemowego jeśli istnieje
    if (config.systemMessage) {
      messages.push({
        role: "system",
        content: config.systemMessage,
      });
    }

    // Dodanie komunikatu użytkownika
    messages.push({
      role: "user",
      content: userMessage,
    });

    // Budowanie payloadu
    const payload: RequestPayload = {
      model: config.model,
      messages,
      ...config.parameters,
    };

    // Dodanie response_format jeśli zdefiniowano
    if (config.response_format) {
      payload.response_format = config.response_format;
    }

    return payload;
  }

  /**
   * Wysyła zapytanie z mechanizmem retry
   *
   * @param payload - Payload do wysłania
   * @param attempt - Numer próby (domyślnie 1)
   * @returns Odpowiedź z API
   * @throws OpenRouterError po wyczerpaniu prób
   * @private
   */
  private async _sendWithRetry(payload: RequestPayload, attempt = 1): Promise<OpenRouterResponse> {
    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "HTTP-Referer": import.meta.env.SITE_URL || "http://localhost:4321",
          "X-Title": "Home Budget App",
        },
        body: JSON.stringify(payload),
      });

      // Obsługa błędów HTTP
      if (!response.ok) {
        await this._handleHttpError(response, payload, attempt);
      }

      const data = await response.json();
      return data as OpenRouterResponse;
    } catch (error) {
      // Obsługa błędów sieciowych
      if (attempt < this.maxRetries) {
        console.warn(`Próba ${attempt} nieudana, ponowienie za ${this.retryDelay}ms...`);
        await this.sleep(this.retryDelay * attempt);
        return this._sendWithRetry(payload, attempt + 1);
      }

      throw this.createError("network_error", "Nie udało się połączyć z API OpenRouter", error, true);
    }
  }

  /**
   * Obsługuje błędy HTTP z API
   *
   * @param response - Odpowiedź HTTP
   * @param payload - Oryginalny payload
   * @param attempt - Numer próby
   * @throws OpenRouterError
   * @private
   */
  private async _handleHttpError(response: Response, payload: RequestPayload, attempt: number): Promise<never> {
    const errorData = await response.json().catch(() => ({}));

    // Obsługa błędu autoryzacji (401)
    if (response.status === 401) {
      throw this.createError("authorization_error", "Nieprawidłowy klucz API OpenRouter", errorData, false);
    }

    // Obsługa rate limit (429)
    if (response.status === 429 && attempt < this.maxRetries) {
      const retryAfter = parseInt(response.headers.get("Retry-After") || String(this.retryDelay));
      console.warn(`Rate limit osiągnięty, ponowienie za ${retryAfter}ms...`);
      await this.sleep(retryAfter);
      throw { retry: true }; // Signal do retry
    }

    // Obsługa błędów serwera (500+)
    if (response.status >= 500 && attempt < this.maxRetries) {
      console.warn(`Błąd serwera ${response.status}, ponowienie za ${this.retryDelay}ms...`);
      await this.sleep(this.retryDelay * attempt);
      throw { retry: true };
    }

    // Inne błędy
    throw this.createError(
      "server_error",
      `Błąd API: ${response.status} - ${errorData.error?.message || "Nieznany błąd"}`,
      errorData,
      response.status >= 500
    );
  }

  /**
   * Waliduje konfigurację serwisu
   *
   * @param config - Konfiguracja do walidacji
   * @throws Error gdy konfiguracja jest nieprawidłowa
   * @private
   */
  private validateConfig(config: OpenRouterConfig): void {
    if (!config.model || config.model.trim().length === 0) {
      throw new Error("Nazwa modelu jest wymagana w konfiguracji");
    }

    // Walidacja response_format jeśli istnieje
    if (config.response_format) {
      const rf = config.response_format;

      if (rf.type !== "json_schema") {
        throw new Error('response_format.type musi być "json_schema"');
      }

      if (!rf.json_schema.name || rf.json_schema.name.trim().length === 0) {
        throw new Error("response_format.json_schema.name jest wymagane");
      }

      if (typeof rf.json_schema.strict !== "boolean") {
        throw new Error("response_format.json_schema.strict musi być boolean");
      }

      if (!rf.json_schema.schema || typeof rf.json_schema.schema !== "object") {
        throw new Error("response_format.json_schema.schema musi być obiektem");
      }
    }

    // Walidacja parametrów modelu
    if (config.parameters) {
      const params = config.parameters;

      if (params.temperature !== undefined && (params.temperature < 0 || params.temperature > 2)) {
        throw new Error("temperature musi być w zakresie 0-2");
      }

      if (params.max_tokens !== undefined && params.max_tokens < 1) {
        throw new Error("max_tokens musi być większe od 0");
      }

      if (params.top_p !== undefined && (params.top_p < 0 || params.top_p > 1)) {
        throw new Error("top_p musi być w zakresie 0-1");
      }
    }
  }

  /**
   * Waliduje obiekt względem schematu JSON
   *
   * @param data - Dane do walidacji
   * @param schema - Schemat JSON
   * @throws OpenRouterError gdy dane nie są zgodne ze schematem
   * @private
   */
  private validateAgainstSchema(data: any, schema: JsonSchemaDefinition): void {
    // Podstawowa walidacja typu
    if (schema.type === "object" && typeof data !== "object") {
      throw this.createError("validation_error", `Oczekiwano obiektu, otrzymano ${typeof data}`, null, false);
    }

    // Walidacja wymaganych pól
    if (schema.required && Array.isArray(schema.required)) {
      for (const field of schema.required) {
        if (!(field in data)) {
          throw this.createError("validation_error", `Brak wymaganego pola: ${field}`, null, false);
        }
      }
    }
  }

  /**
   * Próbuje wyekstrahować JSON z tekstu (fallback)
   *
   * @param text - Tekst zawierający potencjalnie JSON
   * @returns Sparsowany JSON lub null
   * @private
   */
  private extractJsonFromText(text: string): any | null {
    // Próba znalezienia JSON między znacznikami
    const jsonMatch =
      text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } catch {
        return null;
      }
    }

    return null;
  }

  /**
   * Tworzy znormalizowany obiekt błędu
   *
   * @param type - Typ błędu
   * @param message - Komunikat błędu
   * @param originalError - Oryginalny błąd
   * @param retryable - Czy błąd można ponowić
   * @returns OpenRouterError
   * @private
   */
  private createError(
    type: OpenRouterErrorType,
    message: string,
    originalError: any,
    retryable: boolean
  ): OpenRouterError {
    const error: OpenRouterError = {
      type,
      message,
      retryable,
    };

    // Logowanie błędu (bez ujawniania wrażliwych danych)
    console.error(`[OpenRouterService] ${type}: ${message}`);

    // Dodanie oryginalnego błędu tylko w środowisku deweloperskim
    if (import.meta.env.DEV && originalError) {
      error.originalError = originalError;
    }

    return error;
  }

  /**
   * Funkcja pomocnicza do opóźnienia
   *
   * @param ms - Milisekundy opóźnienia
   * @private
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
