// src/lib/validations/receipt.validation.ts
import { z } from "zod";

/**
 * Schemat walidacji dla przesyłanego pliku paragonu
 * Sprawdza typ MIME, rozmiar i obecność pliku
 */
export const receiptFileSchema = z.object({
  receipt: z.custom<File>(
    (file) => {
      // Sprawdzenie czy to obiekt File
      if (!(file instanceof File)) {
        return false;
      }

      // Sprawdzenie typu MIME - akceptujemy tylko obrazy
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        return false;
      }

      // Sprawdzenie rozmiaru pliku - maksymalnie 10MB
      const maxSize = 10 * 1024 * 1024; // 10MB w bajtach
      if (file.size > maxSize) {
        return false;
      }

      // Sprawdzenie czy plik nie jest pusty
      if (file.size === 0) {
        return false;
      }

      return true;
    },
    {
      message: "Nieprawidłowy plik. Dozwolone formaty: JPEG, PNG, WEBP. Maksymalny rozmiar: 10MB.",
    }
  ),
});

/**
 * Typ wygenerowany z schematu walidacji
 */
export type ReceiptFileInput = z.infer<typeof receiptFileSchema>;
