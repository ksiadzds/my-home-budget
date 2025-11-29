// src/components/products/hooks/useDebouncedValue.ts

import { useState, useEffect } from 'react';

/**
 * Hook do debounce'owania wartości
 * 
 * @template T - Typ debounce'owanej wartości
 * @param {T} value - Wartość do zdebounce'owania
 * @param {number} delay - Opóźnienie w milisekundach
 * @returns {T} Zdebounce'owana wartość
 * 
 * @example
 * const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

