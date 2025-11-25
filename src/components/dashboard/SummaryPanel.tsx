// src/components/dashboard/SummaryPanel.tsx
import type { ReceiptProcessingResponseDTO } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

/**
 * Props dla komponentu SummaryPanel
 */
interface SummaryPanelProps {
  /**
   * Obiekt podsumowania z odpowiedzi OCR
   * Zawiera agregację wg kategorii i sumę całkowitą
   */
  summary: ReceiptProcessingResponseDTO['summary'];
}

/**
 * SummaryPanel - prezentuje podsumowanie wydatków wg kategorii
 * 
 * @component
 * @description
 * Wyświetla agregację kosztów z paragonu pogrupowaną według kategorii
 * oraz sumę całkowitą wszystkich wydatków.
 * 
 * ## Przeliczanie na bieżąco:
 * Podsumowanie jest aktualizowane automatycznie po wyborze kategorii
 * przez użytkownika. DashboardView przelicza je na podstawie:
 * - Matched products (automatycznie dopasowane)
 * - Unmatched products z wybraną kategorią (zapisane pomyślnie)
 * 
 * ## Struktura danych:
 * ```typescript
 * summary: {
 *   by_category: [
 *     { category: CategoryDTO, total_expense: number, items_count: number }
 *   ],
 *   total: number
 * }
 * ```
 * 
 * ## Wyświetlanie:
 * - Lista kategorii z sumą i ilością produktów
 * - Suma całkowita na czarnym tle (wyróżniona)
 * 
 * @example
 * ```tsx
 * <SummaryPanel summary={ocrResult.summary} />
 * ```
 * 
 * @param {SummaryPanelProps} props
 * @returns {JSX.Element}
 * 
 * @version 1.1.0
 * @since 2025-01-21
 */
export function SummaryPanel({ summary }: SummaryPanelProps) {
  if (!summary || summary.by_category.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Podsumowanie wydatków</CardTitle>
          <CardDescription>
            Brak danych do wyświetlenia
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Podsumowanie wydatków</CardTitle>
        <CardDescription>
          Agregacja kosztów według kategorii
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Lista kategorii */}
          <div className="space-y-2">
            {summary.by_category.map((item) => (
              <div
                key={item.category.id}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
              >
                <div className="flex-1">
                  <p className="font-medium text-slate-900">
                    {item.category.nazwa_kategorii}
                  </p>
                  <p className="text-sm text-slate-600">
                    {item.items_count} {item.items_count === 1 ? 'produkt' : 'produkty'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-slate-900">
                    {item.total_expense.toFixed(2)} zł
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Suma całkowita */}
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between p-4 bg-slate-900 text-white rounded-lg">
              <p className="text-lg font-semibold">Suma całkowita</p>
              <p className="text-2xl font-bold">{summary.total.toFixed(2)} zł</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

