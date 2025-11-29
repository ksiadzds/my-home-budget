// src/types.ts

// DTO dla kategorii, odpowiada tabeli "kategorie"
export interface CategoryDTO {
    id: string;
    nazwa_kategorii: string;
  }
  
  // DTO dla produktu, odpowiada tabeli "produkty"
  export interface ProductDTO {
    id: string;
    nazwa_produktu: string;
    kategoria_id: string | null; // Nullable - produkt może nie mieć przypisanej kategorii
    user_id: string;
    created_at: string;
    updated_at: string;
  }
  
  // Command model do tworzenia produktu - wykorzystuje definicję z encji "produkty"
  // Wyklucza pola zarządzane automatycznie: id, user_id, created_at, updated_at
  // kategoria_id jest opcjonalne - produkt może być utworzony bez kategorii (np. przez OCR)
  export type CreateProductCommand = Omit<ProductDTO, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
  
  // Command model do aktualizacji produktu - struktura identyczna jak przy tworzeniu
  export type UpdateProductCommand = CreateProductCommand;
  
  // Command model do przypisania kategorii do produktu (manual override)
  // Używany przy endpointzie "/api/products/{id}/assign-category"
  export interface AssignCategoryCommand {
    kategoria_id: string;
  }
  
  // DTO dla logów błędów OCR, odpowiada tabeli "ocr_error_logs"
  export interface OCRErrorLogDTO {
    id: string;
    error_type: 'ocr_failed' | 'summary_failed' | 'parsing_error' | 'network_error';
    error_message: string;
    source_image_size: number | null;
    processing_duration: number | null;
    created_at: string;
  }
  
  // Parametry zapytania dla listowania produktów
export interface ListProductsQuery {
  page?: number;
  limit?: number;
  filter?: string; // JSON string
  sort?: string;
}

// DTO dla metadanych paginacji
export interface PaginationMetaDTO {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

// DTO odpowiedzi dla listy produktów
export interface ListProductsResponseDTO {
  products: ProductDTO[];
  pagination: PaginationMetaDTO;
}

// DTO odpowiedzi dla pojedynczego produktu
export interface GetProductResponseDTO {
  product: ProductDTO;
}

// Typy dla filtrowania
export interface ProductFilter {
  category_id?: string;
  product_name?: string;
}

// Typy dla sortowania
export type ProductSortField = 'nazwa_produktu' | 'created_at' | 'updated_at';
export type SortOrder = 'asc' | 'desc';
export interface ProductSort {
  field: ProductSortField;
  order: SortOrder;
}

// DTO dla produktu dopasowanego przez OCR (dla MVP: logika oparta na prostym SELECT, porównująca dokładnie nazwę)
  export interface MatchedProductDTO {
    nazwa_produktu: string;
    // kategoria_id jest opcjonalne, gdy SELECT nie zwróci dopasowania
    kategoria_id?: string;
    confidence: number;
    price: number;
}
  
  // DTO dla produktu niezidentyfikowanego przez OCR, który wymaga manualnego przypisania
  export interface UnmatchedProductDTO {
    nazwa_produktu: string;
    price: number;
    // Lista sugerowanych kategorii oparta na CategoryDTO
    suggested_categories: CategoryDTO[];
  }
  
  // DTO jednego wpisu podsumowania, zawiera kategorię oraz łączny koszt
  export interface SummaryItemDTO {
    category: CategoryDTO;
    total_expense: number;
    items_count: number;
  }
  
  // DTO odpowiedzi z endpointu przetwarzania paragonu
  export interface ReceiptProcessingResponseDTO {
    message: string;
    matched_products: MatchedProductDTO[];
    unmatched_products: UnmatchedProductDTO[];
    summary: {
      by_category: SummaryItemDTO[];
      total: number;
    };
  }
  
  // DTO odpowiedzi z endpointu podsumowania OCR, zawiera listę podsumowań
  export interface ReceiptSummaryDTO {
    summary: SummaryItemDTO[];
  }

  // =========================================
  // TYPY DLA WIDOKU DASHBOARD
  // =========================================

  /**
   * Krok przepływu w widoku Dashboard
   * 
   * @typedef {string} DashboardStep
   * @property {'idle'} idle - Stan początkowy, widoczny uploader
   * @property {'processing'} processing - Przetwarzanie OCR, widoczny loader
   * @property {'result'} result - Wyniki OCR, widoczna weryfikacja i podsumowanie
   */
  export type DashboardStep = 'idle' | 'processing' | 'result';

  /**
   * Wiersz produktu dopasowanego automatycznie przez OCR
   * 
   * @interface MatchedRow
   * @description
   * Reprezentuje produkt, który został automatycznie dopasowany do kategorii.
   * Wyświetlany w VerificationList z zielonym tłem (read-only).
   */
  export interface MatchedRow {
    /** Typ wiersza dla discriminated union */
    type: 'matched';
    
    /** Lokalne UUID wiersza generowane przez klienta (crypto.randomUUID) */
    id: string;
    
    /** Nazwa produktu rozpoznana przez OCR */
    nazwa_produktu: string;
    
    /** UUID kategorii jeśli wykryto dopasowanie */
    kategoria_id?: string;
    
    /** Cena produktu w PLN */
    price: number;
  }

  /**
   * Wiersz produktu niedopasowanego wymagającego ręcznej kategoryzacji
   * 
   * @interface UnmatchedRow
   * @description
   * Reprezentuje produkt, który nie został automatycznie dopasowany.
   * Wymaga ręcznego wyboru kategorii przez użytkownika.
   * Wyświetlany w VerificationList z pomarańczowym tłem (edytowalny).
   */
  export interface UnmatchedRow {
    /** Typ wiersza dla discriminated union */
    type: 'unmatched';
    
    /** Lokalne UUID wiersza generowane przez klienta */
    id: string;
    
    /** Nazwa produktu rozpoznana przez OCR */
    nazwa_produktu: string;
    
    /** Cena produktu w PLN */
    price: number;
    
    /** Lista sugerowanych kategorii z OCR (fallback: wszystkie kategorie) */
    suggested_categories: CategoryDTO[];
    
    /** UUID kategorii wybranej przez użytkownika */
    selected_category_id?: string;
    
    /** Flaga zapisu do bazy (blokuje CategorySelect) */
    isSaving: boolean;
    
    /** UUID utworzonego produktu po pomyślnym POST /api/products */
    created_product_id?: string;
    
    /** Komunikat błędu z ostatniej mutacji (duplikat, FK, 500) */
    error_message?: string;
  }

  /**
   * Discriminated union wierszy weryfikacji (matched | unmatched)
   * 
   * @typedef {MatchedRow | UnmatchedRow} VerificationRow
   * @description
   * Używane w VerificationList do renderowania różnych typów wierszy.
   * TypeScript automatycznie zawęża typ na podstawie pola 'type'.
   */
  export type VerificationRow = MatchedRow | UnmatchedRow;

  /**
   * Model widoku dla wyników OCR
   * 
   * @interface OcrResultViewModel
   * @description
   * Zmapowana odpowiedź z API ReceiptProcessingResponseDTO.
   * Zawiera wiersze weryfikacji i podsumowanie wydatków.
   * Lokalne ID wierszy generowane przez klienta dla reaktywności.
   */
  export interface OcrResultViewModel {
    /** Lista produktów dopasowanych automatycznie */
    matched_rows: MatchedRow[];
    
    /** Lista produktów wymagających ręcznej kategoryzacji */
    unmatched_rows: UnmatchedRow[];
    
    /** Podsumowanie wydatków wg kategorii z OCR */
    summary: ReceiptProcessingResponseDTO['summary'];
  }

  /**
   * Błąd walidacji pliku w komponencie UploadDropzone
   * 
   * @typedef {Object} UploadValidationError
   * @description
   * Discriminated union błędów walidacji uploadu.
   * Zawiera kod błędu i czytelny komunikat dla użytkownika.
   */
  export type UploadValidationError =
    | { code: 'invalid_type'; message: string }
    | { code: 'too_large'; message: string };

  // =========================================
  // TYPY DLA WIDOKU PRODUCTS (CRUD)
  // =========================================

  /**
   * ViewModel stanu widoku Produkty
   * 
   * @interface ProductsViewState
   * @description
   * Stan zarządzany przez komponent ProductsView.
   * Zawiera dane produktów, kategorie, parametry zapytania i flagi stanu.
   */
  export interface ProductsViewState {
    /** Lista produktów z aktualnej strony */
    products: ProductDTO[];
    
    /** Metadane paginacji */
    pagination: PaginationMetaDTO;
    
    /** Lista wszystkich kategorii (prefetch) */
    categories: CategoryDTO[];
    
    /** Parametry zapytania do API */
    queryParams: {
      page: number;
      limit: number;
      filter?: ProductFilter;
      sort?: ProductSort;
    };
    
    /** Flagi stanu */
    isLoadingProducts: boolean;
    isLoadingCategories: boolean;
    errorProducts?: string;
    errorCategories?: string;
    
    /** Dialog potwierdzenia usunięcia */
    confirmDialog: {
      open: boolean;
      productId?: string;
      productName?: string;
    };
    
    /** Flaga mutacji (edycja/usunięcie w toku) */
    isMutating: boolean;
  }

  /**
   * Parametry wyszukiwania produktów
   * 
   * @interface ProductSearchParams
   * @description
   * Parametry do konstruowania query string dla GET /api/products.
   */
  export interface ProductSearchParams {
    page: number;
    limit: number;
    filter?: string; // JSON string: {"product_name": "mleko"}
    sort?: string;   // Format: "nazwa_produktu:asc"
  }

  /**
   * Typ pustego stanu widoku Products
   * 
   * @typedef {string} EmptyStateType
   * @property {'no_products'} no_products - Brak produktów w bazie
   * @property {'no_results'} no_results - Brak wyników wyszukiwania
   */
  export type EmptyStateType = 'no_products' | 'no_results';

  /**
   * Payload błędu mutacji produktu
   * 
   * @interface ProductMutationError
   * @description
   * Błąd zwracany z API podczas edycji lub usunięcia produktu.
   */
  export interface ProductMutationError {
    error: string;
    details?: Record<string, string[]>; // Zod validation errors
  }

  /**
   * Request body dla PUT /api/products/{id}
   */
  export interface UpdateProductRequest {
    nazwa_produktu: string;
    kategoria_id: string | null;
  }

  /**
   * Response body dla PUT /api/products/{id}
   */
  export interface UpdateProductResponse {
    message: string;
    product: ProductDTO;
  }

  /**
   * Response body dla DELETE /api/products/{id}
   */
  export interface DeleteProductResponse {
    message: string;
  }

  /**
   * Response body dla GET /api/categories
   */
  export interface GetCategoriesResponse {
    categories: CategoryDTO[];
  }