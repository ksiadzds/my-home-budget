// __tests__/unit/components/CategorySelect.test.tsx

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategorySelect } from '@/components/dashboard/CategorySelect';
import type { CategoryDTO } from '@/types';

/**
 * Testy jednostkowe dla komponentu CategorySelect
 * 
 * @description
 * Testuje komponent dropdown do wyboru kategorii produktu używany w Dashboard.
 * Sprawdza renderowanie, interakcje użytkownika i disabled state.
 */

describe('CategorySelect', () => {
  const mockCategories: CategoryDTO[] = [
    { id: 'cat-1', nazwa_kategorii: 'Zakupy spożywcze' },
    { id: 'cat-2', nazwa_kategorii: 'Napoje' },
    { id: 'cat-3', nazwa_kategorii: 'Słodycze i przekąski' },
  ];

  describe('renderowanie', () => {
    it('renderuje select z placeholder', () => {
      const mockOnChange = vi.fn();
      render(
        <CategorySelect
          categories={mockCategories}
          onChange={mockOnChange}
        />
      );

      const select = screen.getByLabelText('Wybierz kategorię produktu');
      expect(select).toBeInTheDocument();
      expect(select).toHaveValue('');
    });

    it('renderuje wszystkie kategorie jako opcje', () => {
      const mockOnChange = vi.fn();
      render(
        <CategorySelect
          categories={mockCategories}
          onChange={mockOnChange}
        />
      );

      const options = screen.getAllByRole('option');
      
      // +1 dla placeholdera "Wybierz kategorię..."
      expect(options).toHaveLength(mockCategories.length + 1);
      expect(screen.getByText('Zakupy spożywcze')).toBeInTheDocument();
      expect(screen.getByText('Napoje')).toBeInTheDocument();
      expect(screen.getByText('Słodycze i przekąski')).toBeInTheDocument();
    });

    it('renderuje placeholder jako disabled option', () => {
      const mockOnChange = vi.fn();
      render(
        <CategorySelect
          categories={mockCategories}
          onChange={mockOnChange}
        />
      );

      const placeholder = screen.getByText('Wybierz kategorię...');
      expect(placeholder).toBeInTheDocument();
      expect(placeholder).toHaveAttribute('disabled');
    });

    it('renderuje pustą listę kategorii', () => {
      const mockOnChange = vi.fn();
      render(
        <CategorySelect
          categories={[]}
          onChange={mockOnChange}
        />
      );

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(1); // Tylko placeholder
    });

    it('ma poprawny aria-label dla dostępności', () => {
      const mockOnChange = vi.fn();
      render(
        <CategorySelect
          categories={mockCategories}
          onChange={mockOnChange}
        />
      );

      const select = screen.getByLabelText('Wybierz kategorię produktu');
      expect(select).toHaveAttribute('aria-label', 'Wybierz kategorię produktu');
    });
  });

  describe('wyświetlanie wybranej wartości', () => {
    it('wyświetla wybraną kategorię', () => {
      const mockOnChange = vi.fn();
      render(
        <CategorySelect
          value="cat-2"
          categories={mockCategories}
          onChange={mockOnChange}
        />
      );

      const select = screen.getByLabelText('Wybierz kategorię produktu') as HTMLSelectElement;
      expect(select.value).toBe('cat-2');
    });

    it('wyświetla placeholder gdy value jest undefined', () => {
      const mockOnChange = vi.fn();
      render(
        <CategorySelect
          value={undefined}
          categories={mockCategories}
          onChange={mockOnChange}
        />
      );

      const select = screen.getByLabelText('Wybierz kategorię produktu') as HTMLSelectElement;
      expect(select.value).toBe('');
    });

    it('wyświetla placeholder gdy value nie jest podane', () => {
      const mockOnChange = vi.fn();
      render(
        <CategorySelect
          categories={mockCategories}
          onChange={mockOnChange}
        />
      );

      const select = screen.getByLabelText('Wybierz kategorię produktu') as HTMLSelectElement;
      expect(select.value).toBe('');
    });
  });

  describe('interakcje użytkownika', () => {
    it('wywołuje onChange przy wyborze kategorii', async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();
      
      render(
        <CategorySelect
          categories={mockCategories}
          onChange={mockOnChange}
        />
      );

      const select = screen.getByLabelText('Wybierz kategorię produktu');
      await user.selectOptions(select, 'cat-1');

      expect(mockOnChange).toHaveBeenCalledTimes(1);
      expect(mockOnChange).toHaveBeenCalledWith('cat-1');
    });

    it('wywołuje onChange z poprawnym ID kategorii', async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();
      
      render(
        <CategorySelect
          categories={mockCategories}
          onChange={mockOnChange}
        />
      );

      const select = screen.getByLabelText('Wybierz kategorię produktu');
      await user.selectOptions(select, 'cat-3');

      expect(mockOnChange).toHaveBeenCalledWith('cat-3');
    });

    it('pozwala zmienić kategorię na inną', async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();
      
      render(
        <CategorySelect
          value="cat-1"
          categories={mockCategories}
          onChange={mockOnChange}
        />
      );

      const select = screen.getByLabelText('Wybierz kategorię produktu');
      await user.selectOptions(select, 'cat-2');

      expect(mockOnChange).toHaveBeenCalledWith('cat-2');
    });

    it('wywołuje onChange wielokrotnie przy wielu zmianach', async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();
      
      render(
        <CategorySelect
          categories={mockCategories}
          onChange={mockOnChange}
        />
      );

      const select = screen.getByLabelText('Wybierz kategorię produktu');
      
      await user.selectOptions(select, 'cat-1');
      await user.selectOptions(select, 'cat-2');
      await user.selectOptions(select, 'cat-3');

      expect(mockOnChange).toHaveBeenCalledTimes(3);
      expect(mockOnChange).toHaveBeenNthCalledWith(1, 'cat-1');
      expect(mockOnChange).toHaveBeenNthCalledWith(2, 'cat-2');
      expect(mockOnChange).toHaveBeenNthCalledWith(3, 'cat-3');
    });
  });

  describe('disabled state', () => {
    it('wyłącza select gdy disabled=true', () => {
      const mockOnChange = vi.fn();
      render(
        <CategorySelect
          categories={mockCategories}
          onChange={mockOnChange}
          disabled={true}
        />
      );

      const select = screen.getByLabelText('Wybierz kategorię produktu');
      expect(select).toBeDisabled();
    });

    it('nie wywołuje onChange gdy select jest disabled', async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();
      
      render(
        <CategorySelect
          categories={mockCategories}
          onChange={mockOnChange}
          disabled={true}
        />
      );

      const select = screen.getByLabelText('Wybierz kategorię produktu');
      
      // Próba wyboru opcji na disabled select nie powinna zadziałać
      await user.selectOptions(select, 'cat-1').catch(() => {
        // user-event rzuca błąd przy próbie interakcji z disabled elementem
      });

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('ma domyślnie disabled=false', () => {
      const mockOnChange = vi.fn();
      render(
        <CategorySelect
          categories={mockCategories}
          onChange={mockOnChange}
        />
      );

      const select = screen.getByLabelText('Wybierz kategorię produktu');
      expect(select).not.toBeDisabled();
    });

    it('ma poprawne klasy CSS gdy disabled', () => {
      const mockOnChange = vi.fn();
      render(
        <CategorySelect
          categories={mockCategories}
          onChange={mockOnChange}
          disabled={true}
        />
      );

      const select = screen.getByLabelText('Wybierz kategorię produktu');
      expect(select).toHaveClass('disabled:bg-slate-100');
      expect(select).toHaveClass('disabled:cursor-not-allowed');
    });
  });

  describe('edge cases', () => {
    it('obsługuje kategorię z długą nazwą', () => {
      const longNameCategories: CategoryDTO[] = [
        {
          id: 'cat-1',
          nazwa_kategorii: 'Bardzo długa nazwa kategorii która może nie zmieścić się w jednej linii',
        },
      ];

      const mockOnChange = vi.fn();
      render(
        <CategorySelect
          categories={longNameCategories}
          onChange={mockOnChange}
        />
      );

      expect(
        screen.getByText('Bardzo długa nazwa kategorii która może nie zmieścić się w jednej linii')
      ).toBeInTheDocument();
    });

    it('obsługuje kategorię ze znakami specjalnymi', () => {
      const specialCategories: CategoryDTO[] = [
        {
          id: 'cat-1',
          nazwa_kategorii: 'Kategoria & Podkategoria (Specjalna)',
        },
      ];

      const mockOnChange = vi.fn();
      render(
        <CategorySelect
          categories={specialCategories}
          onChange={mockOnChange}
        />
      );

      expect(
        screen.getByText('Kategoria & Podkategoria (Specjalna)')
      ).toBeInTheDocument();
    });

    it('zachowuje unikalność opcji po key (id kategorii)', () => {
      const mockOnChange = vi.fn();
      render(
        <CategorySelect
          categories={mockCategories}
          onChange={mockOnChange}
        />
      );

      const options = screen.getAllByRole('option').slice(1); // Bez placeholdera
      
      options.forEach((option, index) => {
        expect(option).toHaveValue(mockCategories[index].id);
      });
    });
  });
});

