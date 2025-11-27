import { useState } from 'react';
import { Button } from '@/components/ui/button';

/**
 * LogoutButton - przycisk wylogowania użytkownika
 * 
 * @component
 * @description
 * Komponent przycisku wylogowania z obsługą stanu loading.
 * Wywołuje POST /api/auth/logout i przekierowuje do strony logowania.
 * 
 * @remarks
 * Po sukcesie wylogowania wykonuje full page reload (window.location.href)
 * aby wyczyścić sesję SSR w middleware.
 * 
 * ## Funkcjonalności:
 * - Wywołanie POST /api/auth/logout
 * - Stan loading z disabled button
 * - Automatyczny redirect do /auth/login po sukcesie
 * - Obsługa błędów
 * 
 * @example
 * ```tsx
 * // Użycie w Astro Layout
 * <LogoutButton client:load />
 * ```
 * 
 * @version 1.0.0 MVP
 * @since 2025-11-27
 */
export function LogoutButton() {
  const [loading, setLoading] = useState(false);

  /**
   * Obsługa wylogowania
   */
  async function handleLogout() {
    setLoading(true);

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('Błąd wylogowania:', data.error);
        // Mimo błędu przekieruj do logowania
        // (użytkownik może mieć nieważną sesję)
        window.location.href = '/auth/login';
        return;
      }

      // Sukces - przekieruj do strony logowania
      // Używamy window.location.href dla pełnego przeładowania i odświeżenia SSR
      window.location.href = '/auth/login';
    } catch (err) {
      console.error('Nieoczekiwany błąd wylogowania:', err);
      // W przypadku błędu sieciowego również przekieruj
      window.location.href = '/auth/login';
    }
  }

  return (
    <Button
      onClick={handleLogout}
      disabled={loading}
      variant="outline"
      size="sm"
      className="hover:bg-slate-100 dark:hover:bg-slate-800"
    >
      {loading ? 'Wylogowywanie...' : 'Wyloguj się'}
    </Button>
  );
}

