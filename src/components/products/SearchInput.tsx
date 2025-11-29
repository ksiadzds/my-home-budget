// src/components/products/SearchInput.tsx

import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDebouncedValue } from './hooks';

/**
 * Propsy komponentu SearchInput
 */
interface SearchInputProps {
  /** Wartość domyślna inputa */
  defaultValue?: string;
  /** Callback wywoływany po zdebounce'owaniu (300ms) */
  onSearchChange: (searchTerm: string) => void;
  /** Placeholder tekstu */
  placeholder?: string;
  /** Flaga wyłączająca input (np. podczas ładowania) */
  disabled?: boolean;
}

/**
 * Komponent input do wyszukiwania produktów po nazwie
 * 
 * @component
 * @description
 * Input tekstowy z wyszukiwaniem po nazwie produktu.
 * Implementuje debounce 300ms, aby zminimalizować liczbę żądań do API.
 * Wyświetla ikonę lupy i przycisk "Wyczyść" (X) po wprowadzeniu tekstu.
 * Dostępny dla screen readerów (aria-label).
 * 
 * @example
 * <SearchInput
 *   onSearchChange={(term) => setFilter(term)}
 *   placeholder="Wyszukaj produkt po nazwie..."
 * />
 */
export function SearchInput({
  defaultValue = '',
  onSearchChange,
  placeholder = 'Wyszukaj produkt po nazwie...',
  disabled = false,
}: SearchInputProps) {
  const [value, setValue] = useState(defaultValue);
  const debouncedValue = useDebouncedValue(value, 300);

  // Emituj zdebounce'owaną wartość do rodzica
  useEffect(() => {
    const trimmedValue = debouncedValue.trim();
    onSearchChange(trimmedValue);
  }, [debouncedValue, onSearchChange]);

  const handleClear = () => {
    setValue('');
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={18}
          aria-hidden="true"
        />
        <Input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          aria-label="Wyszukaj produkt po nazwie"
          className="pl-10 pr-10"
        />
        {value && !disabled && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            aria-label="Wyczyść wyszukiwanie"
          >
            <X size={16} />
          </Button>
        )}
      </div>
    </div>
  );
}

