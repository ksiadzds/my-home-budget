// src/components/dashboard/UploadDropzone.tsx
import { useState, useRef } from 'react';
import type { UploadValidationError } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { validateFile } from '@/lib/utils/upload.utils';

/**
 * Props dla komponentu UploadDropzone
 */
interface UploadDropzoneProps {
  /**
   * Callback wywoływany po pomyślnej walidacji pliku
   * @param file - Zwalidowany plik (JPEG/PNG, ≤10MB)
   */
  onValidFile: (file: File) => void;
  
  /**
   * Flaga wyłączająca możliwość wyboru pliku
   * @default false
   */
  disabled?: boolean;
}

/**
 * UploadDropzone - komponent do wyboru i walidacji pliku paragonu
 * 
 * @component
 * @description
 * Prosty uploader plików z walidacją po stronie klienta.
 * W wersji MVP używa natywnego input[type="file"] bez drag & drop.
 * 
 * ## Walidacja:
 * - Typ pliku: tylko JPEG i PNG
 * - Rozmiar: maksymalnie 10 MB
 * - Komunikaty błędów z ikonami (dostępność)
 * 
 * ## Dostępność (a11y):
 * - Input ma aria-label
 * - Komunikaty błędów nie polegają tylko na kolorze (ikony + tekst)
 * - Focus states dla przycisku
 * 
 * @example
 * ```tsx
 * <UploadDropzone
 *   onValidFile={(file) => handleUpload(file)}
 *   disabled={isProcessing}
 * />
 * ```
 * 
 * @param {UploadDropzoneProps} props
 * @returns {JSX.Element}
 * 
 * @version 1.0.0 MVP
 * @since 2025-01-21
 */
export function UploadDropzone({ onValidFile, disabled }: UploadDropzoneProps) {
  const [validationError, setValidationError] = useState<UploadValidationError | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Obsługa zmiany pliku w input[type="file"]
   * 
   * @function handleFileChange
   * @description
   * Waliduje wybrany plik i wywołuje callback onValidFile jeśli plik jest prawidłowy.
   * W przypadku błędu walidacji wyświetla komunikat i czyści input.
   * 
   * @param {React.ChangeEvent<HTMLInputElement>} event - Event zmiany inputu
   * @returns {void}
   */
  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    setValidationError(null);
    
    const file = event.target.files?.[0];
    
    if (!file) {
      return;
    }

    const error = validateFile(file);
    
    if (error) {
      setValidationError(error);
      // Wyczyść input
      if (inputRef.current) {
        inputRef.current.value = '';
      }
      return;
    }

    // Plik prawidłowy - przekaż do rodzica
    onValidFile(file);
  }

  /**
   * Obsługa kliknięcia przycisku - trigger input
   */
  function handleButtonClick() {
    inputRef.current?.click();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wgraj paragon</CardTitle>
        <CardDescription>
          Wybierz zdjęcie paragonu w formacie JPEG lub PNG (maksymalnie 10 MB)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Hidden file input */}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleFileChange}
          disabled={disabled}
          className="hidden"
          aria-label="Wybierz plik paragonu"
        />

        {/* Upload button */}
        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
          <svg
            className="w-16 h-16 text-slate-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          
          <Button
            onClick={handleButtonClick}
            disabled={disabled}
            type="button"
            size="lg"
          >
            {disabled ? 'Ładowanie...' : 'Wybierz plik'}
          </Button>
          
          <p className="mt-2 text-sm text-slate-500">
            JPEG lub PNG, maksymalnie 10 MB
          </p>
        </div>

        {/* Błąd walidacji */}
        {validationError && (
          <Alert variant="destructive">
            <div className="flex items-start gap-2">
              <svg
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <AlertDescription className="flex-1">
                <strong className="block mb-1">
                  {validationError.code === 'invalid_type' ? 'Nieprawidłowy typ pliku' : 'Plik za duży'}
                </strong>
                {validationError.message}
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* Informacje pomocnicze */}
        <div className="text-sm text-slate-600 space-y-2">
          <p className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Akceptowane formaty: JPEG, PNG
          </p>
          <p className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Maksymalny rozmiar: 10 MB
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

