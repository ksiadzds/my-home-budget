import { authHandlers } from "./handlers/auth.handlers";
import { productsHandlers } from "./handlers/products.handlers";
import { categoriesHandlers } from "./handlers/categories.handlers";

/**
 * Zbiera wszystkie handlery MSW
 */
export const handlers = [...authHandlers, ...productsHandlers, ...categoriesHandlers];
