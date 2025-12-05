// src/components/auth/LoginForm.tsx
import { useState, type FormEvent } from "react";
import { loginSchema, getErrorMessage, type LoginFormData } from "@/lib/validations/auth.validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Props dla komponentu LoginForm
 */
interface LoginFormProps {
  /**
   * Callback wywoływany po pomyślnym zalogowaniu
   * Opcjonalny - jeśli nie podany, wykonuje redirect do '/'
   */
  onSuccess?: () => void;
}

/**
 * LoginForm - formularz logowania użytkownika
 *
 * @component
 * @description
 * Komponent formularza logowania z walidacją client-side (Zod),
 * obsługą błędów i stanami loading/error/success.
 *
 * @remarks
 * Po sukcesie logowania wykonuje full page reload (window.location.href)
 * aby odświeżyć sesję SSR w middleware.
 *
 * ## Funkcjonalności:
 * - Walidacja email i hasła (Zod)
 * - Wywołanie POST /api/auth/login
 * - Przyjazne komunikaty błędów po polsku
 * - Stan loading z disabled inputs
 * - Linki do rejestracji i resetu hasła
 *
 * @example
 * ```tsx
 * // Użycie w Astro
 * <LoginForm client:load />
 * ```
 *
 * @version 1.0.0 MVP
 * @since 2025-01-21
 */
export function LoginForm({ onSuccess }: LoginFormProps = {}) {
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({});

  /**
   * Walidacja formularza przed wysłaniem
   */
  function validateForm(): boolean {
    setFieldErrors({});
    setError(null);

    const result = loginSchema.safeParse(formData);

    if (!result.success) {
      const errors: Partial<Record<keyof LoginFormData, string>> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof LoginFormData;
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
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = getErrorMessage(data.error || "Wystąpił błąd");
        setError(message);
        return;
      }

      // Sukces - wywołaj callback lub redirect
      if (onSuccess) {
        onSuccess();
      } else {
        window.location.href = "/";
      }
    } catch (err) {
      setError("Wystąpił błąd połączenia. Spróbuj ponownie.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md shadow-xl border-slate-200">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-slate-900">Zaloguj się</CardTitle>
        <CardDescription className="text-slate-600">Wprowadź swoje dane, aby uzyskać dostęp do konta</CardDescription>
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
              autoComplete="current-password"
            />
            {fieldErrors.password && (
              <p id="password-error" className="text-sm text-red-600" role="alert">
                {fieldErrors.password}
              </p>
            )}
          </div>

          {/* Link do resetu hasła */}
          <div className="text-right">
            <a href="/auth/reset-password" className="text-sm text-slate-600 hover:text-slate-900 underline">
              Zapomniałeś hasła?
            </a>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          {/* Przycisk submit */}
          <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white" disabled={loading}>
            {loading ? "Logowanie..." : "Zaloguj się"}
          </Button>

          {/* Link do rejestracji */}
          <p className="text-sm text-slate-600 text-center">
            Nie masz konta?{" "}
            <a href="/auth/register" className="text-slate-900 font-medium hover:underline">
              Zarejestruj się
            </a>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
