// src/components/dashboard/VerificationList.tsx
import type { VerificationRow, CategoryDTO } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CategorySelect } from './CategorySelect';

/**
 * Props dla komponentu VerificationList
 */
interface VerificationListProps {
  /**
   * Lista wierszy do weryfikacji (matched + unmatched)
   * Discriminated union: MatchedRow | UnmatchedRow
   */
  rows: VerificationRow[];
  
  /**
   * Pełna lista kategorii do wyświetlenia w CategorySelect
   */
  categories: CategoryDTO[];
  
  /**
   * Callback wywoływany przy zmianie kategorii dla wiersza unmatched
   * @param rowId - Lokalne UUID wiersza
   * @param categoryId - UUID wybranej kategorii
   */
  onCategoryChange: (rowId: string, categoryId: string) => void;
}

/**
 * VerificationList - lista wyników OCR do weryfikacji i zapisu
 * 
 * @component
 * @description
 * Prezentuje wyniki przetwarzania OCR w formie listy wierszy.
 * Rozróżnia produkty dopasowane (matched) od niedopasowanych (unmatched).
 * 
 * ## Typy wierszy:
 * 
 * ### Matched (dopasowane automatycznie):
 * - Zielone tło (bg-green-50)
 * - Ikona ✓ (checkmark)
 * - Read-only (brak edycji)
 * - Pokazuje przypisaną kategorię
 * 
 * ### Unmatched (wymagają ręcznego przypisania):
 * - Pomarańczowe tło (bg-orange-50)
 * - Ikona ⚠️ (warning)
 * - Edytowalny CategorySelect
 * - Auto-zapis przy wyborze kategorii
 * - Status: "Zapisywanie..." → "Zapisano pomyślnie" / błąd
 * 
 * ## MVP limitations:
 * - Prosta lista zamiast TanStack Table
 * - Brak tooltipów
 * - Brak sortowania/filtrowania
 * - Brak bulk actions
 * 
 * ## Dostępność (a11y):
 * - Kolory + ikony (nie tylko kolor)
 * - Tekstowe statusy zapisu
 * - Screen reader friendly
 * 
 * @example
 * ```tsx
 * <VerificationList
 *   rows={[...matched, ...unmatched]}
 *   categories={allCategories}
 *   onCategoryChange={(rowId, catId) => saveProduct(rowId, catId)}
 * />
 * ```
 * 
 * @param {VerificationListProps} props
 * @returns {JSX.Element}
 * 
 * @version 1.0.0 MVP
 * @since 2025-01-21
 */
export function VerificationList({ rows, categories, onCategoryChange }: VerificationListProps) {
  if (rows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wyniki rozpoznawania</CardTitle>
          <CardDescription>
            Nie znaleziono żadnych produktów na paragonie
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wyniki rozpoznawania</CardTitle>
        <CardDescription>
          Sprawdź rozpoznane produkty i przypisz kategorie do niedopasowanych pozycji
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {rows.map((row) => {
            if (row.type === 'matched') {
              // Wiersz dopasowany - read-only, zielone tło
              return (
                <div
                  key={row.id}
                  className="p-4 bg-green-50 border border-green-200 rounded-lg"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <svg
                          className="w-5 h-5 text-green-600 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="font-medium text-green-900 truncate">
                          {row.nazwa_produktu}
                        </span>
                      </div>
                      <p className="text-sm text-green-700">
                        Dopasowano automatycznie
                        {row.kategoria_id && (
                          <span className="ml-2">
                            • Kategoria: {categories.find(c => c.id === row.kategoria_id)?.nazwa_kategorii || 'Nieznana'}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-900">
                        {row.price.toFixed(2)} zł
                      </p>
                    </div>
                  </div>
                </div>
              );
            }

            // Wiersz niedopasowany - edytowalny, pomarańczowe tło
            return (
              <div
                key={row.id}
                className="p-4 bg-orange-50 border border-orange-200 rounded-lg"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <svg
                          className="w-5 h-5 text-orange-600 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="font-medium text-orange-900 truncate">
                          {row.nazwa_produktu}
                        </span>
                      </div>
                      <p className="text-sm text-orange-700">
                        Wymagane przypisanie kategorii
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-orange-900">
                        {row.price.toFixed(2)} zł
                      </p>
                    </div>
                  </div>

                  {/* Select kategorii */}
                  <div className="flex flex-col gap-2">
                    <CategorySelect
                      value={row.selected_category_id}
                      onChange={(categoryId) => onCategoryChange(row.id, categoryId)}
                      disabled={row.isSaving}
                      categories={row.suggested_categories.length > 0 ? row.suggested_categories : categories}
                    />

                    {/* Status zapisu */}
                    {row.isSaving && (
                      <p className="text-sm text-orange-700 flex items-center gap-2">
                        <svg
                          className="w-4 h-4 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Zapisywanie...
                      </p>
                    )}

                    {row.created_product_id && !row.isSaving && !row.error_message && (
                      <p className="text-sm text-green-700 flex items-center gap-2">
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Zapisano pomyślnie
                      </p>
                    )}

                    {row.error_message && (
                      <p className="text-sm text-red-700 flex items-center gap-2">
                        <svg
                          className="w-4 h-4 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {row.error_message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

