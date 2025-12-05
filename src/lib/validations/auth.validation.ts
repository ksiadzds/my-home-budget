import { z } from "zod";

/**
 * Schemat walidacji dla formularza logowania
 *
 * @description
 * Waliduje dane logowania użytkownika:
 * - email: musi być prawidłowym adresem email
 * - password: minimalnie 8 znaków
 */
export const loginSchema = z.object({
  email: z.string().email("Podaj poprawny adres email"),
  password: z.string().min(8, "Hasło musi mieć min. 8 znaków"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Schemat walidacji dla formularza rejestracji
 *
 * @description
 * Waliduje dane rejestracji nowego użytkownika:
 * - email: musi być prawidłowym adresem email
 * - password: minimalnie 8 znaków
 * - confirmPassword: musi być zgodne z password
 */
export const registerSchema = z
  .object({
    email: z.string().email("Podaj poprawny adres email"),
    password: z.string().min(8, "Hasło musi mieć min. 8 znaków"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła muszą być identyczne",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * Schemat walidacji dla API rejestracji (server-side)
 *
 * @description
 * Uproszczona wersja registerSchema dla API - bez confirmPassword.
 * Potwierdzenie hasła jest walidowane tylko client-side (UX).
 * Server nie potrzebuje tego pola do utworzenia konta.
 */
export const registerApiSchema = z.object({
  email: z.string().email("Podaj poprawny adres email"),
  password: z.string().min(8, "Hasło musi mieć min. 8 znaków"),
});

export type RegisterApiData = z.infer<typeof registerApiSchema>;

/**
 * Schemat walidacji dla żądania linku resetowania hasła
 *
 * @description
 * Waliduje email dla funkcji "Zapomniałem hasła"
 */
export const resetPasswordRequestSchema = z.object({
  email: z.string().email("Podaj poprawny adres email"),
});

export type ResetPasswordRequestData = z.infer<typeof resetPasswordRequestSchema>;

/**
 * Schemat walidacji dla potwierdzenia nowego hasła
 *
 * @description
 * Waliduje dane przy ustawianiu nowego hasła (z linku w emailu):
 * - code: token z URL (wymagany)
 * - password: minimalnie 8 znaków
 * - confirmPassword: musi być zgodne z password
 */
export const resetPasswordConfirmSchema = z
  .object({
    code: z.string().min(1, "Kod jest wymagany"),
    password: z.string().min(8, "Hasło musi mieć min. 8 znaków"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła muszą być identyczne",
    path: ["confirmPassword"],
  });

export type ResetPasswordConfirmData = z.infer<typeof resetPasswordConfirmSchema>;

/**
 * Mapowanie błędów Supabase na przyjazne komunikaty po polsku
 *
 * @description
 * Centralna mapa do tłumaczenia błędów API na komunikaty użytkownika
 */
export const errorMessages: Record<string, string> = {
  "Invalid login credentials": "Nieprawidłowy email lub hasło",
  "User already registered": "Konto z tym adresem email już istnieje",
  "Email not confirmed": "Potwierdź swój adres email",
  "Password should be at least 6 characters": "Hasło musi mieć min. 6 znaków",
  "Unable to validate email address: invalid format": "Nieprawidłowy format adresu email",
  Unauthorized: "Brak autoryzacji",
  "Network error": "Błąd połączenia z serwerem",
};

/**
 * Funkcja pomocnicza do mapowania błędów
 *
 * @param errorMessage - Wiadomość błędu z API
 * @returns Przyjazny komunikat po polsku
 */
export function getErrorMessage(errorMessage: string): string {
  return errorMessages[errorMessage] || errorMessage;
}
