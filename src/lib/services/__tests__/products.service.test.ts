// src/lib/services/__tests__/products.service.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../db/database.types';
import { ProductsService } from '../products.service';

// Konfiguracja lokalnego Supabase (z wartości zwróconych przez `supabase status`)
// Używamy service_role key dla testów, który omija RLS
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';

describe('ProductsService', () => {
  let productsService: ProductsService;
  let testKategoriaId: string;
  const testUserId = '00000000-0000-0000-0000-000000000001';

  beforeAll(async () => {
    // Utworzenie klienta Supabase dla testów
    // Używamy service_role key, który omija RLS
    const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    productsService = new ProductsService(supabase);

    // Pobranie ID pierwszej kategorii do użycia w testach
    const { data: kategorie } = await supabase
      .from('kategorie')
      .select('id')
      .limit(1)
      .single();

    if (!kategorie) {
      throw new Error('Brak kategorii w bazie danych - uruchom migracje Supabase');
    }

    testKategoriaId = kategorie.id;

    // Czyszczenie testowych produktów przed testami
    await supabase
      .from('produkty')
      .delete()
      .eq('user_id', testUserId);
    
    await supabase
      .from('produkty')
      .delete()
      .eq('user_id', '00000000-0000-0000-0000-000000000002');
  });

  describe('createProduct', () => {
    it('powinien utworzyć nowy produkt z poprawnymi danymi', async () => {
      const nazwaProduktu = 'Test Mleko';

      const result = await productsService.createProduct(
        testUserId,
        nazwaProduktu,
        testKategoriaId
      );

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.nazwa_produktu).toBe(nazwaProduktu);
      expect(result.kategoria_id).toBe(testKategoriaId);
      expect(result.user_id).toBe(testUserId);
      expect(result.created_at).toBeDefined();
      expect(result.updated_at).toBeDefined();
    });

    it('powinien rzucić błąd gdy kategoria nie istnieje', async () => {
      const nieistniejacyKategoriaId = '00000000-0000-0000-0000-999999999999';

      await expect(
        productsService.createProduct(
          testUserId,
          'Test Produkt',
          nieistniejacyKategoriaId
        )
      ).rejects.toThrow('Kategoria nie istnieje');
    });

    it('powinien rzucić błąd gdy produkt o takiej nazwie już istnieje dla użytkownika', async () => {
      const nazwaProduktu = 'Test Duplikat';

      // Pierwsze utworzenie - powinno się udać
      await productsService.createProduct(
        testUserId,
        nazwaProduktu,
        testKategoriaId
      );

      // Drugie utworzenie - powinno rzucić błąd
      await expect(
        productsService.createProduct(
          testUserId,
          nazwaProduktu,
          testKategoriaId
        )
      ).rejects.toThrow('Produkt o takiej nazwie już istnieje');
    });

    it('powinien pozwolić na utworzenie produktu o tej samej nazwie dla innego użytkownika', async () => {
      const nazwaProduktu = 'Test Wspólny Produkt';
      const innyUserId = '00000000-0000-0000-0000-000000000002';

      // Utworzenie dla pierwszego użytkownika
      const produkt1 = await productsService.createProduct(
        testUserId,
        nazwaProduktu,
        testKategoriaId
      );

      // Utworzenie dla drugiego użytkownika - powinno się udać
      const produkt2 = await productsService.createProduct(
        innyUserId,
        nazwaProduktu,
        testKategoriaId
      );

      expect(produkt1.id).not.toBe(produkt2.id);
      expect(produkt1.user_id).toBe(testUserId);
      expect(produkt2.user_id).toBe(innyUserId);
      expect(produkt1.nazwa_produktu).toBe(produkt2.nazwa_produktu);
    });
  });
});

