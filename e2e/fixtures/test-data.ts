/**
 * Dane testowe dla różnych scenariuszy testowych
 */

export const testUsers = {
  valid: {
    email: process.env.E2E_USERNAME || 'test@example.com',
    password: process.env.E2E_PASSWORD || 'Test1234!',
    id: process.env.E2E_USERNAME_ID || '',
  },
  invalid: {
    email: 'invalid@example.com',
    password: 'wrongpassword',
  },
  newUser: {
    email: 'newuser@example.com',
    password: 'NewUser1234!',
  },
};

export const testProducts = {
  groceries: [
    { nazwa_produktu: 'Mleko', kategoria: 'Zakupy spożywcze' },
    { nazwa_produktu: 'Chleb', kategoria: 'Zakupy spożywcze' },
    { nazwa_produktu: 'Masło', kategoria: 'Zakupy spożywcze' },
  ],
  beverages: [
    { nazwa_produktu: 'Cola', kategoria: 'Napoje' },
    { nazwa_produktu: 'Woda mineralna', kategoria: 'Napoje' },
  ],
  cosmetics: [
    { nazwa_produktu: 'Szampon', kategoria: 'Kosmetyki i przybory toaletowe' },
    { nazwa_produktu: 'Pasta do zębów', kategoria: 'Kosmetyki i przybory toaletowe' },
  ],
};

