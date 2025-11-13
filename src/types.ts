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
    kategoria_id: string;
    user_id: string;
    created_at: string;
    updated_at: string;
  }
  
  // Command model do tworzenia produktu - wykorzystuje definicję z encji "produkty"
  // Wyklucza pola zarządzane automatycznie: id, user_id, created_at, updated_at
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
}
  
  // DTO dla produktu niezidentyfikowanego przez OCR, który wymaga manualnego przypisania
  export interface UnmatchedProductDTO {
    nazwa_produktu: string;
    // Lista sugerowanych kategorii oparta na CategoryDTO
    suggested_categories: CategoryDTO[];
  }
  
  // DTO odpowiedzi z endpointu przetwarzania paragonu
  export interface ReceiptProcessingResponseDTO {
    message: string;
    matched_products: MatchedProductDTO[];
    unmatched_products: UnmatchedProductDTO[];
  }
  
  // DTO jednego wpisu podsumowania, zawiera kategorię oraz łączny koszt
  export interface SummaryItemDTO {
    category: CategoryDTO;
    total_expense: number;
  }
  
  // DTO odpowiedzi z endpointu podsumowania OCR, zawiera listę podsumowań
  export interface ReceiptSummaryDTO {
    summary: SummaryItemDTO[];
  }