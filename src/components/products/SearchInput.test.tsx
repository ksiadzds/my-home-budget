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
    const onSearchChange = vi.fn();
    render(<SearchInput onSearchChange={onSearchChange} />);
    
    expect(screen.getByPlaceholderText(/szukaj/i)).toBeInTheDocument();
  });

  it('wywołuje callback po wpisaniu tekstu z debounce', async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    
    render(<SearchInput onSearchChange={onSearchChange} />);
    
    const input = screen.getByPlaceholderText(/szukaj/i);
    await user.type(input, 'mleko');
    
    // Po czasie debounce callback powinien być wywołany
    await waitFor(
      () => {
        expect(onSearchChange).toHaveBeenCalledWith('mleko');
      },
      { timeout: 500 }
    );
  });

  it('resetuje debounce przy kolejnych wpisaniach', async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    
    render(<SearchInput onSearchChange={onSearchChange} />);
    
    const input = screen.getByPlaceholderText(/szukaj/i);
    
    // Wpisz "mleko" szybko
    await user.type(input, 'mleko');
    
    // Callback powinien być wywołany z pełnym tekstem po debounce
    await waitFor(
      () => {
        expect(onSearchChange).toHaveBeenCalledWith('mleko');
      },
      { timeout: 500 }
    );
  });

  it('czyści input po kliknięciu przycisku clear', async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    
    render(<SearchInput onSearchChange={onSearchChange} />);
    
    const input = screen.getByPlaceholderText(/szukaj/i) as HTMLInputElement;
    await user.type(input, 'test');
    
    // Znajdź przycisk clear
    const clearButton = screen.getByLabelText(/wyczyść wyszukiwanie/i);
    await user.click(clearButton);
    
    expect(input.value).toBe('');
    
    await waitFor(() => {
      expect(onSearchChange).toHaveBeenCalledWith('');
    });
  });
});

