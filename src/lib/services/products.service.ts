// src/lib/services/products.service.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../db/database.types';
import type { ProductDTO } from '../../types';

/**
 * Serwis do zarządzania produktami
 * Enkapsuluje logikę biznesową związaną z operacjami CRUD na produktach
 */
export class ProductsService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Tworzy nowy produkt dla użytkownika
   * 
   * @param userId - ID użytkownika tworzącego produkt
   * @param nazwaproduktu - Nazwa produktu
   * @param kategoriaId - ID kategorii, do której należy produkt
   * @returns ProductDTO nowo utworzonego produktu
   * @throws Error gdy produkt o takiej nazwie już istnieje dla użytkownika
   * @throws Error gdy kategoria nie istnieje
   * @throws Error w przypadku innych błędów bazodanowych
   */
  async createProduct(
    userId: string,
    nazwaProductu: string,
    kategoriaId: string
  ): Promise<ProductDTO> {
    // Sprawdzenie czy kategoria istnieje
    const { data: category, error: categoryError } = await this.supabase
      .from('kategorie')
      .select('id')
      .eq('id', kategoriaId)
      .single();

    if (categoryError || !category) {
      throw new Error('Kategoria nie istnieje');
    }

    // Sprawdzenie czy produkt już istnieje dla użytkownika
    const { data: existingProduct, error: checkError } = await this.supabase
      .from('produkty')
      .select('id')
      .eq('user_id', userId)
      .eq('nazwa_produktu', nazwaProductu)
      .maybeSingle();

    if (checkError) {
      throw new Error(`Błąd podczas sprawdzania duplikatów: ${checkError.message}`);
    }

    if (existingProduct) {
      throw new Error('Produkt o takiej nazwie już istnieje');
    }

    // Utworzenie produktu
    const { data: newProduct, error: insertError } = await this.supabase
      .from('produkty')
      .insert({
        user_id: userId,
        nazwa_produktu: nazwaProductu,
        kategoria_id: kategoriaId,
      })
      .select()
      .single();

    if (insertError || !newProduct) {
      throw new Error(`Nie udało się utworzyć produktu: ${insertError?.message || 'Nieznany błąd'}`);
    }

    // Mapowanie wyniku do DTO
    return {
      id: newProduct.id,
      nazwa_produktu: newProduct.nazwa_produktu,
      kategoria_id: newProduct.kategoria_id,
      user_id: newProduct.user_id,
      created_at: newProduct.created_at,
      updated_at: newProduct.updated_at,
    };
  }
}

