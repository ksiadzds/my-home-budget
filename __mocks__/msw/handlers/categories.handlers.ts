import { http, HttpResponse } from "msw";
import type { Category } from "@/types";

/**
 * MSW Handlers dla API kategorii
 * Mockują endpointy dla pobierania kategorii
 */

const BASE_URL = "http://localhost:4321/api";

// Mock data kategorii
const mockCategories: Category[] = [
  { id: "kat-1", nazwa_kategorii: "Zakupy spożywcze" },
  { id: "kat-2", nazwa_kategorii: "Napoje" },
  { id: "kat-3", nazwa_kategorii: "Kosmetyki i przybory toaletowe" },
  { id: "kat-4", nazwa_kategorii: "Środki czystości" },
  { id: "kat-5", nazwa_kategorii: "Słodycze i przekąski" },
];

export const categoriesHandlers = [
  // GET /api/categories - Lista kategorii
  http.get(`${BASE_URL}/categories`, () => {
    return HttpResponse.json({
      data: mockCategories,
    });
  }),
];
