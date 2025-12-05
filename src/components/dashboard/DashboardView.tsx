// src/components/dashboard/DashboardView.tsx
import { useState, useEffect } from "react";
import type { DashboardStep, CategoryDTO, OcrResultViewModel, ReceiptProcessingResponseDTO } from "@/types";
import { UploadDropzone } from "./UploadDropzone";
import { OcrProcessingPanel } from "./OcrProcessingPanel";
import { VerificationList } from "./VerificationList";
import { SummaryPanel } from "./SummaryPanel";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { mapApiResponseToViewModel, recalculateSummary } from "@/lib/utils/dashboard.utils";

/**
 * DashboardView - główny komponent orkiestrujący przepływ Dashboard
 *
 * @component
 * @description
 * Główny kontener widoku Dashboard, który zarządza całym przepływem od uploadu
 * paragonu przez przetwarzanie OCR do prezentacji wyników i zapisu produktów.
 *
 * @remarks
 * Przepływ kroków: `idle → processing → result`
 *
 * ## Odpowiedzialności:
 * - Pobieranie kategorii z API przy montażu komponentu
 * - Obsługa walidacji i uploadu pliku paragonu
 * - Wywołanie API OCR i mapowanie odpowiedzi do ViewModel
 * - Zarządzanie stanem weryfikacji produktów (matched/unmatched)
 * - Auto-zapis produktów niedopasowanych przy wyborze kategorii
 * - Prezentacja błędów dla wszystkich operacji API
 *
 * ## Integracja API:
 * - GET `/api/categories` - pobieranie listy kategorii
 * - POST `/api/receipts/process` - przetwarzanie OCR
 * - POST `/api/products` - zapis nowego produktu
 *
 * ## Stan komponentu:
 * - `step` - aktualny krok przepływu (idle/processing/result)
 * - `categories` - lista kategorii z API
 * - `ocrResult` - wyniki OCR zmapowane do ViewModel
 * - `processing` - flaga przetwarzania OCR
 *
 * @example
 * ```tsx
 * // Użycie w Astro (jako React island)
 * <DashboardView client:load />
 * ```
 *
 * @version 1.0.0 MVP
 * @since 2025-01-21
 */
export function DashboardView() {
  // Stan kroków przepływu
  const [step, setStep] = useState<DashboardStep>("idle");

  // Dane kategorii
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Stan pliku i przetwarzania OCR
  const [file, setFile] = useState<File | null>(null);
  const [_processing, setProcessing] = useState({ running: false });
  const [ocrResult, setOcrResult] = useState<OcrResultViewModel | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);

  // Pobranie kategorii przy montażu komponentu
  useEffect(() => {
    fetchCategories();
  }, []);

  /**
   * Pobiera listę kategorii z API
   *
   * @async
   * @function fetchCategories
   * @description
   * Wywołuje GET `/api/categories` i zapisuje wynik w stanie lokalnym.
   * Ustawia flagę loading i obsługuje błędy.
   *
   * @returns {Promise<void>}
   *
   * @throws {Error} Błąd HTTP lub sieciowy
   */
  async function fetchCategories() {
    setCategoriesLoading(true);
    setCategoriesError(null);

    try {
      const response = await fetch("/api/categories");

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nieznany błąd";
      setCategoriesError(`Nie udało się pobrać kategorii: ${message}`);
      console.error("Error fetching categories:", error);
    } finally {
      setCategoriesLoading(false);
    }
  }

  /**
   * Obsługa wybrania prawidłowego pliku
   *
   * @async
   * @function handleValidFile
   * @description
   * Callback wywoływany przez UploadDropzone po pomyślnej walidacji pliku.
   * Automatycznie rozpoczyna przetwarzanie OCR.
   *
   * @param {File} validFile - Prawidłowy plik JPEG/PNG, zwalidowany przez UploadDropzone
   * @returns {Promise<void>}
   */
  async function handleValidFile(validFile: File) {
    setFile(validFile);
    setOcrError(null);
    await startOcrProcessing(validFile);
  }

  /**
   * Wysyła plik do przetwarzania OCR
   *
   * @async
   * @function startOcrProcessing
   * @description
   * Wywołuje POST `/api/receipts/process` z plikiem jako FormData.
   * Mapuje odpowiedź API (ReceiptProcessingResponseDTO) do OcrResultViewModel.
   * Generuje lokalne UUID dla każdego wiersza produktu.
   *
   * @param {File} fileToProcess - Plik do przetworzenia
   * @returns {Promise<void>}
   *
   * @throws {Error} Błąd HTTP 400/500 lub sieciowy
   *
   * @see {@link ReceiptProcessingResponseDTO}
   * @see {@link OcrResultViewModel}
   */
  async function startOcrProcessing(fileToProcess: File) {
    setStep("processing");
    setProcessing({ running: true });
    setOcrError(null);

    try {
      const formData = new FormData();
      formData.append("receipt", fileToProcess);

      const response = await fetch("/api/receipts/process", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 400) {
          throw new Error("Nieprawidłowy format pliku. Użyj pliku JPEG lub PNG.");
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: ReceiptProcessingResponseDTO = await response.json();

      // Mapowanie odpowiedzi API do modelu widoku
      const viewModel = mapApiResponseToViewModel(data);

      setOcrResult(viewModel);
      setStep("result");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nieznany błąd";
      setOcrError(`Nie udało się przetworzyć paragonu: ${message}`);
      setStep("idle");
    } finally {
      setProcessing({ running: false });
    }
  }

  /**
   * Obsługa zmiany kategorii dla wiersza unmatched
   *
   * @async
   * @function handleRowCategoryChange
   * @description
   * Callback wywoływany przez VerificationList przy zmianie kategorii.
   *
   * **Logika:**
   * - Jeśli produkt nie został jeszcze zapisany → CREATE (POST /api/products)
   * - Jeśli produkt już istnieje (created_product_id) → UPDATE (PUT /api/products/{id})
   *
   * Aktualizuje stan wiersza: isSaving → created_product_id lub error_message.
   * AKTUALIZUJE PODSUMOWANIE po pomyślnym zapisie.
   *
   * @param {string} rowId - Lokalne UUID wiersza (z OcrResultViewModel)
   * @param {string} categoryId - UUID wybranej kategorii
   * @returns {Promise<void>}
   *
   * @throws {Error} Błąd HTTP 400 (duplikat/FK) lub 500
   */
  async function handleRowCategoryChange(rowId: string, categoryId: string) {
    if (!ocrResult) return;

    // Znajdź wiersz i rozpocznij zapis
    const rowIndex = ocrResult.unmatched_rows.findIndex((r) => r.id === rowId);
    if (rowIndex === -1) return;

    const row = ocrResult.unmatched_rows[rowIndex];

    // Ustaw stan "zapisywanie"
    const updatedRows = [...ocrResult.unmatched_rows];
    updatedRows[rowIndex] = {
      ...row,
      selected_category_id: categoryId,
      isSaving: true,
      error_message: undefined,
    };

    setOcrResult({
      ...ocrResult,
      unmatched_rows: updatedRows,
    });

    // Wywołaj API - CREATE lub UPDATE
    try {
      let response: Response;

      if (row.created_product_id) {
        // Produkt już istnieje → UPDATE
        response = await fetch(`/api/products/${row.created_product_id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nazwa_produktu: row.nazwa_produktu,
            kategoria_id: categoryId,
          }),
        });
      } else {
        // Nowy produkt → CREATE
        response = await fetch("/api/products", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nazwa_produktu: row.nazwa_produktu,
            kategoria_id: categoryId,
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Błąd serwera" }));
        // API zwraca { error: "..." } dla 400 lub { message: "..." } dla innych błędów
        const message = errorData.error || errorData.message || `HTTP ${response.status}`;
        throw new Error(message);
      }

      const data = await response.json();

      // Zaktualizuj wiersz po sukcesie
      const successRows = [...ocrResult.unmatched_rows];
      successRows[rowIndex] = {
        ...updatedRows[rowIndex],
        isSaving: false,
        created_product_id: data.product.id,
        error_message: undefined,
      };

      // PRZELICZ PODSUMOWANIE
      const newSummary = recalculateSummary(ocrResult.matched_rows, successRows, categories);

      setOcrResult({
        ...ocrResult,
        unmatched_rows: successRows,
        summary: newSummary, // Zaktualizowane podsumowanie!
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nieznany błąd";

      // Zaktualizuj wiersz po błędzie
      const errorRows = [...ocrResult.unmatched_rows];
      errorRows[rowIndex] = {
        ...updatedRows[rowIndex],
        isSaving: false,
        error_message: `Nie udało się zapisać: ${message}`,
      };

      setOcrResult({
        ...ocrResult,
        unmatched_rows: errorRows,
      });
    }
  }

  /**
   * Resetuje widok do stanu początkowego
   *
   * @function handleReset
   * @description
   * Callback dla przycisku "Wgraj kolejny paragon".
   * Czyści wszystkie dane OCR i wraca do kroku idle.
   *
   * @returns {void}
   */
  function handleReset() {
    setStep("idle");
    setFile(null);
    setOcrResult(null);
    setOcrError(null);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold text-slate-900">Dashboard Budżetu Domowego</h1>
            <a
              href="/products"
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
            >
              Zarządzaj produktami →
            </a>
          </div>
          <p className="text-slate-600">Wgraj paragon, aby automatycznie rozpoznać produkty i kategoryzować wydatki</p>
        </header>

        {/* Błąd pobierania kategorii */}
        {categoriesError && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{categoriesError}</AlertDescription>
          </Alert>
        )}

        {/* Krok: Idle - Upload */}
        {step === "idle" && (
          <div className="space-y-6">
            <UploadDropzone onValidFile={handleValidFile} disabled={categoriesLoading || !!categoriesError} />

            {ocrError && (
              <Alert variant="destructive">
                <AlertDescription>
                  {ocrError}
                  <button
                    onClick={() => file && startOcrProcessing(file)}
                    className="ml-4 underline hover:no-underline"
                  >
                    Spróbuj ponownie
                  </button>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Krok: Processing */}
        {step === "processing" && <OcrProcessingPanel />}

        {/* Krok: Result - Weryfikacja i Podsumowanie */}
        {step === "result" && ocrResult && (
          <div className="space-y-6">
            <VerificationList
              rows={[...ocrResult.matched_rows, ...ocrResult.unmatched_rows]}
              categories={categories}
              onCategoryChange={handleRowCategoryChange}
            />

            <SummaryPanel summary={ocrResult.summary} />

            <div className="flex justify-center">
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                Wgraj kolejny paragon
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
