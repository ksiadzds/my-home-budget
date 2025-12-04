// __tests__/unit/validations/receipt.validation.test.ts

import { describe, it, expect } from 'vitest';
import { receiptFileSchema } from '@/lib/validations/receipt.validation';

/**
 * Testy jednostkowe dla walidacji plików paragonów
 * 
 * @description
 * Testuje receiptFileSchema które waliduje przesyłane pliki obrazów paragonów
 * - Typy MIME (JPEG, PNG, WEBP)
 * - Rozmiar pliku (max 10MB)
 * - Obecność pliku
 */

describe('receipt.validation', () => {
  describe('receiptFileSchema', () => {
    // Helper do tworzenia mock File
    const createMockFile = (
      name: string,
      size: number,
      type: string
    ): File => {
      const blob = new Blob(['x'.repeat(size)], { type });
      return new File([blob], name, { type });
    };

    describe('poprawne pliki', () => {
      it('akceptuje plik JPEG', () => {
        const file = createMockFile('receipt.jpg', 1024 * 1024, 'image/jpeg');
        const result = receiptFileSchema.safeParse({ receipt: file });

        expect(result.success).toBe(true);
      });

      it('akceptuje plik PNG', () => {
        const file = createMockFile('receipt.png', 1024 * 1024, 'image/png');
        const result = receiptFileSchema.safeParse({ receipt: file });

        expect(result.success).toBe(true);
      });

      it('akceptuje plik WEBP', () => {
        const file = createMockFile('receipt.webp', 1024 * 1024, 'image/webp');
        const result = receiptFileSchema.safeParse({ receipt: file });

        expect(result.success).toBe(true);
      });

      it('akceptuje typ image/jpg (alias dla jpeg)', () => {
        const file = createMockFile('receipt.jpg', 1024 * 1024, 'image/jpg');
        const result = receiptFileSchema.safeParse({ receipt: file });

        expect(result.success).toBe(true);
      });

      it('akceptuje plik o rozmiarze 1MB', () => {
        const file = createMockFile('receipt.jpg', 1 * 1024 * 1024, 'image/jpeg');
        const result = receiptFileSchema.safeParse({ receipt: file });

        expect(result.success).toBe(true);
      });

      it('akceptuje plik o rozmiarze 5MB', () => {
        const file = createMockFile('receipt.jpg', 5 * 1024 * 1024, 'image/jpeg');
        const result = receiptFileSchema.safeParse({ receipt: file });

        expect(result.success).toBe(true);
      });

      it('akceptuje plik o rozmiarze dokładnie 10MB (granica)', () => {
        const file = createMockFile('receipt.jpg', 10 * 1024 * 1024, 'image/jpeg');
        const result = receiptFileSchema.safeParse({ receipt: file });

        expect(result.success).toBe(true);
      });

      it('akceptuje minimalny plik (1 bajt)', () => {
        const file = createMockFile('receipt.jpg', 1, 'image/jpeg');
        const result = receiptFileSchema.safeParse({ receipt: file });

        expect(result.success).toBe(true);
      });
    });

    describe('niepoprawne typy plików', () => {
      it('odrzuca plik PDF', () => {
        const file = createMockFile('receipt.pdf', 1024, 'application/pdf');
        const result = receiptFileSchema.safeParse({ receipt: file });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('Nieprawidłowy plik');
        }
      });

      it('odrzuca plik GIF', () => {
        const file = createMockFile('receipt.gif', 1024, 'image/gif');
        const result = receiptFileSchema.safeParse({ receipt: file });

        expect(result.success).toBe(false);
      });

      it('odrzuca plik SVG', () => {
        const file = createMockFile('receipt.svg', 1024, 'image/svg+xml');
        const result = receiptFileSchema.safeParse({ receipt: file });

        expect(result.success).toBe(false);
      });

      it('odrzuca plik tekstowy', () => {
        const file = createMockFile('receipt.txt', 1024, 'text/plain');
        const result = receiptFileSchema.safeParse({ receipt: file });

        expect(result.success).toBe(false);
      });

      it('odrzuca plik bez typu MIME', () => {
        const file = createMockFile('receipt', 1024, '');
        const result = receiptFileSchema.safeParse({ receipt: file });

        expect(result.success).toBe(false);
      });
    });

    describe('niepoprawny rozmiar pliku', () => {
      it('odrzuca plik większy niż 10MB', () => {
        const file = createMockFile(
          'receipt.jpg',
          10 * 1024 * 1024 + 1,
          'image/jpeg'
        );
        const result = receiptFileSchema.safeParse({ receipt: file });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('Nieprawidłowy plik');
        }
      });

      it('odrzuca plik o rozmiarze 15MB', () => {
        const file = createMockFile(
          'receipt.jpg',
          15 * 1024 * 1024,
          'image/jpeg'
        );
        const result = receiptFileSchema.safeParse({ receipt: file });

        expect(result.success).toBe(false);
      });

      it('odrzuca plik o rozmiarze 20MB', () => {
        const file = createMockFile(
          'receipt.jpg',
          20 * 1024 * 1024,
          'image/jpeg'
        );
        const result = receiptFileSchema.safeParse({ receipt: file });

        expect(result.success).toBe(false);
      });

      it('odrzuca pusty plik (0 bajtów)', () => {
        const file = createMockFile('receipt.jpg', 0, 'image/jpeg');
        const result = receiptFileSchema.safeParse({ receipt: file });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('Nieprawidłowy plik');
        }
      });
    });

    describe('brak pliku', () => {
      it('odrzuca undefined', () => {
        const result = receiptFileSchema.safeParse({ receipt: undefined });

        expect(result.success).toBe(false);
      });

      it('odrzuca null', () => {
        const result = receiptFileSchema.safeParse({ receipt: null });

        expect(result.success).toBe(false);
      });

      it('odrzuca string zamiast File', () => {
        const result = receiptFileSchema.safeParse({ receipt: 'not-a-file' });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('Nieprawidłowy plik');
        }
      });

      it('odrzuca number zamiast File', () => {
        const result = receiptFileSchema.safeParse({ receipt: 12345 });

        expect(result.success).toBe(false);
      });

      it('odrzuca obiekt nie będący File', () => {
        const result = receiptFileSchema.safeParse({
          receipt: { name: 'fake.jpg', size: 1024 },
        });

        expect(result.success).toBe(false);
      });

      it('odrzuca pusty obiekt', () => {
        const result = receiptFileSchema.safeParse({});

        expect(result.success).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('odrzuca plik JPEG większy niż 10MB mimo poprawnego typu', () => {
        const file = createMockFile(
          'large-receipt.jpg',
          11 * 1024 * 1024,
          'image/jpeg'
        );
        const result = receiptFileSchema.safeParse({ receipt: file });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('Nieprawidłowy plik');
        }
      });

      it('odrzuca pusty plik PNG', () => {
        const file = createMockFile('empty.png', 0, 'image/png');
        const result = receiptFileSchema.safeParse({ receipt: file });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('Nieprawidłowy plik');
        }
      });

      it('odrzuca plik z poprawnym rozszerzeniem ale złym MIME type', () => {
        // Plik nazywa się .jpg ale ma typ PDF
        const file = createMockFile('fake.jpg', 1024, 'application/pdf');
        const result = receiptFileSchema.safeParse({ receipt: file });

        expect(result.success).toBe(false);
      });
    });
  });
});

