// src/components/products/ProductsView.tsx

import { useState, useEffect, useCallback } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { SearchInput, ProductsTable, PaginationControls, ConfirmDialog } from "./index";
import { useCategories, useProductsData } from "./hooks";
import type {
  ProductDTO,
  ProductsViewState,
  UpdateProductRequest,
  UpdateProductResponse,
  DeleteProductResponse,
} from "@/types";

/**
 * ProductsView - główny komponent widoku zarządzania produktami
 *
 * @component
 * @description
 * Główny kontener widoku Products, który zarządza przepływem danych,
 * stanem paginacji, sortowania, filtrowania oraz mutacjami (edycja, usunięcie).
 *
 * ## Odpowiedzialności:
 * - Pobieranie kategorii z API przy montażu komponentu
 * - Pobieranie produktów z paginacją, filtrowaniem, sortowaniem
 * - Obsługa inline edycji kategorii produktu (optimistic updates)
 * - Obsługa usuwania produktów z potwierdzeniem
 * - Prezentacja błędów dla wszystkich operacji API
 *
 * ## Integracja API:
 * - GET `/api/categories` - pobieranie listy kategorii
 * - GET `/api/products` - pobieranie paginowanej listy produktów
 * - PUT `/api/products/{id}` - aktualizacja produktu
 * - DELETE `/api/products/{id}` - usunięcie produktu
 *
 * @example
 * ```tsx
 * // Użycie w Astro (jako React island)
 * <ProductsView client:load />
 * ```
 *
 * @version 1.0.0 MVP
 * @since 2025-11-29
 */
export function ProductsView() {
  // Stan widoku
  const [state, setState] = useState<ProductsViewState>({
    products: [],
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      total_pages: 0,
      has_next: false,
      has_prev: false,
    },
    categories: [],
    queryParams: {
      page: 1,
      limit: 20,
      sort: { field: "nazwa_produktu", order: "asc" },
    },
    isLoadingProducts: true,
    isLoadingCategories: true,
    confirmDialog: { open: false },
    isMutating: false,
  });

  // Parametry wyszukiwania dla API
  const [searchParams, setSearchParams] = useState({
    page: 1,
    limit: 20,
    sort: "nazwa_produktu:asc" as string,
    filter: undefined as string | undefined,
  });

  // Custom hooki do pobierania danych
  const { categories, isLoading: isLoadingCategories, error: errorCategories } = useCategories();

  const { data: productsData, isLoading: isLoadingProducts, error: errorProducts } = useProductsData(searchParams);

  // Synchronizacja kategorii ze stanem
  useEffect(() => {
    setState((prev) => ({
      ...prev,
      categories,
      isLoadingCategories,
      errorCategories: errorCategories || undefined,
    }));
  }, [categories, isLoadingCategories, errorCategories]);

  // Synchronizacja produktów ze stanem
  useEffect(() => {
    if (productsData) {
      setState((prev) => ({
        ...prev,
        products: productsData.products,
        pagination: productsData.pagination,
        isLoadingProducts: false,
        errorProducts: undefined,
      }));
    } else if (errorProducts) {
      setState((prev) => ({
        ...prev,
        isLoadingProducts: false,
        errorProducts,
      }));
    }
  }, [productsData, errorProducts]);

  /**
   * Obsługa zmiany wyszukiwania
   *
   * @param {string} searchTerm - Zdebounce'owany termin wyszukiwania
   * @description
   * Aktualizuje parametr filter i resetuje page do 1.
   */
  const handleSearchChange = useCallback((searchTerm: string) => {
    const filter = searchTerm.trim() ? JSON.stringify({ product_name: searchTerm.trim() }) : undefined;

    setSearchParams((prev) => ({
      ...prev,
      page: 1,
      filter,
    }));

    setState((prev) => ({
      ...prev,
      queryParams: {
        ...prev.queryParams,
        page: 1,
        filter: filter ? { product_name: searchTerm.trim() } : undefined,
      },
    }));
  }, []);

  /**
   * Obsługa zmiany strony
   *
   * @param {number} newPage - Numer nowej strony
   * @description
   * Aktualizuje parametr page w stanie.
   */
  const handlePageChange = useCallback((newPage: number) => {
    setSearchParams((prev) => ({
      ...prev,
      page: newPage,
    }));

    setState((prev) => ({
      ...prev,
      queryParams: {
        ...prev.queryParams,
        page: newPage,
      },
    }));
  }, []);

  /**
   * Obsługa zmiany kategorii produktu (inline w tabeli)
   *
   * @async
   * @param {string} productId - UUID produktu
   * @param {string} categoryId - UUID nowej kategorii
   * @description
   * Implementuje optimistic update:
   * 1. Natychmiast aktualizuje UI
   * 2. Wysyła PUT request do API
   * 3. W razie błędu rollback + wyświetlenie komunikatu
   */
  const handleCategoryChange = useCallback(
    async (productId: string, categoryId: string) => {
      // Znajdź produkt
      const product = state.products.find((p) => p.id === productId);
      if (!product) return;

      // Optimistic update
      const previousProducts = [...state.products];
      setState((prev) => ({
        ...prev,
        products: prev.products.map((p) =>
          p.id === productId
            ? {
                ...p,
                kategoria_id: categoryId,
                updated_at: new Date().toISOString(),
              }
            : p
        ),
        isMutating: true,
      }));

      try {
        const requestBody: UpdateProductRequest = {
          nazwa_produktu: product.nazwa_produktu,
          kategoria_id: categoryId,
        };

        const response = await fetch(`/api/products/${productId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
            error: "Błąd serwera",
          }));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const result: UpdateProductResponse = await response.json();

        // Zaktualizuj produkt prawdziwymi danymi z serwera
        setState((prev) => ({
          ...prev,
          products: prev.products.map((p) => (p.id === productId ? result.product : p)),
          isMutating: false,
        }));
      } catch (error) {
        // Rollback optimistic update
        setState((prev) => ({
          ...prev,
          products: previousProducts,
          isMutating: false,
          errorProducts: `Nie udało się zaktualizować produktu: ${
            error instanceof Error ? error.message : "Nieznany błąd"
          }`,
        }));
      }
    },
    [state.products]
  );

  /**
   * Obsługa kliknięcia przycisku Usuń
   *
   * @param {string} productId - UUID produktu do usunięcia
   * @description
   * Otwiera dialog potwierdzenia usunięcia.
   */
  const handleDeleteClick = useCallback(
    (productId: string) => {
      const product = state.products.find((p) => p.id === productId);
      if (!product) return;

      setState((prev) => ({
        ...prev,
        confirmDialog: {
          open: true,
          productId: product.id,
          productName: product.nazwa_produktu,
        },
      }));
    },
    [state.products]
  );

  /**
   * Obsługa potwierdzenia usunięcia produktu
   *
   * @async
   * @description
   * Wysyła DELETE request do API.
   * Po sukcesie:
   * - Usuwa produkt z listy
   * - Jeśli lista pusta i page > 1, przechodzi do poprzedniej strony
   */
  const handleConfirmDelete = useCallback(async () => {
    const { productId } = state.confirmDialog;
    if (!productId) return;

    setState((prev) => ({ ...prev, isMutating: true }));

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Produkt nie został znaleziony");
        }
        const errorData = await response.json().catch(() => ({
          error: "Błąd serwera",
        }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      // Usuń produkt z listy
      const updatedProducts = state.products.filter((p) => p.id !== productId);

      // Sprawdź czy trzeba przejść do poprzedniej strony
      const shouldDecrementPage = updatedProducts.length === 0 && state.pagination.page > 1;

      if (shouldDecrementPage) {
        // Przejdź do poprzedniej strony
        setSearchParams((prev) => ({
          ...prev,
          page: prev.page - 1,
        }));
      }

      setState((prev) => ({
        ...prev,
        products: updatedProducts,
        confirmDialog: { open: false },
        isMutating: false,
        errorProducts: undefined,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isMutating: false,
        errorProducts: `Nie udało się usunąć produktu: ${error instanceof Error ? error.message : "Nieznany błąd"}`,
      }));
    }
  }, [state.confirmDialog, state.products, state.pagination.page]);

  /**
   * Obsługa zamknięcia dialogu potwierdzenia
   */
  const handleDialogClose = useCallback((open: boolean) => {
    if (!open) {
      setState((prev) => ({
        ...prev,
        confirmDialog: { open: false },
      }));
    }
  }, []);

  /**
   * Obsługa czyszczenia błędu produktów
   */
  const handleClearError = useCallback(() => {
    setState((prev) => ({
      ...prev,
      errorProducts: undefined,
    }));
  }, []);

  // Czy kategorie są dostępne (dla wyłączenia CategorySelect)
  const categoriesAvailable = categories.length > 0 && !errorCategories;

  // Wartość wyszukiwania (dla EmptyState)
  const searchTerm = state.queryParams.filter?.product_name || "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Produkty</h1>
          <p className="text-slate-600">Zarządzaj bazą produktów i ich przypisaniem do kategorii</p>
        </header>

        {/* Alert błędu kategorii */}
        {state.errorCategories && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Błąd pobierania kategorii</AlertTitle>
            <AlertDescription>
              {state.errorCategories}
              <br />
              Edycja produktów jest tymczasowo niedostępna.
            </AlertDescription>
          </Alert>
        )}

        {/* Alert błędu produktów */}
        {state.errorProducts && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Błąd</AlertTitle>
            <AlertDescription>
              {state.errorProducts}
              <button onClick={handleClearError} className="ml-4 underline hover:no-underline">
                Zamknij
              </button>
            </AlertDescription>
          </Alert>
        )}

        {/* Search Input */}
        <div className="mb-6">
          <SearchInput
            onSearchChange={handleSearchChange}
            placeholder="Wyszukaj produkt po nazwie..."
            disabled={state.isLoadingProducts}
          />
        </div>

        {/* Tabela produktów */}
        <div className="mb-6">
          <ProductsTable
            products={state.products}
            categories={state.categories}
            isLoading={state.isLoadingProducts}
            onCategoryChange={handleCategoryChange}
            onDeleteClick={handleDeleteClick}
            categoriesAvailable={categoriesAvailable}
            searchTerm={searchTerm}
          />
        </div>

        {/* Paginacja */}
        {state.products.length > 0 && !state.isLoadingProducts && (
          <PaginationControls
            pagination={state.pagination}
            onPageChange={handlePageChange}
            disabled={state.isLoadingProducts || state.isMutating}
          />
        )}

        {/* Dialog potwierdzenia usunięcia */}
        <ConfirmDialog
          open={state.confirmDialog.open}
          onOpenChange={handleDialogClose}
          productName={state.confirmDialog.productName || ""}
          onConfirm={handleConfirmDelete}
          isDeleting={state.isMutating}
        />
      </div>
    </div>
  );
}
