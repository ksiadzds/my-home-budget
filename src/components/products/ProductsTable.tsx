// src/components/products/ProductsTable.tsx

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategorySelect } from "@/components/dashboard/CategorySelect";
import { EmptyState } from "./EmptyState";
import { TableSkeleton } from "./TableSkeleton";
import type { ProductDTO, CategoryDTO } from "@/types";

/**
 * Propsy komponentu ProductsTable
 */
interface ProductsTableProps {
  /** Lista produktów do wyświetlenia */
  products: ProductDTO[];
  /** Lista kategorii dla inline CategorySelect */
  categories: CategoryDTO[];
  /** Flaga ładowania (renderuje Skeleton) */
  isLoading: boolean;
  /** Callback wywoływany po zmianie kategorii produktu */
  onCategoryChange: (productId: string, categoryId: string) => void;
  /** Callback wywoływany po kliknięciu przycisku Usuń */
  onDeleteClick: (productId: string) => void;
  /** Flaga wskazująca czy kategorie są dostępne (jeśli false, CategorySelect disabled) */
  categoriesAvailable: boolean;
  /** Wartość wyszukiwania (dla EmptyState) */
  searchTerm?: string;
}

/**
 * Formatuje datę ISO do czytelnego formatu
 * @param {string} isoDate - Data w formacie ISO
 * @returns {string} Sformatowana data (DD.MM.YYYY HH:MM)
 */
function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

/**
 * Komponent tabeli produktów
 *
 * @component
 * @description
 * Tabela produktów ze stylami Tailwind CSS.
 * Renderuje kolumny: Nazwa produktu, Kategoria (inline CategorySelect),
 * Data utworzenia, Data aktualizacji, Akcje (przycisk Usuń).
 *
 * Wyświetla Skeleton podczas ładowania.
 * Obsługuje puste stany wewnętrznie (EmptyState).
 *
 * @example
 * <ProductsTable
 *   products={products}
 *   categories={categories}
 *   isLoading={false}
 *   onCategoryChange={handleCategoryChange}
 *   onDeleteClick={handleDelete}
 *   categoriesAvailable={true}
 * />
 */
export function ProductsTable({
  products,
  categories,
  isLoading,
  onCategoryChange,
  onDeleteClick,
  categoriesAvailable,
  searchTerm,
}: ProductsTableProps) {
  // Stan pusty podczas ładowania
  if (isLoading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Nazwa produktu</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Kategoria</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Utworzono</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Zaktualizowano</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Akcje</th>
            </tr>
          </thead>
          <tbody>
            <TableSkeleton rows={5} />
          </tbody>
        </table>
      </div>
    );
  }

  // Stan pusty - brak produktów
  if (products.length === 0) {
    return (
      <EmptyState
        type={searchTerm ? "no_results" : "no_products"}
        onClearFilter={searchTerm ? () => window.location.reload() : undefined}
      />
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Nazwa produktu</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Kategoria</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Utworzono</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Zaktualizowano</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 w-[100px]">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr
                key={product.id}
                className="border-b border-slate-200 last:border-0 hover:bg-slate-50 transition-colors"
              >
                {/* Nazwa produktu */}
                <td className="px-4 py-3 text-sm">
                  <span className="font-medium text-slate-900">{product.nazwa_produktu}</span>
                </td>

                {/* Kategoria - inline select */}
                <td className="px-4 py-3 text-sm">
                  <div className="max-w-[200px]">
                    <CategorySelect
                      value={product.kategoria_id || undefined}
                      onChange={(categoryId) => onCategoryChange(product.id, categoryId)}
                      disabled={!categoriesAvailable}
                      categories={categories}
                    />
                  </div>
                </td>

                {/* Data utworzenia */}
                <td className="px-4 py-3 text-sm text-slate-600">{formatDate(product.created_at)}</td>

                {/* Data aktualizacji */}
                <td className="px-4 py-3 text-sm text-slate-600">{formatDate(product.updated_at)}</td>

                {/* Akcje - przycisk Usuń */}
                <td className="px-4 py-3 text-sm">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDeleteClick(product.id)}
                    aria-label={`Usuń produkt ${product.nazwa_produktu}`}
                  >
                    <Trash2 size={16} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
