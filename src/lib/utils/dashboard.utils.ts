// src/lib/utils/dashboard.utils.ts
import type {
  ReceiptProcessingResponseDTO,
  MatchedRow,
  UnmatchedRow,
  CategoryDTO,
  OcrResultViewModel,
} from '@/types';

/**
 * Mapuje odpowiedź API na ViewModel dla Dashboard
 * 
 * @function mapApiResponseToViewModel
 * @description
 * Transformuje ReceiptProcessingResponseDTO z backendu na OcrResultViewModel
 * używany w komponencie DashboardView. Generuje lokalne UUID dla każdego wiersza.
 * 
 * @param {ReceiptProcessingResponseDTO} apiResponse - Odpowiedź z POST /api/receipts/process
 * @returns {OcrResultViewModel} Model widoku gotowy do użycia w React
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/receipts/process', { method: 'POST', body: formData });
 * const data = await response.json();
 * const viewModel = mapApiResponseToViewModel(data);
 * setOcrResult(viewModel);
 * ```
 */
export function mapApiResponseToViewModel(
  apiResponse: ReceiptProcessingResponseDTO
): OcrResultViewModel {
  return {
    matched_rows: apiResponse.matched_products.map((p): MatchedRow => ({
      type: 'matched',
      id: crypto.randomUUID(),
      nazwa_produktu: p.nazwa_produktu,
      kategoria_id: p.kategoria_id,
      price: p.price,
    })),
    unmatched_rows: apiResponse.unmatched_products.map((p): UnmatchedRow => ({
      type: 'unmatched',
      id: crypto.randomUUID(),
      nazwa_produktu: p.nazwa_produktu,
      price: p.price,
      suggested_categories: p.suggested_categories,
      selected_category_id: undefined,
      isSaving: false,
      created_product_id: undefined,
      error_message: undefined,
    })),
    summary: apiResponse.summary,
  };
}

/**
 * Przelicza podsumowanie wydatków na podstawie aktualnych wierszy
 * 
 * @function recalculateSummary
 * @description
 * Agreguje koszty produktów według kategorii na podstawie:
 * 1. Wszystkich matched products (dopasowanych automatycznie)
 * 2. Unmatched products z wybraną kategorią i zapisanych do bazy (created_product_id)
 * 
 * **Reguły biznesowe:**
 * - Matched products są zawsze uwzględniane w podsumowaniu
 * - Unmatched products MUSZĄ mieć zarówno selected_category_id JAK I created_product_id
 * - Kwoty są zaokrąglane do 2 miejsc po przecinku (Math.round * 100 / 100)
 * - Kategorie są sortowane malejąco według total_expense
 * - Suma całkowita jest sumą wszystkich kategorii
 * 
 * @param {MatchedRow[]} matchedRows - Lista produktów dopasowanych
 * @param {UnmatchedRow[]} unmatchedRows - Lista produktów niedopasowanych
 * @param {CategoryDTO[]} categories - Pełna lista kategorii (do lookup nazw)
 * @returns {ReceiptProcessingResponseDTO['summary']} Przeliczone podsumowanie
 * 
 * @example
 * ```typescript
 * const summary = recalculateSummary(
 *   ocrResult.matched_rows,
 *   ocrResult.unmatched_rows,
 *   allCategories
 * );
 * setOcrResult({ ...ocrResult, summary });
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

  // Dodaj unmatched products z wybraną kategorią I zapisane do bazy
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

