// src/lib/utils/upload.utils.ts
import type { UploadValidationError } from '@/types';

/**
 * Maksymalny rozmiar pliku w bajtach (10 MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Dozwolone typy MIME dla plików paragonu
 */
export const ALLOWED_TYPES = ['image/jpeg', 'image/png'] as const;

/**
 * Waliduje plik pod kątem typu i rozmiaru
 * 
 * @function validateFile
 * @description
 * Sprawdza czy plik spełnia wymagania:
 * - Typ: image/jpeg lub image/png
 * - Rozmiar: ≤ 10 MB
 * 
 * @param {File} file - Plik do walidacji
 * @returns {UploadValidationError | null} Błąd walidacji lub null jeśli plik jest prawidłowy
 * 
 * @example
 * ```typescript
 * const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
 * const error = validateFile(file);
 * if (error) {
 *   console.error(error.message);
 * }
 * ```
 */
export function validateFile(file: File): UploadValidationError | null {
  // Sprawdź typ pliku
  if (!ALLOWED_TYPES.includes(file.type as typeof ALLOWED_TYPES[number])) {
    return {
      code: 'invalid_type',
      message: `Nieprawidłowy format pliku. Dozwolone formaty: JPEG, PNG. Wybrany format: ${file.type || 'nieznany'}`,
    };
  }

  // Sprawdź rozmiar pliku
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      code: 'too_large',
      message: `Plik jest za duży. Maksymalny rozmiar: 10 MB. Rozmiar wybranego pliku: ${sizeMB} MB`,
    };
  }

  return null;
}

