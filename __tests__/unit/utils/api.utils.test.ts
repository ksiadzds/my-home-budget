// __tests__/unit/utils/api.utils.test.ts

import { describe, it, expect } from 'vitest';
import { buildQueryString } from '@/lib/utils/api.utils';

/**
 * Testy jednostkowe dla funkcji budującej query string API
 * 
 * @description
 * Testuje buildQueryString() która jest używana przez useProductsData
 * do konstruowania URL query parameters dla GET /api/products
 */

describe('api.utils', () => {
  describe('buildQueryString', () => {
    it('buduje query string z minimalnych parametrów (page + limit)', () => {
      const result = buildQueryString({
        page: 1,
        limit: 20,
      });

      expect(result).toBe('page=1&limit=20');
    });

    it('buduje query string z page, limit i filter', () => {
      const filter = JSON.stringify({ product_name: 'mleko' });
      const result = buildQueryString({
        page: 2,
        limit: 50,
        filter,
      });

      expect(result).toContain('page=2');
      expect(result).toContain('limit=50');
      expect(result).toContain('filter=');
      
      // Sprawdź czy filter jest zakodowany w URL
      const params = new URLSearchParams(result);
      expect(params.get('filter')).toBe(filter);
    });

    it('buduje query string z page, limit i sort', () => {
      const result = buildQueryString({
        page: 1,
        limit: 20,
        sort: 'nazwa_produktu:asc',
      });

      expect(result).toContain('page=1');
      expect(result).toContain('limit=20');
      expect(result).toContain('sort=nazwa_produktu%3Aasc'); // ':' is encoded as %3A
    });

    it('buduje query string ze wszystkimi parametrami', () => {
      const filter = JSON.stringify({ category_id: '123-456' });
      const result = buildQueryString({
        page: 3,
        limit: 100,
        filter,
        sort: 'created_at:desc',
      });

      const params = new URLSearchParams(result);
      expect(params.get('page')).toBe('3');
      expect(params.get('limit')).toBe('100');
      expect(params.get('filter')).toBe(filter);
      expect(params.get('sort')).toBe('created_at:desc');
    });

    it('pomija filter gdy jest undefined', () => {
      const result = buildQueryString({
        page: 1,
        limit: 20,
        filter: undefined,
      });

      expect(result).toBe('page=1&limit=20');
      expect(result).not.toContain('filter');
    });

    it('pomija sort gdy jest undefined', () => {
      const result = buildQueryString({
        page: 1,
        limit: 20,
        sort: undefined,
      });

      expect(result).toBe('page=1&limit=20');
      expect(result).not.toContain('sort');
    });

    it('pomija zarówno filter jak i sort gdy są undefined', () => {
      const result = buildQueryString({
        page: 5,
        limit: 30,
        filter: undefined,
        sort: undefined,
      });

      expect(result).toBe('page=5&limit=30');
    });

    it('poprawnie koduje specjalne znaki w filter JSON', () => {
      const filter = JSON.stringify({ product_name: 'Mleko 2%' });
      const result = buildQueryString({
        page: 1,
        limit: 20,
        filter,
      });

      const params = new URLSearchParams(result);
      const decodedFilter = params.get('filter');
      expect(decodedFilter).toBe(filter);
      expect(JSON.parse(decodedFilter!)).toEqual({ product_name: 'Mleko 2%' });
    });

    it('poprawnie konwertuje number na string dla page i limit', () => {
      const result = buildQueryString({
        page: 42,
        limit: 99,
      });

      const params = new URLSearchParams(result);
      expect(params.get('page')).toBe('42');
      expect(params.get('limit')).toBe('99');
    });

    it('obsługuje duże wartości page', () => {
      const result = buildQueryString({
        page: 9999,
        limit: 20,
      });

      expect(result).toContain('page=9999');
    });

    it('zachowuje kolejność parametrów (page, limit, filter, sort)', () => {
      const filter = JSON.stringify({ product_name: 'test' });
      const result = buildQueryString({
        page: 1,
        limit: 20,
        filter,
        sort: 'nazwa_produktu:asc',
      });

      // URLSearchParams zachowuje kolejność append
      expect(result.indexOf('page=')).toBeLessThan(result.indexOf('limit='));
      expect(result.indexOf('limit=')).toBeLessThan(result.indexOf('filter='));
      expect(result.indexOf('filter=')).toBeLessThan(result.indexOf('sort='));
    });
  });
});




