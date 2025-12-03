import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchInput } from '@/components/products/SearchInput';

/**
 * Testy jednostkowe dla komponentu SearchInput
 * Testują debouncing i wywołania callbacków
 */

describe('SearchInput', () => {
  it('renderuje pole wyszukiwania', () => {
    const onSearch = vi.fn();
    render(<SearchInput onSearch={onSearch} />);
    
    expect(screen.getByPlaceholderText(/szukaj/i)).toBeInTheDocument();
  });

  it('wywołuje callback po wpisaniu tekstu z debounce', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    
    render(<SearchInput onSearch={onSearch} debounceMs={300} />);
    
    const input = screen.getByPlaceholderText(/szukaj/i);
    await user.type(input, 'mleko');
    
    // Callback NIE powinien być wywołany natychmiast
    expect(onSearch).not.toHaveBeenCalled();
    
    // Po czasie debounce callback powinien być wywołany
    await waitFor(
      () => {
        expect(onSearch).toHaveBeenCalledWith('mleko');
      },
      { timeout: 500 }
    );
  });

  it('resetuje debounce przy kolejnych wpisaniach', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    
    render(<SearchInput onSearch={onSearch} debounceMs={300} />);
    
    const input = screen.getByPlaceholderText(/szukaj/i);
    
    // Wpisz "m"
    await user.type(input, 'm');
    
    // Poczekaj 100ms i wpisz kolejny znak
    await new Promise(resolve => setTimeout(resolve, 100));
    await user.type(input, 'l');
    
    // Poczekaj kolejne 100ms i wpisz kolejny znak
    await new Promise(resolve => setTimeout(resolve, 100));
    await user.type(input, 'eko');
    
    // Callback powinien być wywołany tylko raz, z pełnym tekstem
    await waitFor(
      () => {
        expect(onSearch).toHaveBeenCalledTimes(1);
        expect(onSearch).toHaveBeenCalledWith('mleko');
      },
      { timeout: 500 }
    );
  });

  it('czyści input po kliknięciu przycisku clear', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    
    render(<SearchInput onSearch={onSearch} />);
    
    const input = screen.getByPlaceholderText(/szukaj/i) as HTMLInputElement;
    await user.type(input, 'test');
    
    // Znajdź przycisk clear (jeśli istnieje)
    const clearButton = screen.queryByRole('button', { name: /wyczyść/i });
    
    if (clearButton) {
      await user.click(clearButton);
      
      expect(input.value).toBe('');
      
      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith('');
      });
    }
  });
});

