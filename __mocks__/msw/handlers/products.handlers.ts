import { http, HttpResponse } from "msw";
import type { Product } from "@/types";

/**
 * MSW Handlers dla API produktów
 * Mockują endpointy CRUD dla produktów
 */

const BASE_URL = "http://localhost:4321/api";

// Mock data produktów
const mockProducts: Product[] = [
  {
    id: "1",
    nazwa_produktu: "Mleko",
    kategoria_id: "kat-1",
    user_id: "user-1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    nazwa_produktu: "Chleb",
    kategoria_id: "kat-1",
    user_id: "user-1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const productsHandlers = [
  // GET /api/products - Lista produktów
  http.get(`${BASE_URL}/products`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");

    return HttpResponse.json({
      data: mockProducts,
      pagination: {
        page,
        limit,
        total: mockProducts.length,
        totalPages: Math.ceil(mockProducts.length / limit),
      },
    });
  }),

  // GET /api/products/:id - Pojedynczy produkt
  http.get(`${BASE_URL}/products/:id`, ({ params }) => {
    const product = mockProducts.find((p) => p.id === params.id);

    if (!product) {
      return HttpResponse.json({ error: "Produkt nie został znaleziony" }, { status: 404 });
    }

    return HttpResponse.json({ data: product });
  }),

  // POST /api/products - Utworzenie produktu
  http.post(`${BASE_URL}/products`, async ({ request }) => {
    const body = await request.json();

    const newProduct: Product = {
      id: String(mockProducts.length + 1),
      ...(body as Omit<Product, "id">),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockProducts.push(newProduct);

    return HttpResponse.json({ data: newProduct }, { status: 201 });
  }),

  // PUT /api/products/:id - Aktualizacja produktu
  http.put(`${BASE_URL}/products/:id`, async ({ params, request }) => {
    const body = await request.json();
    const index = mockProducts.findIndex((p) => p.id === params.id);

    if (index === -1) {
      return HttpResponse.json({ error: "Produkt nie został znaleziony" }, { status: 404 });
    }

    mockProducts[index] = {
      ...mockProducts[index],
      ...(body as Partial<Product>),
      updated_at: new Date().toISOString(),
    };

    return HttpResponse.json({ data: mockProducts[index] });
  }),

  // DELETE /api/products/:id - Usunięcie produktu
  http.delete(`${BASE_URL}/products/:id`, ({ params }) => {
    const index = mockProducts.findIndex((p) => p.id === params.id);

    if (index === -1) {
      return HttpResponse.json({ error: "Produkt nie został znaleziony" }, { status: 404 });
    }

    mockProducts.splice(index, 1);

    return HttpResponse.json({ message: "Produkt został usunięty" }, { status: 200 });
  }),
];
