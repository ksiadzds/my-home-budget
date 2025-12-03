import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSupabaseClient } from '@/db/supabase.client';
import { 
  getProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct 
} from '@/lib/services/products.service';
import type { Product } from '@/types';

/**
 * Testy jednostkowe dla serwisu produktów
 * Mockują klienta Supabase
 */

// Mock Supabase client
vi.mock('@/db/supabase.client', () => ({
  createSupabaseClient: vi.fn(),
}));

describe('ProductsService', () => {
  let mockSupabase: any;

  beforeEach(() => {
    // Reset mocków przed każdym testem
    vi.clearAllMocks();
    
    // Setup mock Supabase client
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
    };
    
    (createSupabaseClient as any).mockReturnValue(mockSupabase);
  });

  describe('getProducts', () => {
    it('pobiera listę produktów z paginacją', async () => {
      const mockProducts: Product[] = [
        {
          id: '1',
          nazwa_produktu: 'Mleko',
          kategoria_id: 'kat-1',
          user_id: 'user-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      mockSupabase.select.mockResolvedValue({
        data: mockProducts,
        error: null,
        count: 1,
      });

      const request = new Request('http://localhost/api/products?page=1&limit=10');
      const result = await getProducts(request, 'user-1');

      expect(result.data).toEqual(mockProducts);
      expect(mockSupabase.from).toHaveBeenCalledWith('produkty');
      expect(mockSupabase.select).toHaveBeenCalled();
    });

    it('filtruje produkty po nazwie', async () => {
      const searchQuery = 'mleko';
      const request = new Request(`http://localhost/api/products?search=${searchQuery}`);
      
      await getProducts(request, 'user-1');

      expect(mockSupabase.ilike).toHaveBeenCalledWith('nazwa_produktu', `%${searchQuery}%`);
    });

    it('sortuje produkty według określonej kolumny', async () => {
      const request = new Request('http://localhost/api/products?sortBy=nazwa_produktu&sortOrder=asc');
      
      await getProducts(request, 'user-1');

      expect(mockSupabase.order).toHaveBeenCalledWith('nazwa_produktu', { ascending: true });
    });
  });

  describe('getProductById', () => {
    it('pobiera pojedynczy produkt po ID', async () => {
      const mockProduct: Product = {
        id: '1',
        nazwa_produktu: 'Mleko',
        kategoria_id: 'kat-1',
        user_id: 'user-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabase.single.mockResolvedValue({
        data: mockProduct,
        error: null,
      });

      const result = await getProductById('1', 'user-1');

      expect(result.data).toEqual(mockProduct);
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', '1');
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user-1');
    });

    it('zwraca błąd gdy produkt nie istnieje', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      const result = await getProductById('999', 'user-1');

      expect(result.error).toBeTruthy();
    });
  });

  describe('createProduct', () => {
    it('tworzy nowy produkt', async () => {
      const newProduct = {
        nazwa_produktu: 'Nowy Produkt',
        kategoria_id: 'kat-1',
      };

      const createdProduct: Product = {
        id: '1',
        ...newProduct,
        user_id: 'user-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabase.select.mockResolvedValue({
        data: [createdProduct],
        error: null,
      });

      const result = await createProduct(newProduct, 'user-1');

      expect(result.data).toEqual(createdProduct);
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          ...newProduct,
          user_id: 'user-1',
        })
      );
    });
  });

  describe('updateProduct', () => {
    it('aktualizuje istniejący produkt', async () => {
      const updateData = {
        nazwa_produktu: 'Zaktualizowany Produkt',
      };

      const updatedProduct: Product = {
        id: '1',
        nazwa_produktu: 'Zaktualizowany Produkt',
        kategoria_id: 'kat-1',
        user_id: 'user-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabase.select.mockResolvedValue({
        data: [updatedProduct],
        error: null,
      });

      const result = await updateProduct('1', updateData, 'user-1');

      expect(result.data).toEqual(updatedProduct);
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining(updateData)
      );
    });
  });

  describe('deleteProduct', () => {
    it('usuwa produkt po ID', async () => {
      mockSupabase.delete.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await deleteProduct('1', 'user-1');

      expect(result.success).toBe(true);
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', '1');
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user-1');
    });
  });
});

