// src/lib/utils/matching.utils.ts

import type { ProductDTO } from "@/types";

/**
 * Wynik dopasowania produktu z OCR do bazy
 */
export interface MatchResult {
  /** Dopasowany produkt lub null jeśli nie znaleziono */
  product: ProductDTO | null;
  /** Confidence score (0-1) */
  confidence: number;
}

/**
 * Znajduje pasujący produkt w bazie użytkownika
 * Używa prostego porównania nazw (case-insensitive, trimmed)
 *
 * @param {string} ocrProductName - Nazwa produktu rozpoznana przez OCR
 * @param {ProductDTO[]} userProducts - Produkty użytkownika z bazy
 * @returns {ProductDTO | null} Znaleziony produkt lub null
 *
 * @description
 * Strategie dopasowania (w kolejności):
 * 1. Dokładne dopasowanie (case-insensitive, trimmed)
 * 2. Dopasowanie częściowe (jeden string zawiera drugi)
 *
 * @example
 * ```ts
 * const match = findMatchingProduct('Mleko 2%', userProducts);
 * if (match) {
 *   console.log(match.nazwa_produktu); // "mleko 2%"
 * }
 * ```
 */
export function findMatchingProduct(ocrProductName: string, userProducts: ProductDTO[]): ProductDTO | null {
  const normalizedOcrName = ocrProductName.toLowerCase().trim();

  // Dokładne dopasowanie
  const exactMatch = userProducts.find((p) => p.nazwa_produktu.toLowerCase().trim() === normalizedOcrName);

  if (exactMatch) {
    return exactMatch;
  }

  // Dopasowanie częściowe (OCR name zawiera się w nazwie produktu lub odwrotnie)
  const partialMatch = userProducts.find((p) => {
    const normalizedProductName = p.nazwa_produktu.toLowerCase().trim();
    return normalizedProductName.includes(normalizedOcrName) || normalizedOcrName.includes(normalizedProductName);
  });

  return partialMatch || null;
}

/**
 * Oblicza confidence score dla dopasowania produktu
 *
 * @param {string} ocrName - Nazwa z OCR
 * @param {string} productName - Nazwa z bazy
 * @returns {number} Confidence score (0-1)
 *
 * @description
 * Scoring:
 * - 1.0: dokładne dopasowanie (po normalizacji)
 * - 0.8: dopasowanie częściowe (jeden zawiera drugi)
 * - 0.6: domyślny score (jeśli już dopasowano, ale nie idealnie)
 *
 * @example
 * ```ts
 * calculateConfidence('Mleko 2%', 'mleko 2%'); // 1.0
 * calculateConfidence('Mleko', 'Mleko 2%'); // 0.8
 * ```
 */
export function calculateConfidence(ocrName: string, productName: string): number {
  const normalized1 = ocrName.toLowerCase().trim();
  const normalized2 = productName.toLowerCase().trim();

  // Dokładne dopasowanie = 1.0
  if (normalized1 === normalized2) {
    return 1.0;
  }

  // Dopasowanie częściowe = 0.8
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    return 0.8;
  }

  // Domyślnie 0.6 (jeśli już dopasowano, ale nie idealnie)
  return 0.6;
}
