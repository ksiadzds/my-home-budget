import { describe, it, expect } from 'vitest';
import { 
  validateEmail, 
  validatePassword,
  validateProductName 
} from '@/lib/validations/auth.validation';

/**
 * Testy jednostkowe dla walidacji
 */

describe('Validations', () => {
  describe('validateEmail', () => {
    it('akceptuje poprawne adresy email', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.com',
      ];

      validEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.success).toBe(true);
      });
    });

    it('odrzuca niepoprawne adresy email', () => {
      const invalidEmails = [
        'invalid',
        'invalid@',
        '@invalid.com',
        'invalid@domain',
        '',
      ];

      invalidEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });
    });
  });

  describe('validatePassword', () => {
    it('akceptuje silne hasła', () => {
      const validPasswords = [
        'Test1234!',
        'MyP@ssw0rd',
        'Secure#Pass123',
      ];

      validPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.success).toBe(true);
      });
    });

    it('odrzuca słabe hasła', () => {
      const invalidPasswords = [
        '123',           // za krótkie
        'password',      // brak wielkich liter i cyfr
        'PASSWORD',      // brak małych liter i cyfr
        '12345678',      // brak liter
      ];

      invalidPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    it('wymaga minimalnej długości', () => {
      const result = validatePassword('Abc1');
      expect(result.success).toBe(false);
      expect(result.error?.message).toMatch(/długość/i);
    });
  });

  describe('validateProductName', () => {
    it('akceptuje poprawne nazwy produktów', () => {
      const validNames = [
        'Mleko',
        'Chleb wieloziarnisty',
        'Masło 200g',
      ];

      validNames.forEach(name => {
        const result = validateProductName(name);
        expect(result.success).toBe(true);
      });
    });

    it('odrzuca puste nazwy', () => {
      const result = validateProductName('');
      expect(result.success).toBe(false);
    });

    it('odrzuca zbyt długie nazwy', () => {
      const longName = 'a'.repeat(256);
      const result = validateProductName(longName);
      expect(result.success).toBe(false);
    });
  });
});

