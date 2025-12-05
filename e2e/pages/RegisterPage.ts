import { Page, Locator } from "@playwright/test";

/**
 * Page Object Model dla strony rejestracji
 * Enkapsuluje interakcje ze stroną rejestracji
 */
export class RegisterPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel(/e-?mail/i);
    this.passwordInput = page.getByLabel(/^hasło$/i);
    this.confirmPasswordInput = page.getByLabel(/potwierdź hasło/i);
    this.submitButton = page.getByRole("button", { name: /zarejestruj/i });
    this.errorMessage = page.getByRole("alert");
  }

  async goto() {
    await this.page.goto("/auth/register");
  }

  async register(email: string, password: string, confirmPassword: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(confirmPassword);
    await this.submitButton.click();
  }

  async waitForNavigation() {
    await this.page.waitForURL("/", { timeout: 5000 });
  }
}
