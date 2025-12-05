// src/components/dashboard/OcrProcessingPanel.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * OcrProcessingPanel - prezentuje postęp przetwarzania OCR
 *
 * @component
 * @description
 * Komponent wyświetlany podczas przetwarzania OCR (krok "processing" w DashboardView).
 * Prezentuje animowany spinner i komunikat o trwającym przetwarzaniu.
 *
 * ## Wersja MVP:
 * - Tylko prosty loader (bez licznika czasu)
 * - Brak przycisku "Anuluj" (brak AbortController)
 * - Brak informacji o postępie (progress bar)
 *
 * @example
 * ```tsx
 * {step === 'processing' && <OcrProcessingPanel />}
 * ```
 *
 * @returns {JSX.Element}
 *
 * @version 1.0.0 MVP
 * @since 2025-01-21
 */
export function OcrProcessingPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Przetwarzanie paragonu</CardTitle>
        <CardDescription>Proszę czekać, trwa rozpoznawanie tekstu z obrazu...</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-12">
        {/* Animated spinner */}
        <div className="relative w-16 h-16 mb-6">
          <div className="absolute inset-0 border-4 border-slate-200 rounded-full" />
          <div className="absolute inset-0 border-4 border-slate-900 rounded-full animate-spin border-t-transparent" />
        </div>

        <p className="text-slate-600 text-center">Rozpoznajemy produkty i kategorie...</p>
      </CardContent>
    </Card>
  );
}
