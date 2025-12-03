import { test, expect } from '../fixtures';

/**
 * Testy E2E dla zarządzania produktami
 * Wykorzystują Page Object Model i fixtures
 */

test.describe('Zarządzanie produktami', () => {
  // Przed testami zaloguj użytkownika
  test.beforeEach(async ({ page, loginPage, productsPage }) => {
    // Logowanie
    await loginPage.goto();
    await loginPage.login('test@example.com', 'Test1234!');
    await loginPage.waitForNavigation();
    
    // Przejdź do widoku produktów
    await productsPage.goto();
  });

  test('powinien wyświetlić listę produktów', async ({ productsPage }) => {
    await expect(productsPage.productsTable).toBeVisible();
  });

  test('powinien wyszukiwać produkty', async ({ productsPage, page }) => {
    await productsPage.search('mleko');
    
    // Sprawdź czy wyniki zawierają "mleko"
    const tableContent = await productsPage.productsTable.textContent();
    expect(tableContent?.toLowerCase()).toContain('mleko');
  });

  test('powinien nawigować między stronami', async ({ productsPage, page }) => {
    // Sprawdź czy paginacja jest widoczna
    const isPaginationVisible = await productsPage.paginationNext.isVisible();
    
    if (isPaginationVisible) {
      const firstPageUrl = page.url();
      
      await productsPage.goToNextPage();
      const secondPageUrl = page.url();
      
      // URL powinien się zmienić
      expect(secondPageUrl).not.toBe(firstPageUrl);
      expect(secondPageUrl).toContain('page=2');
      
      // Powrót do pierwszej strony
      await productsPage.goToPrevPage();
      await expect(page).toHaveURL(firstPageUrl);
    }
  });

  test('powinien usunąć produkt', async ({ productsPage, page }) => {
    const productName = 'Produkt do usunięcia';
    
    // Znajdź produkt w tabeli
    const productRow = await productsPage.getProductRow(productName);
    
    if (await productRow.isVisible()) {
      await productsPage.deleteProduct(productName);
      
      // Sprawdź czy produkt zniknął
      await expect(productRow).not.toBeVisible();
    }
  });

  test('powinien edytować produkt', async ({ productsPage, page }) => {
    const oldName = 'Stary Produkt';
    const newName = 'Nowy Produkt';
    
    const productRow = await productsPage.getProductRow(oldName);
    
    if (await productRow.isVisible()) {
      await productsPage.editProduct(oldName, newName);
      
      // Sprawdź czy produkt ma nową nazwę
      const updatedRow = await productsPage.getProductRow(newName);
      await expect(updatedRow).toBeVisible();
    }
  });

  test('powinien wyświetlić pusty stan gdy brak produktów', async ({ productsPage, page }) => {
    // Wyszukaj coś co nie istnieje
    await productsPage.search('XXXNONEXISTENTPRODUCTXXX');
    
    // Sprawdź komunikat o braku wyników
    const emptyState = page.getByText(/nie znaleziono/i);
    await expect(emptyState).toBeVisible();
  });
});

