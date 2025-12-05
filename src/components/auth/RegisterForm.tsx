// src/components/auth/RegisterForm.tsx
import { useState, type FormEvent } from "react";
import { registerSchema, getErrorMessage, type RegisterFormData } from "@/lib/validations/auth.validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * RegisterForm - formularz rejestracji nowego użytkownika
 *
 * @component
 * @description
 * Komponent formularza rejestracji z walidacją client-side (Zod),
 * potwierdzeniem hasła i obsługą błędów.
 *
 * @remarks
 * Po sukcesie rejestracji użytkownik jest automatycznie logowany
 * i przekierowywany na dashboard (zgodnie z US-001).
 *
 * ## Funkcjonalności:
 * - Walidacja email, hasła i potwierdzenia hasła (Zod)
 * - Wywołanie POST /api/auth/register
 * - Auto-login po sukcesie rejestracji
 * - Przyjazne komunikaty błędów po polsku
 * - Stan loading z disabled inputs
 * - Link do logowania dla użytkowników z kontem
 *
 * @example
 * ```tsx
 * // Użycie w Astro
 * <RegisterForm client:load />
 * ```
 *
 * @version 1.0.0 MVP
 * @since 2025-01-21
 */
export function RegisterForm() {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({});

  /**
   * Walidacja formularza przed wysłaniem
   */
  function validateForm(): boolean {
    setFieldErrors({});
    setError(null);

    const result = registerSchema.safeParse(formData);

    if (!result.success) {
      const errors: Partial<Record<keyof RegisterFormData, string>> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof RegisterFormData;
        errors[field] = err.message;
      });
      setFieldErrors(errors);
      return false;
    }

    return true;
  }

  /**
   * Obsługa wysłania formularza
   */
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = getErrorMessage(data.error || "Wystąpił błąd");
        setError(message);
        return;
      }

      // Sukces - auto-login i redirect do dashboard
      window.location.href = "/";
    } catch (err) {
      setError("Wystąpił błąd połączenia. Spróbuj ponownie.");
      console.error("Registration error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md shadow-xl border-slate-200">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-slate-900">Utwórz konto</CardTitle>
        <CardDescription className="text-slate-600">Wprowadź swoje dane, aby założyć nowe konto</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
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
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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

          {/* Hasło */}
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              Hasło
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
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
            {loading ? "Tworzenie konta..." : "Zarejestruj się"}
          </Button>

          {/* Link do logowania */}
          <p className="text-sm text-slate-600 text-center">
            Masz już konto?{" "}
            <a href="/auth/login" className="text-slate-900 font-medium hover:underline">
              Zaloguj się
            </a>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
