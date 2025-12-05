// src/components/auth/ResetPasswordForm.tsx
import { useState, useEffect, type FormEvent } from "react";
import {
  resetPasswordRequestSchema,
  resetPasswordConfirmSchema,
  getErrorMessage,
  type ResetPasswordRequestData,
  type ResetPasswordConfirmData,
} from "@/lib/validations/auth.validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * ResetPasswordForm - formularz resetowania hasła (dwu-etapowy)
 *
 * @component
 * @description
 * Komponent obsługujący cały przepływ resetowania hasła:
 * 1. Widok żądania linku (podanie emaila)
 * 2. Widok ustawienia nowego hasła (po kliknięciu w link z maila)
 *
 * @remarks
 * Komponent automatycznie wykrywa obecność parametru `code` w URL
 * i na tej podstawie wyświetla odpowiedni widok.
 *
 * ## Funkcjonalności:
 *
 * ### Krok 1 - Żądanie linku:
 * - Walidacja email (Zod)
 * - Wywołanie POST /api/auth/reset-password (action: 'request')
 * - Komunikat sukcesu (bez ujawniania istnienia konta)
 *
 * ### Krok 2 - Nowe hasło:
 * - Walidacja hasła i potwierdzenia hasła (Zod)
 * - Wywołanie POST /api/auth/reset-password (action: 'confirm')
 * - Redirect do /auth/login?reset=success po sukcesie
 *
 * @example
 * ```tsx
 * // Użycie w Astro
 * <ResetPasswordForm client:load />
 * ```
 *
 * @version 1.0.0 MVP
 * @since 2025-01-21
 */
export function ResetPasswordForm() {
  // Wykrycie trybu na podstawie URL
  const [mode, setMode] = useState<"request" | "confirm">("request");

  // Stan formularza - krok 1 (żądanie linku)
  const [requestData, setRequestData] = useState<ResetPasswordRequestData>({
    email: "",
  });

  // Stan formularza - krok 2 (nowe hasło)
  const [confirmData, setConfirmData] = useState<ResetPasswordConfirmData>({
    code: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Wykryj obecność kodu w URL przy montażu
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get("code");

    if (codeParam) {
      setMode("confirm");
      setConfirmData((prev) => ({ ...prev, code: codeParam }));
    }
  }, []);

  /**
   * Walidacja formularza żądania linku
   */
  function validateRequestForm(): boolean {
    setFieldErrors({});
    setError(null);
    setSuccess(null);

    const result = resetPasswordRequestSchema.safeParse(requestData);

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        errors[field] = err.message;
      });
      setFieldErrors(errors);
      return false;
    }

    return true;
  }

  /**
   * Walidacja formularza potwierdzenia hasła
   */
  function validateConfirmForm(): boolean {
    setFieldErrors({});
    setError(null);
    setSuccess(null);

    const result = resetPasswordConfirmSchema.safeParse(confirmData);

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        errors[field] = err.message;
      });
      setFieldErrors(errors);
      return false;
    }

    return true;
  }

  /**
   * Obsługa żądania linku resetowania
   */
  async function handleRequestSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!validateRequestForm()) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request",
          email: requestData.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = getErrorMessage(data.error || "Wystąpił błąd");
        setError(message);
        return;
      }

      // Sukces - wyświetl komunikat (bez ujawniania istnienia konta)
      setSuccess(
        "Jeśli podany adres email istnieje w naszej bazie, wysłaliśmy link do resetowania hasła. Sprawdź swoją skrzynkę pocztową."
      );
      setRequestData({ email: "" });
    } catch (err) {
      setError("Wystąpił błąd połączenia. Spróbuj ponownie.");
      console.error("Reset password request error:", err);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Obsługa ustawienia nowego hasła
   */
  async function handleConfirmSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!validateConfirmForm()) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "confirm",
          code: confirmData.code,
          password: confirmData.password,
          confirmPassword: confirmData.confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = getErrorMessage(data.error || "Wystąpił błąd");
        setError(message);
        return;
      }

      // Sukces - redirect do logowania
      window.location.href = "/auth/login?reset=success";
    } catch (err) {
      setError("Wystąpił błąd połączenia. Spróbuj ponownie.");
      console.error("Reset password confirm error:", err);
    } finally {
      setLoading(false);
    }
  }

  // Widok 1: Żądanie linku resetowania
  if (mode === "request") {
    return (
      <Card className="w-full max-w-md shadow-xl border-slate-200">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-slate-900">Resetuj hasło</CardTitle>
          <CardDescription className="text-slate-600">
            Podaj swój adres email, a wyślemy Ci link do zresetowania hasła
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleRequestSubmit}>
          <CardContent className="space-y-4">
            {/* Komunikat sukcesu */}
            {success && (
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            {/* Globalny błąd */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-700">
                Adres email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="jan.kowalski@example.com"
                value={requestData.email}
                onChange={(e) => setRequestData({ email: e.target.value })}
                disabled={loading}
                className={fieldErrors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
                aria-invalid={!!fieldErrors.email}
                aria-describedby={fieldErrors.email ? "email-error" : undefined}
                autoComplete="email"
              />
              {fieldErrors.email && (
                <p id="email-error" className="text-sm text-red-600" role="alert">
                  {fieldErrors.email}
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            {/* Przycisk submit */}
            <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white" disabled={loading}>
              {loading ? "Wysyłanie..." : "Wyślij link resetujący"}
            </Button>

            {/* Link powrotu do logowania */}
            <p className="text-sm text-slate-600 text-center">
              Pamiętasz hasło?{" "}
              <a href="/auth/login" className="text-slate-900 font-medium hover:underline">
                Zaloguj się
              </a>
            </p>
          </CardFooter>
        </form>
      </Card>
    );
  }

  // Widok 2: Ustawienie nowego hasła
  return (
    <Card className="w-full max-w-md shadow-xl border-slate-200">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-slate-900">Ustaw nowe hasło</CardTitle>
        <CardDescription className="text-slate-600">Wprowadź nowe hasło dla swojego konta</CardDescription>
      </CardHeader>

      <form onSubmit={handleConfirmSubmit}>
        <CardContent className="space-y-4">
          {/* Globalny błąd */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Nowe hasło */}
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              Nowe hasło
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={confirmData.password}
              onChange={(e) => setConfirmData({ ...confirmData, password: e.target.value })}
              disabled={loading}
              className={fieldErrors.password ? "border-red-500 focus-visible:ring-red-500" : ""}
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? "password-error" : undefined}
              autoComplete="new-password"
            />
            {fieldErrors.password && (
              <p id="password-error" className="text-sm text-red-600" role="alert">
                {fieldErrors.password}
              </p>
            )}
            <p className="text-xs text-slate-500">Hasło musi mieć minimum 8 znaków</p>
          </div>

          {/* Potwierdzenie hasła */}
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
              Potwierdź hasło
            </label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmData.confirmPassword}
              onChange={(e) => setConfirmData({ ...confirmData, confirmPassword: e.target.value })}
              disabled={loading}
              className={fieldErrors.confirmPassword ? "border-red-500 focus-visible:ring-red-500" : ""}
              aria-invalid={!!fieldErrors.confirmPassword}
              aria-describedby={fieldErrors.confirmPassword ? "confirmPassword-error" : undefined}
              autoComplete="new-password"
            />
            {fieldErrors.confirmPassword && (
              <p id="confirmPassword-error" className="text-sm text-red-600" role="alert">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          {/* Przycisk submit */}
          <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white" disabled={loading}>
            {loading ? "Zapisywanie..." : "Zapisz nowe hasło"}
          </Button>

          {/* Link powrotu do logowania */}
          <p className="text-sm text-slate-600 text-center">
            <a href="/auth/login" className="text-slate-900 font-medium hover:underline">
              Powrót do logowania
            </a>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
