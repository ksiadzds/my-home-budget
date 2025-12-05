// __tests__/unit/utils/summary.utils.test.ts

import { describe, it, expect } from "vitest";
import { recalculateSummary } from "@/lib/utils/summary.utils";
import type { MatchedRow, UnmatchedRow, CategoryDTO } from "@/types";

/**
 * Testy jednostkowe dla funkcji przeliczającej podsumowanie wydatków
 *
 * @description
 * Testuje recalculateSummary() która jest używana w DashboardView
 * do kalkulacji wydatków według kategorii na podstawie wierszy OCR.
 */

describe("summary.utils", () => {
  describe("recalculateSummary", () => {
    const mockCategories: CategoryDTO[] = [
      { id: "cat-1", nazwa_kategorii: "Zakupy spożywcze" },
      { id: "cat-2", nazwa_kategorii: "Napoje" },
      { id: "cat-3", nazwa_kategorii: "Słodycze i przekąski" },
    ];

    it("zwraca puste podsumowanie gdy brak produktów", () => {
      const result = recalculateSummary([], [], mockCategories);

      expect(result.by_category).toEqual([]);
      expect(result.total).toBe(0);
    });

    it("przelicza podsumowanie tylko z matched products", () => {
      const matchedRows: MatchedRow[] = [
        {
          type: "matched",
          id: "row-1",
          nazwa_produktu: "Mleko",
          kategoria_id: "cat-1",
          price: 5.99,
        },
        {
          type: "matched",
          id: "row-2",
          nazwa_produktu: "Chleb",
          kategoria_id: "cat-1",
          price: 4.5,
        },
        {
          type: "matched",
          id: "row-3",
          nazwa_produktu: "Sok",
          kategoria_id: "cat-2",
          price: 7.99,
        },
      ];

      const result = recalculateSummary(matchedRows, [], mockCategories);

      expect(result.by_category).toHaveLength(2);
      expect(result.by_category[0]).toEqual({
        category: mockCategories[0],
        total_expense: 10.49,
        items_count: 2,
      });
      expect(result.by_category[1]).toEqual({
        category: mockCategories[1],
        total_expense: 7.99,
        items_count: 1,
      });
      expect(result.total).toBe(18.48);
    });

    it("ignoruje matched products bez kategoria_id", () => {
      const matchedRows: MatchedRow[] = [
        {
          type: "matched",
          id: "row-1",
          nazwa_produktu: "Produkt bez kategorii",
          kategoria_id: undefined,
          price: 10.0,
        },
        {
          type: "matched",
          id: "row-2",
          nazwa_produktu: "Produkt z kategorią",
          kategoria_id: "cat-1",
          price: 5.0,
        },
      ];

      const result = recalculateSummary(matchedRows, [], mockCategories);

      expect(result.by_category).toHaveLength(1);
      expect(result.total).toBe(5.0);
    });

    it("przelicza tylko unmatched products z zapisanym produktem", () => {
      const unmatchedRows: UnmatchedRow[] = [
        {
          type: "unmatched",
          id: "row-1",
          nazwa_produktu: "Nowy produkt",
          price: 12.5,
          suggested_categories: mockCategories,
          selected_category_id: "cat-1",
          created_product_id: "prod-123", // ZAPISANY
          isSaving: false,
        },
        {
          type: "unmatched",
          id: "row-2",
          nazwa_produktu: "Produkt niezapisany",
          price: 8.0,
          suggested_categories: mockCategories,
          selected_category_id: "cat-2",
          created_product_id: undefined, // NIE ZAPISANY - ignore
          isSaving: false,
        },
      ];

      const result = recalculateSummary([], unmatchedRows, mockCategories);

      expect(result.by_category).toHaveLength(1);
      expect(result.by_category[0]).toEqual({
        category: mockCategories[0],
        total_expense: 12.5,
        items_count: 1,
      });
      expect(result.total).toBe(12.5);
    });

    it("ignoruje unmatched products bez selected_category_id", () => {
      const unmatchedRows: UnmatchedRow[] = [
        {
          type: "unmatched",
          id: "row-1",
          nazwa_produktu: "Produkt bez kategorii",
          price: 10.0,
          suggested_categories: mockCategories,
          selected_category_id: undefined,
          created_product_id: "prod-123",
          isSaving: false,
        },
      ];

      const result = recalculateSummary([], unmatchedRows, mockCategories);

      expect(result.by_category).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it("łączy matched i unmatched products w jednej kategorii", () => {
      const matchedRows: MatchedRow[] = [
        {
          type: "matched",
          id: "row-1",
          nazwa_produktu: "Mleko",
          kategoria_id: "cat-1",
          price: 5.0,
        },
      ];

      const unmatchedRows: UnmatchedRow[] = [
        {
          type: "unmatched",
          id: "row-2",
          nazwa_produktu: "Chleb",
          price: 3.0,
          suggested_categories: mockCategories,
          selected_category_id: "cat-1",
          created_product_id: "prod-123",
          isSaving: false,
        },
      ];

      const result = recalculateSummary(matchedRows, unmatchedRows, mockCategories);

      expect(result.by_category).toHaveLength(1);
      expect(result.by_category[0]).toEqual({
        category: mockCategories[0],
        total_expense: 8.0,
        items_count: 2,
      });
      expect(result.total).toBe(8.0);
    });

    it("sortuje kategorie malejąco według total_expense", () => {
      const matchedRows: MatchedRow[] = [
        {
          type: "matched",
          id: "row-1",
          nazwa_produktu: "Produkt A",
          kategoria_id: "cat-1",
          price: 5.0,
        },
        {
          type: "matched",
          id: "row-2",
          nazwa_produktu: "Produkt B",
          kategoria_id: "cat-2",
          price: 15.0,
        },
        {
          type: "matched",
          id: "row-3",
          nazwa_produktu: "Produkt C",
          kategoria_id: "cat-3",
          price: 10.0,
        },
      ];

      const result = recalculateSummary(matchedRows, [], mockCategories);

      expect(result.by_category).toHaveLength(3);
      expect(result.by_category[0].total_expense).toBe(15.0); // cat-2 (największy)
      expect(result.by_category[1].total_expense).toBe(10.0); // cat-3
      expect(result.by_category[2].total_expense).toBe(5.0); // cat-1 (najmniejszy)
    });

    it("zaokrągla kwoty do 2 miejsc po przecinku", () => {
      const matchedRows: MatchedRow[] = [
        {
          type: "matched",
          id: "row-1",
          nazwa_produktu: "Produkt",
          kategoria_id: "cat-1",
          price: 5.555, // Powinno zaokrąglić do 5.56
        },
        {
          type: "matched",
          id: "row-2",
          nazwa_produktu: "Produkt",
          kategoria_id: "cat-1",
          price: 3.333, // Powinno zaokrąglić do 3.33
        },
      ];

      const result = recalculateSummary(matchedRows, [], mockCategories);

      expect(result.by_category[0].total_expense).toBe(8.89); // 5.555 + 3.333 = 8.888 -> 8.89
      expect(result.total).toBe(8.89);
    });

    it("poprawnie sumuje wiele produktów w tej samej kategorii", () => {
      const matchedRows: MatchedRow[] = [
        {
          type: "matched",
          id: "row-1",
          nazwa_produktu: "Produkt 1",
          kategoria_id: "cat-1",
          price: 1.11,
        },
        {
          type: "matched",
          id: "row-2",
          nazwa_produktu: "Produkt 2",
          kategoria_id: "cat-1",
          price: 2.22,
        },
        {
          type: "matched",
          id: "row-3",
          nazwa_produktu: "Produkt 3",
          kategoria_id: "cat-1",
          price: 3.33,
        },
      ];

      const result = recalculateSummary(matchedRows, [], mockCategories);

      expect(result.by_category[0].items_count).toBe(3);
      expect(result.by_category[0].total_expense).toBe(6.66); // 1.11 + 2.22 + 3.33
    });

    it('używa fallback "Nieznana" dla kategorii nieznalezionej', () => {
      const matchedRows: MatchedRow[] = [
        {
          type: "matched",
          id: "row-1",
          nazwa_produktu: "Produkt",
          kategoria_id: "nonexistent-category-id",
          price: 10.0,
        },
      ];

      const result = recalculateSummary(matchedRows, [], mockCategories);

      expect(result.by_category[0].category).toEqual({
        id: "nonexistent-category-id",
        nazwa_kategorii: "Nieznana",
      });
    });

    it("obsługuje scenariusz mieszany z wieloma kategoriami", () => {
      const matchedRows: MatchedRow[] = [
        {
          type: "matched",
          id: "row-1",
          nazwa_produktu: "Mleko",
          kategoria_id: "cat-1",
          price: 5.99,
        },
        {
          type: "matched",
          id: "row-2",
          nazwa_produktu: "Sok",
          kategoria_id: "cat-2",
          price: 8.5,
        },
      ];

      const unmatchedRows: UnmatchedRow[] = [
        {
          type: "unmatched",
          id: "row-3",
          nazwa_produktu: "Chleb",
          price: 4.5,
          suggested_categories: mockCategories,
          selected_category_id: "cat-1",
          created_product_id: "prod-1",
          isSaving: false,
        },
        {
          type: "unmatched",
          id: "row-4",
          nazwa_produktu: "Cukierki",
          price: 6.0,
          suggested_categories: mockCategories,
          selected_category_id: "cat-3",
          created_product_id: "prod-2",
          isSaving: false,
        },
        {
          type: "unmatched",
          id: "row-5",
          nazwa_produktu: "Niezapisany",
          price: 100.0,
          suggested_categories: mockCategories,
          selected_category_id: "cat-1",
          created_product_id: undefined, // Ignorowane
          isSaving: false,
        },
      ];

      const result = recalculateSummary(matchedRows, unmatchedRows, mockCategories);

      expect(result.by_category).toHaveLength(3);

      // cat-1: 5.99 + 4.50 = 10.49 (2 items)
      const cat1 = result.by_category.find((c) => c.category.id === "cat-1");
      expect(cat1?.total_expense).toBe(10.49);
      expect(cat1?.items_count).toBe(2);

      // cat-2: 8.50 (1 item)
      const cat2 = result.by_category.find((c) => c.category.id === "cat-2");
      expect(cat2?.total_expense).toBe(8.5);
      expect(cat2?.items_count).toBe(1);

      // cat-3: 6.00 (1 item)
      const cat3 = result.by_category.find((c) => c.category.id === "cat-3");
      expect(cat3?.total_expense).toBe(6.0);
      expect(cat3?.items_count).toBe(1);

      // Total: 10.49 + 8.50 + 6.00 = 24.99
      expect(result.total).toBe(24.99);
    });

    it("obsługuje ceny z wieloma miejscami po przecinku", () => {
      const matchedRows: MatchedRow[] = [
        {
          type: "matched",
          id: "row-1",
          nazwa_produktu: "Produkt",
          kategoria_id: "cat-1",
          price: 1.999999,
        },
      ];

      const result = recalculateSummary(matchedRows, [], mockCategories);

      expect(result.total).toBe(2.0); // Zaokrąglone do 2.00
    });

    it("obsługuje zerowe ceny", () => {
      const matchedRows: MatchedRow[] = [
        {
          type: "matched",
          id: "row-1",
          nazwa_produktu: "Darmowy produkt",
          kategoria_id: "cat-1",
          price: 0,
        },
      ];

      const result = recalculateSummary(matchedRows, [], mockCategories);

      expect(result.by_category[0].total_expense).toBe(0);
      expect(result.total).toBe(0);
    });
  });
});
