import { Page, Locator } from "@playwright/test";

/**
 * Page Object Model dla strony logowania
 * Enkapsuluje interakcje ze stroną logowania
 */
export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel(/e-?mail/i);
    this.passwordInput = page.getByLabel(/hasło/i);
    this.submitButton = page.getByRole("button", { name: /zaloguj/i });
    this.errorMessage = page.getByRole("alert");
  }

  async goto() {
    await this.page.goto("/auth/login");
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async waitForNavigation() {
    await this.page.waitForURL("/", { timeout: 5000 });
  }
}
