// __tests__/unit/utils/dashboard.utils.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { recalculateSummary, mapApiResponseToViewModel } from "@/lib/utils/dashboard.utils";
import type { MatchedRow, UnmatchedRow, CategoryDTO, ReceiptProcessingResponseDTO } from "@/types";

/**
 * Test Suite: Dashboard Utils
 *
 * @description
 * Testy funkcji pomocniczych dla widoku Dashboard.
 * Sprawdza zgodność z regułami biznesowymi:
 * - Przeliczanie podsumowania na podstawie produktów
 * - Mapowanie odpowiedzi API na ViewModel
 * - Zaokrąglanie kwot do 2 miejsc po przecinku
 * - Sortowanie kategorii według wydatków
 */

// =========================================
// MOCK DATA
// =========================================

const mockCategories: CategoryDTO[] = [
  { id: "cat-groceries", nazwa_kategorii: "Zakupy spożywcze" },
  { id: "cat-sweets", nazwa_kategorii: "Słodycze i przekąski" },
  { id: "cat-drinks", nazwa_kategorii: "Napoje" },
  { id: "cat-other", nazwa_kategorii: "Pozostałe" },
];

// =========================================
// TEST SUITE: recalculateSummary
// =========================================

describe("recalculateSummary", () => {
  // =========================================
  // TESTY PODSTAWOWE
  // =========================================

  describe("Basic Functionality", () => {
    it("should calculate summary for matched products only", () => {
      // Arrange
      const matched: MatchedRow[] = [
        {
          type: "matched",
          id: "row-1",
          nazwa_produktu: "Mleko",
          kategoria_id: "cat-groceries",
          price: 5.99,
        },
        {
          type: "matched",
          id: "row-2",
          nazwa_produktu: "Chleb",
          kategoria_id: "cat-groceries",
          price: 3.5,
        },
      ];
      const unmatched: UnmatchedRow[] = [];

      // Act
      const summary = recalculateSummary(matched, unmatched, mockCategories);

      // Assert
      expect(summary.by_category).toHaveLength(1);
      expect(summary.by_category[0]).toEqual({
        category: mockCategories[0],
        total_expense: 9.49,
        items_count: 2,
      });
      expect(summary.total).toBe(9.49);
    });

    it("should calculate summary for multiple categories", () => {
      // Arrange
      const matched: MatchedRow[] = [
        { type: "matched", id: "1", nazwa_produktu: "Mleko", kategoria_id: "cat-groceries", price: 5.99 },
        { type: "matched", id: "2", nazwa_produktu: "Czekolada", kategoria_id: "cat-sweets", price: 4.5 },
        { type: "matched", id: "3", nazwa_produktu: "Sok", kategoria_id: "cat-drinks", price: 6.0 },
      ];

      // Act
      const summary = recalculateSummary(matched, [], mockCategories);

      // Assert
      expect(summary.by_category).toHaveLength(3);
      expect(summary.total).toBe(16.49);
    });

    it("should return empty summary when no products", () => {
      // Arrange
      const matched: MatchedRow[] = [];
      const unmatched: UnmatchedRow[] = [];

      // Act
      const summary = recalculateSummary(matched, unmatched, mockCategories);

      // Assert
      expect(summary.by_category).toHaveLength(0);
      expect(summary.total).toBe(0);
    });
  });

  // =========================================
  // TESTY PRODUKTÓW NIEDOPASOWANYCH
  // =========================================

  describe("Unmatched Products Logic", () => {
    it("should include unmatched products with selected category AND created_product_id", () => {
      // Arrange
      const matched: MatchedRow[] = [];
      const unmatched: UnmatchedRow[] = [
        {
          type: "unmatched",
          id: "row-1",
          nazwa_produktu: "Czekolada",
          price: 4.99,
          selected_category_id: "cat-sweets",
          created_product_id: "prod-123", // Zapisany!
          isSaving: false,
          suggested_categories: [],
        },
      ];

      // Act
      const summary = recalculateSummary(matched, unmatched, mockCategories);

      // Assert
      expect(summary.by_category).toHaveLength(1);
      expect(summary.by_category[0]).toEqual({
        category: mockCategories[1],
        total_expense: 4.99,
        items_count: 1,
      });
    });

    it("should NOT include unmatched products without created_product_id", () => {
      // Arrange
      const matched: MatchedRow[] = [];
      const unmatched: UnmatchedRow[] = [
        {
          type: "unmatched",
          id: "row-1",
          nazwa_produktu: "Czekolada",
          price: 4.99,
          selected_category_id: "cat-sweets",
          created_product_id: undefined, // NIE zapisany!
          isSaving: false,
          suggested_categories: [],
        },
      ];

      // Act
      const summary = recalculateSummary(matched, unmatched, mockCategories);

      // Assert
      expect(summary.by_category).toHaveLength(0);
      expect(summary.total).toBe(0);
    });

    it("should NOT include unmatched products without selected_category_id", () => {
      // Arrange
      const matched: MatchedRow[] = [];
      const unmatched: UnmatchedRow[] = [
        {
          type: "unmatched",
          id: "row-1",
          nazwa_produktu: "Czekolada",
          price: 4.99,
          selected_category_id: undefined, // Nie wybrano kategorii
          created_product_id: "prod-123",
          isSaving: false,
          suggested_categories: [],
        },
      ];

      // Act
      const summary = recalculateSummary(matched, unmatched, mockCategories);

      // Assert
      expect(summary.by_category).toHaveLength(0);
      expect(summary.total).toBe(0);
    });

    it("should combine matched and unmatched products in same category", () => {
      // Arrange
      const matched: MatchedRow[] = [
        { type: "matched", id: "1", nazwa_produktu: "Mleko", kategoria_id: "cat-groceries", price: 5.99 },
      ];
      const unmatched: UnmatchedRow[] = [
        {
          type: "unmatched",
          id: "2",
          nazwa_produktu: "Chleb",
          price: 3.5,
          selected_category_id: "cat-groceries",
          created_product_id: "prod-123",
          isSaving: false,
          suggested_categories: [],
        },
      ];

      // Act
      const summary = recalculateSummary(matched, unmatched, mockCategories);

      // Assert
      expect(summary.by_category).toHaveLength(1);
      expect(summary.by_category[0]).toEqual({
        category: mockCategories[0],
        total_expense: 9.49,
        items_count: 2,
      });
    });

    it("should ignore unmatched products currently being saved (isSaving: true)", () => {
      // Arrange
      const matched: MatchedRow[] = [];
      const unmatched: UnmatchedRow[] = [
        {
          type: "unmatched",
          id: "row-1",
          nazwa_produktu: "Czekolada",
          price: 4.99,
          selected_category_id: "cat-sweets",
          created_product_id: undefined,
          isSaving: true, // W trakcie zapisywania
          suggested_categories: [],
        },
      ];

      // Act
      const summary = recalculateSummary(matched, unmatched, mockCategories);

      // Assert
      expect(summary.by_category).toHaveLength(0);
    });
  });

  // =========================================
  // TESTY ZAOKRĄGLANIA
  // =========================================

  describe("Price Rounding", () => {
    it("should round prices to 2 decimal places", () => {
      // Arrange
      const matched: MatchedRow[] = [
        { type: "matched", id: "1", nazwa_produktu: "Test", kategoria_id: "cat-groceries", price: 1.116 },
      ];

      // Act
      const summary = recalculateSummary(matched, [], mockCategories);

      // Assert
      expect(summary.by_category[0].total_expense).toBe(1.12);
      expect(summary.total).toBe(1.12);
    });

    it("should handle floating point arithmetic correctly", () => {
      // Arrange
      const matched: MatchedRow[] = [
        { type: "matched", id: "1", nazwa_produktu: "Item1", kategoria_id: "cat-groceries", price: 0.1 },
        { type: "matched", id: "2", nazwa_produktu: "Item2", kategoria_id: "cat-groceries", price: 0.2 },
      ];

      // Act
      const summary = recalculateSummary(matched, [], mockCategories);

      // Assert
      // 0.1 + 0.2 = 0.30000000000000004 w JavaScript
      // Ale po zaokrągleniu powinno być 0.30
      expect(summary.by_category[0].total_expense).toBe(0.3);
      expect(summary.total).toBe(0.3);
    });

    it("should round down prices at .xx4", () => {
      // Arrange
      const matched: MatchedRow[] = [
        { type: "matched", id: "1", nazwa_produktu: "Test", kategoria_id: "cat-groceries", price: 1.114 },
      ];

      // Act
      const summary = recalculateSummary(matched, [], mockCategories);

      // Assert
      expect(summary.by_category[0].total_expense).toBe(1.11);
    });

    it("should round up prices at .xx5", () => {
      // Arrange
      const matched: MatchedRow[] = [
        { type: "matched", id: "1", nazwa_produktu: "Test", kategoria_id: "cat-groceries", price: 1.115 },
      ];

      // Act
      const summary = recalculateSummary(matched, [], mockCategories);

      // Assert
      expect(summary.by_category[0].total_expense).toBe(1.12);
    });

    it("should handle very large sums with proper rounding", () => {
      // Arrange
      const matched: MatchedRow[] = [
        { type: "matched", id: "1", nazwa_produktu: "Expensive", kategoria_id: "cat-groceries", price: 999.999 },
      ];

      // Act
      const summary = recalculateSummary(matched, [], mockCategories);

      // Assert
      expect(summary.by_category[0].total_expense).toBe(1000.0);
    });
  });

  // =========================================
  // TESTY SORTOWANIA
  // =========================================

  describe("Sorting by Expense", () => {
    it("should sort categories by highest expense first", () => {
      // Arrange
      const matched: MatchedRow[] = [
        { type: "matched", id: "1", nazwa_produktu: "Czekolada", kategoria_id: "cat-sweets", price: 5.0 },
        { type: "matched", id: "2", nazwa_produktu: "Mleko", kategoria_id: "cat-groceries", price: 20.0 },
        { type: "matched", id: "3", nazwa_produktu: "Sok", kategoria_id: "cat-drinks", price: 12.0 },
      ];

      // Act
      const summary = recalculateSummary(matched, [], mockCategories);

      // Assert
      expect(summary.by_category[0].category.id).toBe("cat-groceries"); // 20.00
      expect(summary.by_category[1].category.id).toBe("cat-drinks"); // 12.00
      expect(summary.by_category[2].category.id).toBe("cat-sweets"); // 5.00
    });

    it("should maintain stable sort for equal expenses", () => {
      // Arrange
      const matched: MatchedRow[] = [
        { type: "matched", id: "1", nazwa_produktu: "A", kategoria_id: "cat-sweets", price: 10.0 },
        { type: "matched", id: "2", nazwa_produktu: "B", kategoria_id: "cat-drinks", price: 10.0 },
      ];

      // Act
      const summary = recalculateSummary(matched, [], mockCategories);

      // Assert
      expect(summary.by_category).toHaveLength(2);
      // Obydwie kategorie mają tę samą sumę
      expect(summary.by_category[0].total_expense).toBe(10.0);
      expect(summary.by_category[1].total_expense).toBe(10.0);
    });
  });

  // =========================================
  // TESTY LICZNIKA PRODUKTÓW
  // =========================================

  describe("Items Count", () => {
    it("should count multiple products in same category", () => {
      // Arrange
      const matched: MatchedRow[] = [
        { type: "matched", id: "1", nazwa_produktu: "Mleko", kategoria_id: "cat-groceries", price: 5.0 },
        { type: "matched", id: "2", nazwa_produktu: "Chleb", kategoria_id: "cat-groceries", price: 3.0 },
        { type: "matched", id: "3", nazwa_produktu: "Masło", kategoria_id: "cat-groceries", price: 7.0 },
      ];

      // Act
      const summary = recalculateSummary(matched, [], mockCategories);

      // Assert
      expect(summary.by_category[0].items_count).toBe(3);
    });

    it("should count matched and unmatched products together", () => {
      // Arrange
      const matched: MatchedRow[] = [
        { type: "matched", id: "1", nazwa_produktu: "Mleko", kategoria_id: "cat-groceries", price: 5.0 },
      ];
      const unmatched: UnmatchedRow[] = [
        {
          type: "unmatched",
          id: "2",
          nazwa_produktu: "Chleb",
          price: 3.0,
          selected_category_id: "cat-groceries",
          created_product_id: "prod-123",
          isSaving: false,
          suggested_categories: [],
        },
        {
          type: "unmatched",
          id: "3",
          nazwa_produktu: "Masło",
          price: 7.0,
          selected_category_id: "cat-groceries",
          created_product_id: "prod-124",
          isSaving: false,
          suggested_categories: [],
        },
      ];

      // Act
      const summary = recalculateSummary(matched, unmatched, mockCategories);

      // Assert
      expect(summary.by_category[0].items_count).toBe(3);
    });
  });

  // =========================================
  // TESTY WARUNKÓW BRZEGOWYCH
  // =========================================

  describe("Edge Cases", () => {
    it("should handle matched products without kategoria_id", () => {
      // Arrange
      const matched: MatchedRow[] = [
        { type: "matched", id: "1", nazwa_produktu: "Nieznany", kategoria_id: undefined, price: 5.0 },
      ];

      // Act
      const summary = recalculateSummary(matched, [], mockCategories);

      // Assert
      expect(summary.by_category).toHaveLength(0);
      expect(summary.total).toBe(0);
    });

    it("should handle category not found in categories list", () => {
      // Arrange
      const matched: MatchedRow[] = [
        { type: "matched", id: "1", nazwa_produktu: "Test", kategoria_id: "non-existent-id", price: 5.0 },
      ];

      // Act
      const summary = recalculateSummary(matched, [], mockCategories);

      // Assert
      expect(summary.by_category[0].category).toEqual({
        id: "non-existent-id",
        nazwa_kategorii: "Nieznana",
      });
    });

    it("should handle products with zero price", () => {
      // Arrange
      const matched: MatchedRow[] = [
        { type: "matched", id: "1", nazwa_produktu: "Gratis", kategoria_id: "cat-groceries", price: 0 },
      ];

      // Act
      const summary = recalculateSummary(matched, [], mockCategories);

      // Assert
      expect(summary.by_category[0].total_expense).toBe(0);
      expect(summary.by_category[0].items_count).toBe(1);
    });

    it("should handle negative prices", () => {
      // Arrange
      const matched: MatchedRow[] = [
        { type: "matched", id: "1", nazwa_produktu: "Zwrot", kategoria_id: "cat-groceries", price: -5.0 },
        { type: "matched", id: "2", nazwa_produktu: "Normal", kategoria_id: "cat-groceries", price: 10.0 },
      ];

      // Act
      const summary = recalculateSummary(matched, [], mockCategories);

      // Assert
      expect(summary.by_category[0].total_expense).toBe(5.0);
    });

    it("should handle empty categories array", () => {
      // Arrange
      const matched: MatchedRow[] = [
        { type: "matched", id: "1", nazwa_produktu: "Test", kategoria_id: "cat-1", price: 5.0 },
      ];

      // Act
      const summary = recalculateSummary(matched, [], []);

      // Assert
      expect(summary.by_category[0].category).toEqual({
        id: "cat-1",
        nazwa_kategorii: "Nieznana",
      });
    });
  });
});

// =========================================
// TEST SUITE: mapApiResponseToViewModel
// =========================================

describe("mapApiResponseToViewModel", () => {
  beforeEach(() => {
    // Mock crypto.randomUUID dla konsystentnych testów
    let counter = 0;
    vi.stubGlobal("crypto", {
      randomUUID: () => `uuid-${++counter}`,
    });
  });

  // =========================================
  // TESTY MAPOWANIA MATCHED PRODUCTS
  // =========================================

  describe("Matched Products Mapping", () => {
    it("should map matched products with generated UUIDs", () => {
      // Arrange
      const apiResponse: ReceiptProcessingResponseDTO = {
        message: "Success",
        matched_products: [{ nazwa_produktu: "Mleko", kategoria_id: "cat-1", confidence: 0.95, price: 5.99 }],
        unmatched_products: [],
        summary: { by_category: [], total: 0 },
      };

      // Act
      const viewModel = mapApiResponseToViewModel(apiResponse);

      // Assert
      expect(viewModel.matched_rows).toHaveLength(1);
      expect(viewModel.matched_rows[0]).toEqual({
        type: "matched",
        id: "uuid-1",
        nazwa_produktu: "Mleko",
        kategoria_id: "cat-1",
        price: 5.99,
      });
    });

    it("should map multiple matched products", () => {
      // Arrange
      const apiResponse: ReceiptProcessingResponseDTO = {
        message: "Success",
        matched_products: [
          { nazwa_produktu: "Mleko", kategoria_id: "cat-1", confidence: 0.95, price: 5.99 },
          { nazwa_produktu: "Chleb", kategoria_id: "cat-2", confidence: 0.88, price: 3.5 },
        ],
        unmatched_products: [],
        summary: { by_category: [], total: 0 },
      };

      // Act
      const viewModel = mapApiResponseToViewModel(apiResponse);

      // Assert
      expect(viewModel.matched_rows).toHaveLength(2);
      expect(viewModel.matched_rows[0].id).toBe("uuid-1");
      expect(viewModel.matched_rows[1].id).toBe("uuid-2");
    });

    it("should handle matched products without kategoria_id", () => {
      // Arrange
      const apiResponse: ReceiptProcessingResponseDTO = {
        message: "Success",
        matched_products: [{ nazwa_produktu: "Test", kategoria_id: undefined, confidence: 0.5, price: 1.0 }],
        unmatched_products: [],
        summary: { by_category: [], total: 0 },
      };

      // Act
      const viewModel = mapApiResponseToViewModel(apiResponse);

      // Assert
      expect(viewModel.matched_rows[0].kategoria_id).toBeUndefined();
    });
  });

  // =========================================
  // TESTY MAPOWANIA UNMATCHED PRODUCTS
  // =========================================

  describe("Unmatched Products Mapping", () => {
    it("should map unmatched products with default state", () => {
      // Arrange
      const apiResponse: ReceiptProcessingResponseDTO = {
        message: "Success",
        matched_products: [],
        unmatched_products: [
          {
            nazwa_produktu: "Nowy produkt",
            price: 3.5,
            suggested_categories: [{ id: "cat-1", nazwa_kategorii: "Sugerowana" }],
          },
        ],
        summary: { by_category: [], total: 0 },
      };

      // Act
      const viewModel = mapApiResponseToViewModel(apiResponse);

      // Assert
      expect(viewModel.unmatched_rows).toHaveLength(1);
      expect(viewModel.unmatched_rows[0]).toEqual({
        type: "unmatched",
        id: "uuid-1",
        nazwa_produktu: "Nowy produkt",
        price: 3.5,
        suggested_categories: [{ id: "cat-1", nazwa_kategorii: "Sugerowana" }],
        selected_category_id: undefined,
        isSaving: false,
        created_product_id: undefined,
        error_message: undefined,
      });
    });

    it("should initialize all unmatched products with isSaving: false", () => {
      // Arrange
      const apiResponse: ReceiptProcessingResponseDTO = {
        message: "Success",
        matched_products: [],
        unmatched_products: [
          { nazwa_produktu: "A", price: 1.0, suggested_categories: [] },
          { nazwa_produktu: "B", price: 2.0, suggested_categories: [] },
        ],
        summary: { by_category: [], total: 0 },
      };

      // Act
      const viewModel = mapApiResponseToViewModel(apiResponse);

      // Assert
      viewModel.unmatched_rows.forEach((row) => {
        expect(row.isSaving).toBe(false);
        expect(row.created_product_id).toBeUndefined();
        expect(row.error_message).toBeUndefined();
      });
    });

    it("should preserve suggested_categories from API", () => {
      // Arrange
      const suggestedCats = [
        { id: "cat-1", nazwa_kategorii: "Kategoria 1" },
        { id: "cat-2", nazwa_kategorii: "Kategoria 2" },
      ];
      const apiResponse: ReceiptProcessingResponseDTO = {
        message: "Success",
        matched_products: [],
        unmatched_products: [{ nazwa_produktu: "Test", price: 5.0, suggested_categories: suggestedCats }],
        summary: { by_category: [], total: 0 },
      };

      // Act
      const viewModel = mapApiResponseToViewModel(apiResponse);

      // Assert
      expect(viewModel.unmatched_rows[0].suggested_categories).toEqual(suggestedCats);
    });
  });

  // =========================================
  // TESTY SUMMARY
  // =========================================

  describe("Summary Mapping", () => {
    it("should preserve summary from API response", () => {
      // Arrange
      const summary = {
        by_category: [
          {
            category: { id: "cat-1", nazwa_kategorii: "Test" },
            total_expense: 100.0,
            items_count: 5,
          },
        ],
        total: 100.0,
      };
      const apiResponse: ReceiptProcessingResponseDTO = {
        message: "Success",
        matched_products: [],
        unmatched_products: [],
        summary,
      };

      // Act
      const viewModel = mapApiResponseToViewModel(apiResponse);

      // Assert
      expect(viewModel.summary).toEqual(summary);
    });
  });

  // =========================================
  // TESTY WARUNKÓW BRZEGOWYCH
  // =========================================

  describe("Edge Cases", () => {
    it("should handle empty API response", () => {
      // Arrange
      const apiResponse: ReceiptProcessingResponseDTO = {
        message: "No products found",
        matched_products: [],
        unmatched_products: [],
        summary: { by_category: [], total: 0 },
      };

      // Act
      const viewModel = mapApiResponseToViewModel(apiResponse);

      // Assert
      expect(viewModel.matched_rows).toHaveLength(0);
      expect(viewModel.unmatched_rows).toHaveLength(0);
      expect(viewModel.summary.total).toBe(0);
    });

    it("should handle mixed matched and unmatched products", () => {
      // Arrange
      const apiResponse: ReceiptProcessingResponseDTO = {
        message: "Success",
        matched_products: [{ nazwa_produktu: "Matched", kategoria_id: "cat-1", confidence: 0.9, price: 5.0 }],
        unmatched_products: [{ nazwa_produktu: "Unmatched", price: 3.0, suggested_categories: [] }],
        summary: { by_category: [], total: 8.0 },
      };

      // Act
      const viewModel = mapApiResponseToViewModel(apiResponse);

      // Assert
      expect(viewModel.matched_rows).toHaveLength(1);
      expect(viewModel.unmatched_rows).toHaveLength(1);
      expect(viewModel.summary.total).toBe(8.0);
    });

    it("should generate unique IDs for all rows", () => {
      // Arrange
      const apiResponse: ReceiptProcessingResponseDTO = {
        message: "Success",
        matched_products: [
          { nazwa_produktu: "M1", kategoria_id: "cat-1", confidence: 0.9, price: 1.0 },
          { nazwa_produktu: "M2", kategoria_id: "cat-1", confidence: 0.9, price: 2.0 },
        ],
        unmatched_products: [
          { nazwa_produktu: "U1", price: 3.0, suggested_categories: [] },
          { nazwa_produktu: "U2", price: 4.0, suggested_categories: [] },
        ],
        summary: { by_category: [], total: 10.0 },
      };

      // Act
      const viewModel = mapApiResponseToViewModel(apiResponse);

      // Assert
      const allIds = [...viewModel.matched_rows.map((r) => r.id), ...viewModel.unmatched_rows.map((r) => r.id)];
      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toBe(4);
    });
  });
});
