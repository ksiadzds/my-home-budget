// src/lib/services/openrouter.types.ts

/**
 * Typy dla OpenRouter Service
 */

// Typ dla zawartości komunikatu - może być string lub array (dla vision)
export type MessageContent =
  | string
  | {
      type: "text" | "image_url";
      text?: string;
      image_url?: {
        url: string;
      };
    }[];

// Typ dla komunikatu w konwersacji
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: MessageContent;
}

// Typ dla schematu JSON zgodnego z wymogami OpenRouter
export interface JsonSchemaDefinition {
  type: string;
  properties?: Record<string, any>;
  required?: string[];
  additionalProperties?: boolean;
  [key: string]: unknown;
}

// Typ dla response_format zgodnie z API OpenRouter
export interface ResponseFormat {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: boolean;
    schema: JsonSchemaDefinition;
  };
}

// Typ dla parametrów modelu
export interface ModelParameters {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  [key: string]: unknown;
}

// Typ dla konfiguracji serwisu
export interface OpenRouterConfig {
  model: string;
  parameters?: ModelParameters;
  response_format?: ResponseFormat;
  systemMessage?: string;
}

// Typ dla payloadu wysyłanego do API
export interface RequestPayload {
  model: string;
  messages: ChatMessage[];
  response_format?: ResponseFormat;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

// Typ dla odpowiedzi z API OpenRouter
export interface OpenRouterResponse {
  id: string;
  model: string;
  created: number;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Typy błędów OpenRouter
export type OpenRouterErrorType =
  | "authorization_error"
  | "network_error"
  | "validation_error"
  | "rate_limit_error"
  | "server_error"
  | "unknown_error";

export interface OpenRouterError {
  type: OpenRouterErrorType;
  message: string;
  originalError?: unknown;
  retryable: boolean;
}
