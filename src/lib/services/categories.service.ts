// src/lib/services/categories.service.ts
import type { SupabaseClient } from '@/db/supabase.client';
import type { CategoryDTO } from '@/types';

/**
 * Serwis do zarządzania kategoriami produktów
 * Enkapsuluje logikę biznesową związaną z operacjami na kategoriach
 */
export class CategoriesService {
  /**
   * Pobiera wszystkie kategorie z bazy danych
   * Kategorie są sortowane alfabetycznie według nazwy
   * 
   * @param supabase - Klient Supabase
   * @returns Promise z tablicą CategoryDTO zawierającą wszystkie kategorie
   * @throws Error jeśli wystąpi błąd podczas pobierania danych z bazy
   */
  static async listCategories(supabase: SupabaseClient): Promise<CategoryDTO[]> {
    const { data, error } = await supabase
      .from('kategorie')
      .select('id, nazwa_kategorii')
      .order('nazwa_kategorii', { ascending: true });

    if (error) {
      console.error('[CategoriesService] Database error:', error);
      throw new Error('Failed to fetch categories from database');
    }

    return data || [];
  }
}

