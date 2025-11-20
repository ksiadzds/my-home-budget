// src/lib/validations/receipt.validation.ts
import { z } from 'zod';

/**
 * Schemat walidacji dla przesyłanego pliku paragonu
 * Sprawdza typ MIME, rozmiar i obecność pliku
 */
export const receiptFileSchema = z.object({
  receipt: z.custom<File>((file) => {
    // Sprawdzenie czy to obiekt File
    if (!(file instanceof File)) {
      throw new Error('Plik jest wymagany');
    }

    // Sprawdzenie typu MIME - akceptujemy tylko obrazy
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Nieprawidłowy typ pliku. Dozwolone formaty: JPEG, PNG, WEBP');
    }

    // Sprawdzenie rozmiaru pliku - maksymalnie 10MB
    const maxSize = 10 * 1024 * 1024; // 10MB w bajtach
    if (file.size > maxSize) {
      throw new Error('Plik jest zbyt duży. Maksymalny rozmiar to 10MB');
    }

    // Sprawdzenie czy plik nie jest pusty
    if (file.size === 0) {
      throw new Error('Plik jest pusty');
    }

    return true;
  }, {
    message: 'Nieprawidłowy plik',
  }),
});

/**
 * Typ wygenerowany z schematu walidacji
 */
export type ReceiptFileInput = z.infer<typeof receiptFileSchema>;

