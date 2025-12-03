import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { ProductsPage } from '../pages/ProductsPage';

/**
 * Fixtures dla testów Playwright
 * Zapewniają gotowe instancje Page Objects
 */

type Fixtures = {
  loginPage: LoginPage;
  registerPage: RegisterPage;
  productsPage: ProductsPage;
};

/**
 * Rozszerzony test z dostępem do Page Objects
 */
export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  registerPage: async ({ page }, use) => {
    const registerPage = new RegisterPage(page);
    await use(registerPage);
  },

  productsPage: async ({ page }, use) => {
    const productsPage = new ProductsPage(page);
    await use(productsPage);
  },
});

export { expect } from '@playwright/test';

