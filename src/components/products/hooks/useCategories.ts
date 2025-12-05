// src/components/products/hooks/useCategories.ts

import { useState, useEffect } from "react";
import type { CategoryDTO, GetCategoriesResponse } from "@/types";

/**
 * Stan zwracany przez hook useCategories
 */
interface UseCategoriesReturn {
  /** Lista kategorii */
  categories: CategoryDTO[];
  /** Flaga ładowania */
  isLoading: boolean;
  /** Komunikat błędu (jeśli wystąpił) */
  error: string | null;
}

/**
 * Hook do pobierania listy kategorii z API
 *
 * @returns {UseCategoriesReturn} Stan kategorii
 *
 * @description
 * Pobiera listę kategorii raz przy montażu komponentu.
 * Zwraca dane, stan ładowania i błąd.
 *
 * @example
 * const { categories, isLoading, error } = useCategories();
 */
export function useCategories(): UseCategoriesReturn {
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/categories");

        if (!response.ok) {
          throw new Error("Błąd pobierania kategorii");
        }

        const result: GetCategoriesResponse = await response.json();
        setCategories(result.categories);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nieznany błąd");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, isLoading, error };
}
