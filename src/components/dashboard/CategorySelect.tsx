// src/components/dashboard/CategorySelect.tsx
import type { CategoryDTO } from "@/types";

/**
 * Props dla komponentu CategorySelect
 */
interface CategorySelectProps {
  /**
   * UUID wybranej kategorii
   * @default undefined (pusty select - placeholder)
   */
  value?: string;

  /**
   * Callback wywoływany przy zmianie kategorii
   * @param categoryId - UUID wybranej kategorii
   */
  onChange: (categoryId: string) => void;

  /**
   * Flaga wyłączająca select (np. podczas zapisywania)
   * @default false
   */
  disabled?: boolean;

  /**
   * Lista kategorii do wyświetlenia w dropdownie
   */
  categories: CategoryDTO[];
}

/**
 * CategorySelect - dropdown do wyboru kategorii produktu
 *
 * @component
 * @description
 * Prosty select z listą kategorii. W wersji MVP używa natywnego elementu <select>
 * zamiast custom dropdown z Shadcn/ui.
 *
 * ## Dostępność (a11y):
 * - Aria-label dla screen readerów
 * - Focus states (ring-2)
 * - Disabled state z odpowiednim cursor
 *
 * ## Użycie:
 * - W VerificationList dla wierszy unmatched
 * - Auto-trigger zapisu po wyborze kategorii
 *
 * @example
 * ```tsx
 * <CategorySelect
 *   value={row.selected_category_id}
 *   onChange={(categoryId) => handleSave(categoryId)}
 *   disabled={row.isSaving}
 *   categories={allCategories}
 * />
 * ```
 *
 * @param {CategorySelectProps} props
 * @returns {JSX.Element}
 *
 * @version 1.0.0 MVP
 * @since 2025-01-21
 */
export function CategorySelect({ value, onChange, disabled, categories }: CategorySelectProps) {
  /**
   * Obsługa zmiany wartości selecta
   *
   * @function handleChange
   * @param {React.ChangeEvent<HTMLSelectElement>} event
   * @returns {void}
   */
  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    onChange(event.target.value);
  }

  return (
    <select
      value={value || ""}
      onChange={handleChange}
      disabled={disabled}
      className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
      aria-label="Wybierz kategorię produktu"
    >
      <option value="" disabled>
        Wybierz kategorię...
      </option>
      {categories.map((category) => (
        <option key={category.id} value={category.id}>
          {category.nazwa_kategorii}
        </option>
      ))}
    </select>
  );
}
