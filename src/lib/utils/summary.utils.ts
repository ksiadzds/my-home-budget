// src/lib/utils/summary.utils.ts

import type { 
  MatchedRow, 
  UnmatchedRow, 
  CategoryDTO, 
  ReceiptProcessingResponseDTO 
} from '@/types';

/**
 * Przelicza podsumowanie wydatków na podstawie wierszy matched i unmatched
 * 
 * @param {MatchedRow[]} matchedRows - Wiersze produktów automatycznie dopasowanych
 * @param {UnmatchedRow[]} unmatchedRows - Wiersze produktów wymagających ręcznej kategoryzacji
 * @param {CategoryDTO[]} categories - Lista wszystkich dostępnych kategorii
 * @returns {ReceiptProcessingResponseDTO['summary']} Przeliczone podsumowanie
 * 
 * @description
 * Logika kalkulacji:
 * 1. Dodaje wszystkie matched products (które mają kategoria_id)
 * 2. Dodaje unmatched products, które mają:
 *    - selected_category_id (użytkownik wybrał kategorię)
 *    - created_product_id (produkt został zapisany w bazie)
 * 3. Grupuje wydatki według kategorii
 * 4. Sortuje malejąco według total_expense
 * 5. Zaokrągla kwoty do 2 miejsc po przecinku
 * 
 * @example
 * ```ts
 * const summary = recalculateSummary(
 *   matchedRows,
 *   unmatchedRows,
 *   categories
 * );
 * console.log(summary.total); // 123.45
 * console.log(summary.by_category[0].total_expense); // 50.99
 * ```
 */
export function recalculateSummary(
  matchedRows: MatchedRow[],
  unmatchedRows: UnmatchedRow[],
  categories: CategoryDTO[]
): ReceiptProcessingResponseDTO['summary'] {
  // Mapa: kategoria_id -> { total, count }
  const categoryMap = new Map<string, { total: number; count: number }>();

  // Dodaj matched products
  for (const row of matchedRows) {
    if (row.kategoria_id) {
      const current = categoryMap.get(row.kategoria_id) || { total: 0, count: 0 };
      categoryMap.set(row.kategoria_id, {
        total: current.total + row.price,
        count: current.count + 1,
      });
    }
  }

  // Dodaj unmatched products z wybraną kategorią I zapisanym produktem
  for (const row of unmatchedRows) {
    if (row.selected_category_id && row.created_product_id) {
      const current = categoryMap.get(row.selected_category_id) || { total: 0, count: 0 };
      categoryMap.set(row.selected_category_id, {
        total: current.total + row.price,
        count: current.count + 1,
      });
    }
  }

  // Generuj podsumowanie wg kategorii
  const summaryItems = Array.from(categoryMap.entries()).map(([categoryId, stats]) => {
    const category = categories.find(c => c.id === categoryId);
    return {
      category: category || { id: categoryId, nazwa_kategorii: 'Nieznana' },
      total_expense: Math.round(stats.total * 100) / 100,
      items_count: stats.count,
    };
  });

  // Sortuj według największych wydatków
  summaryItems.sort((a, b) => b.total_expense - a.total_expense);

  // Oblicz sumę całkowitą
  const total = summaryItems.reduce((sum, item) => sum + item.total_expense, 0);

  return {
    by_category: summaryItems,
    total: Math.round(total * 100) / 100,
  };
}




