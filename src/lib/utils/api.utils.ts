// src/lib/utils/api.utils.ts

import type { ProductSearchParams } from '@/types';

/**
 * Buduje query string z parametrów wyszukiwania produktów
 * 
 * @param {ProductSearchParams} params - Parametry wyszukiwania
 * @returns {string} Query string gotowy do użycia w URL
 * 
 * @description
 * Tworzy URL query string z parametrów page, limit, filter i sort.
 * Filter jest przekazywany jako JSON string.
 * 
 * @example
 * ```ts
 * const qs = buildQueryString({
 *   page: 2,
 *   limit: 20,
 *   filter: JSON.stringify({ product_name: 'mleko' }),
 *   sort: 'nazwa_produktu:asc'
 * });
 * // => "page=2&limit=20&filter=%7B%22product_name%22%3A%22mleko%22%7D&sort=nazwa_produktu%3Aasc"
 * ```
 */
export function buildQueryString(params: ProductSearchParams): string {
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




