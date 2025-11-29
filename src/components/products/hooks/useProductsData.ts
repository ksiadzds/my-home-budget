// src/components/products/hooks/useProductsData.ts

import { useState, useEffect } from 'react';
import type { ListProductsResponseDTO, ProductSearchParams } from '@/types';

/**
 * Stan zwracany przez hook useProductsData
 */
interface UseProductsDataReturn {
  /** Dane produktów i paginacja */
  data: ListProductsResponseDTO | null;
  /** Flaga ładowania */
  isLoading: boolean;
  /** Komunikat błędu (jeśli wystąpił) */
  error: string | null;
}

/**
 * Buduje query string z parametrów wyszukiwania
 * 
 * @param {ProductSearchParams} params - Parametry wyszukiwania
 * @returns {string} Query string
 */
function buildQueryString(params: ProductSearchParams): string {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });

  if (params.filter) {
    searchParams.append('filter', params.filter);
  }

  if (params.sort) {
    searchParams.append('sort', params.sort);
  }

  return searchParams.toString();
}

/**
 * Hook do pobierania listy produktów z API
 * 
 * @param {ProductSearchParams} params - Parametry wyszukiwania
 * @returns {UseProductsDataReturn} Stan produktów
 * 
 * @description
 * Pobiera listę produktów z API na podstawie parametrów zapytania.
 * Automatycznie odświeża dane przy zmianie parametrów.
 * Zwraca dane, stan ładowania i błąd.
 * 
 * @example
 * const { data, isLoading, error } = useProductsData({
 *   page: 1,
 *   limit: 20,
 *   sort: 'nazwa_produktu:asc'
 * });
 */
export function useProductsData(params: ProductSearchParams): UseProductsDataReturn {
  const [data, setData] = useState<ListProductsResponseDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const queryString = buildQueryString(params);
        const response = await fetch(`/api/products?${queryString}`);

        if (!response.ok) {
          throw new Error('Błąd pobierania produktów');
        }

        const result: ListProductsResponseDTO = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Nieznany błąd');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [params.page, params.limit, params.filter, params.sort]);

  return { data, isLoading, error };
}

