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

