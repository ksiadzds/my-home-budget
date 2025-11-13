// src/lib/validations/product.validation.ts
import { z } from 'zod';

/**
 * Schemat walidacji dla tworzenia produktu
 * Sprawdza poprawność nazwy produktu oraz format UUID kategorii
 */
export const createProductSchema = z.object({
  nazwa_produktu: z
    .string()
    .min(1, 'Nazwa produktu nie może być pusta')
    .max(255, 'Nazwa produktu nie może przekraczać 255 znaków')
    .trim(),
  kategoria_id: z
    .string()
    .uuid('Nieprawidłowy format UUID dla kategoria_id'),
});

/**
 * Typ wejściowy dla tworzenia produktu - wyekstrahowany ze schematu Zod
 */
export type CreateProductInput = z.infer<typeof createProductSchema>;

/**
 * Schemat walidacji dla filtra produktów
 * Może zawierać category_id (UUID) lub product_name (częściowa nazwa)
 */
export const productFilterSchema = z.object({
  category_id: z.string().uuid('Nieprawidłowy format UUID dla category_id').optional(),
  product_name: z.string().min(1, 'Nazwa produktu nie może być pusta').optional(),
}).strict();

/**
 * Dozwolone pola sortowania produktów
 */
const sortFieldSchema = z.enum(['nazwa_produktu', 'created_at', 'updated_at']);

/**
 * Kierunek sortowania
 */
const sortOrderSchema = z.enum(['asc', 'desc']);

/**
 * Schemat walidacji dla sortowania produktów
 * Format: "pole:kierunek", np. "nazwa_produktu:asc"
 */
export const productSortSchema = z.string().regex(
  /^(nazwa_produktu|created_at|updated_at):(asc|desc)$/,
  'Nieprawidłowy format sortowania. Oczekiwany format: pole:kierunek (np. nazwa_produktu:asc)'
);

/**
 * Schemat walidacji dla parametrów query listowania produktów
 * Wspiera paginację, filtrowanie i sortowanie
 */
export const listProductsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val >= 1, 'Numer strony musi być większy lub równy 1'),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .refine((val) => val >= 1 && val <= 100, 'Limit musi być między 1 a 100'),
  filter: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      try {
        return JSON.parse(val);
      } catch {
        throw new Error('Nieprawidłowy format JSON w parametrze filter');
      }
    })
    .pipe(productFilterSchema.optional()),
  sort: z.string().optional().refine(
    (val) => {
      if (!val) return true;
      return /^(nazwa_produktu|created_at|updated_at):(asc|desc)$/.test(val);
    },
    'Nieprawidłowy format sortowania. Oczekiwany format: pole:kierunek (np. nazwa_produktu:asc)'
  ),
});

/**
 * Typ wejściowy dla listowania produktów - wyekstrahowany ze schematu Zod
 */
export type ListProductsQueryInput = z.infer<typeof listProductsQuerySchema>;

/**
 * Schemat walidacji dla parametru path 'id' w GET /api/products/{id}
 * Sprawdza poprawność formatu UUID
 */
export const getProductParamsSchema = z.object({
  id: z
    .string()
    .uuid('Nieprawidłowy format UUID dla parametru id'),
});

/**
 * Typ wejściowy dla parametrów GET produktu
 */
export type GetProductParamsInput = z.infer<typeof getProductParamsSchema>;

