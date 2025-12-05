// __tests__/unit/utils/upload.utils.test.ts
import { describe, it, expect } from "vitest";
import { validateFile, MAX_FILE_SIZE, ALLOWED_TYPES } from "@/lib/utils/upload.utils";

/**
 * Test Suite: validateFile
 *
 * @description
 * Testy walidacji plików dla komponentu UploadDropzone.
 * Sprawdza zgodność z regułami biznesowymi:
 * - Tylko pliki JPEG i PNG
 * - Maksymalny rozmiar 10 MB
 * - Prawidłowe komunikaty błędów
 */
describe("validateFile", () => {
  // =========================================
  // TESTY TYPU PLIKU
  // =========================================

  describe("File Type Validation", () => {
    it("should accept valid JPEG files", () => {
      // Arrange
      const validFile = new File(["jpeg content"], "photo.jpg", {
        type: "image/jpeg",
      });

      // Act
      const error = validateFile(validFile);

      // Assert
      expect(error).toBeNull();
    });

    it("should accept valid PNG files", () => {
      // Arrange
      const validFile = new File(["png content"], "screenshot.png", {
        type: "image/png",
      });

      // Act
      const error = validateFile(validFile);

      // Assert
      expect(error).toBeNull();
    });

    it("should reject PDF files", () => {
      // Arrange
      const pdfFile = new File(["pdf content"], "document.pdf", {
        type: "application/pdf",
      });

      // Act
      const error = validateFile(pdfFile);

      // Assert
      expect(error).toEqual({
        code: "invalid_type",
        message: expect.stringContaining("Dozwolone formaty: JPEG, PNG"),
      });
      expect(error?.message).toContain("application/pdf");
    });

    it("should reject WebP files", () => {
      // Arrange
      const webpFile = new File(["webp content"], "photo.webp", {
        type: "image/webp",
      });

      // Act
      const error = validateFile(webpFile);

      // Assert
      expect(error).toEqual({
        code: "invalid_type",
        message: expect.stringContaining("image/webp"),
      });
    });

    it("should reject GIF files", () => {
      // Arrange
      const gifFile = new File(["gif content"], "animation.gif", {
        type: "image/gif",
      });

      // Act
      const error = validateFile(gifFile);

      // Assert
      expect(error).not.toBeNull();
      expect(error?.code).toBe("invalid_type");
    });

    it("should reject files with no MIME type", () => {
      // Arrange
      const fileWithoutType = new File(["content"], "unknown", {
        type: "",
      });

      // Act
      const error = validateFile(fileWithoutType);

      // Assert
      expect(error).toEqual({
        code: "invalid_type",
        message: expect.stringContaining("nieznany"),
      });
    });

    it("should reject text files", () => {
      // Arrange
      const textFile = new File(["text content"], "file.txt", {
        type: "text/plain",
      });

      // Act
      const error = validateFile(textFile);

      // Assert
      expect(error?.code).toBe("invalid_type");
    });
  });

  // =========================================
  // TESTY ROZMIARU PLIKU
  // =========================================

  describe("File Size Validation", () => {
    it("should accept files exactly at 10 MB limit", () => {
      // Arrange
      const contentSize = MAX_FILE_SIZE;
      const exactlyLimitFile = new File([new ArrayBuffer(contentSize)], "photo.jpg", {
        type: "image/jpeg",
      });

      // Act
      const error = validateFile(exactlyLimitFile);

      // Assert
      expect(error).toBeNull();
    });

    it("should reject files larger than 10 MB", () => {
      // Arrange
      const oversizedContent = new ArrayBuffer(MAX_FILE_SIZE + 1);
      const largeFile = new File([oversizedContent], "large.jpg", {
        type: "image/jpeg",
      });

      // Act
      const error = validateFile(largeFile);

      // Assert
      expect(error).toEqual({
        code: "too_large",
        message: expect.stringContaining("Maksymalny rozmiar: 10 MB"),
      });
    });

    it("should reject files significantly larger than limit (50 MB)", () => {
      // Arrange
      const hugeContent = new ArrayBuffer(50 * 1024 * 1024);
      const hugeFile = new File([hugeContent], "huge.png", {
        type: "image/png",
      });

      // Act
      const error = validateFile(hugeFile);

      // Assert
      expect(error?.code).toBe("too_large");
      expect(error?.message).toContain("50.00 MB");
    });

    it("should accept very small files (1 KB)", () => {
      // Arrange
      const tinyContent = new ArrayBuffer(1024);
      const tinyFile = new File([tinyContent], "tiny.jpg", {
        type: "image/jpeg",
      });

      // Act
      const error = validateFile(tinyFile);

      // Assert
      expect(error).toBeNull();
    });

    it("should accept empty files (0 bytes)", () => {
      // Arrange
      const emptyFile = new File([], "empty.jpg", {
        type: "image/jpeg",
      });

      // Act
      const error = validateFile(emptyFile);

      // Assert
      expect(error).toBeNull();
    });

    it("should display file size in MB with 2 decimal places in error message", () => {
      // Arrange
      const size = 15.5 * 1024 * 1024; // 15.5 MB
      const largeFile = new File([new ArrayBuffer(Math.floor(size))], "large.jpg", {
        type: "image/jpeg",
      });

      // Act
      const error = validateFile(largeFile);

      // Assert
      expect(error?.message).toMatch(/\d+\.\d{2} MB/);
    });
  });

  // =========================================
  // TESTY KOMBINACJI (TYPE + SIZE)
  // =========================================

  describe("Combined Validation (Type + Size)", () => {
    it("should prioritize type validation over size validation", () => {
      // Arrange - nieprawidłowy typ I za duży
      const invalidFile = new File([new ArrayBuffer(MAX_FILE_SIZE + 1)], "doc.pdf", {
        type: "application/pdf",
      });

      // Act
      const error = validateFile(invalidFile);

      // Assert - powinien zwrócić błąd typu (sprawdzany pierwszy)
      expect(error?.code).toBe("invalid_type");
    });

    it("should validate size only after type passes", () => {
      // Arrange - prawidłowy typ, ale za duży
      const largeJpeg = new File([new ArrayBuffer(MAX_FILE_SIZE + 1)], "large.jpg", {
        type: "image/jpeg",
      });

      // Act
      const error = validateFile(largeJpeg);

      // Assert
      expect(error?.code).toBe("too_large");
    });
  });

  // =========================================
  // TESTY WARUNKÓW BRZEGOWYCH
  // =========================================

  describe("Edge Cases", () => {
    it("should handle file with valid type but unusual extension", () => {
      // Arrange - MIME type jest prawidłowy (JPEG), ale rozszerzenie nie
      const file = new File(["content"], "photo.xyz", {
        type: "image/jpeg",
      });

      // Act
      const error = validateFile(file);

      // Assert - walidujemy po MIME type, nie po rozszerzeniu
      expect(error).toBeNull();
    });

    it("should handle file sizes just under the limit", () => {
      // Arrange - 9.99 MB
      const almostLimitFile = new File([new ArrayBuffer(MAX_FILE_SIZE - 10240)], "photo.jpg", {
        type: "image/jpeg",
      });

      // Act
      const error = validateFile(almostLimitFile);

      // Assert
      expect(error).toBeNull();
    });

    it("should handle file sizes just over the limit", () => {
      // Arrange - 10 MB + 1 byte
      const justOverLimitFile = new File([new ArrayBuffer(MAX_FILE_SIZE + 1)], "photo.jpg", {
        type: "image/jpeg",
      });

      // Act
      const error = validateFile(justOverLimitFile);

      // Assert
      expect(error?.code).toBe("too_large");
    });

    it("should preserve original type value in error message", () => {
      // Arrange
      const svgFile = new File(["<svg></svg>"], "icon.svg", {
        type: "image/svg+xml",
      });

      // Act
      const error = validateFile(svgFile);

      // Assert
      expect(error?.message).toContain("image/svg+xml");
    });
  });

  // =========================================
  // TESTY STAŁYCH
  // =========================================

  describe("Constants", () => {
    it("should have MAX_FILE_SIZE set to 10 MB", () => {
      expect(MAX_FILE_SIZE).toBe(10 * 1024 * 1024);
    });

    it("should have ALLOWED_TYPES containing only JPEG and PNG", () => {
      expect(ALLOWED_TYPES).toEqual(["image/jpeg", "image/png"]);
    });
  });
});
