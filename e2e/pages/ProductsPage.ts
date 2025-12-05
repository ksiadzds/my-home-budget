import { Page, Locator } from "@playwright/test";

/**
 * Page Object Model dla widoku produktów
 * Enkapsuluje interakcje z listą produktów
 */
export class ProductsPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly addProductButton: Locator;
  readonly productsTable: Locator;
  readonly paginationNext: Locator;
  readonly paginationPrev: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.getByPlaceholder(/szukaj/i);
    this.addProductButton = page.getByRole("button", { name: /dodaj produkt/i });
    this.productsTable = page.getByRole("table");
    this.paginationNext = page.getByRole("button", { name: /następna/i });
    this.paginationPrev = page.getByRole("button", { name: /poprzednia/i });
  }

  async goto() {
    await this.page.goto("/products");
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    // Czekamy na debounce (500ms)
    await this.page.waitForTimeout(600);
  }

  async getProductRow(productName: string) {
    return this.page.getByRole("row", { name: new RegExp(productName, "i") });
  }

  async deleteProduct(productName: string) {
    const row = await this.getProductRow(productName);
    const deleteButton = row.getByRole("button", { name: /usuń/i });
    await deleteButton.click();

    // Potwierdź w dialogu
    const confirmButton = this.page.getByRole("button", { name: /potwierdź/i });
    await confirmButton.click();
  }

  async editProduct(productName: string, newName: string) {
    const row = await this.getProductRow(productName);
    const editButton = row.getByRole("button", { name: /edytuj/i });
    await editButton.click();

    // Wypełnij formularz edycji
    const nameInput = this.page.getByLabel(/nazwa produktu/i);
    await nameInput.clear();
    await nameInput.fill(newName);

    // Zapisz
    const saveButton = this.page.getByRole("button", { name: /zapisz/i });
    await saveButton.click();
  }

  async goToNextPage() {
    await this.paginationNext.click();
    await this.page.waitForLoadState("networkidle");
  }

  async goToPrevPage() {
    await this.paginationPrev.click();
    await this.page.waitForLoadState("networkidle");
  }
}
