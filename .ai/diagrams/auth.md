# Diagram architektury autentykacji - HomeBudget OCR

## Wprowadzenie

Ten diagram przedstawia sekwencję przepływu autentykacji w aplikacji HomeBudget OCR, wykorzystującej Astro SSR, React i Supabase Auth. Diagram obejmuje pełny cykl życia sesji użytkownika.

## Sekwencja autentykacji

<mermaid_diagram>

```mermaid
sequenceDiagram
    autonumber
    
    participant Browser as Przeglądarka
    participant Middleware as Middleware Astro
    participant AstroAPI as Astro API
    participant SupabaseAuth as Supabase Auth
    
    Note over Browser,SupabaseAuth: REJESTRACJA NOWEGO UŻYTKOWNIKA (US-001)
    
    Browser->>Browser: Wypełnienie RegisterForm
    activate Browser
    Browser->>Browser: Walidacja client-side (Zod)
    Browser->>AstroAPI: POST /api/auth/register
    deactivate Browser
    Note right of Browser: Body: email, password
    
    activate AstroAPI
    AstroAPI->>AstroAPI: createSupabaseServerInstance()
    AstroAPI->>SupabaseAuth: auth.signUp(email, password)
    activate SupabaseAuth
    
    alt Email już zajęty
        SupabaseAuth-->>AstroAPI: Error: User already registered
        AstroAPI-->>Browser: 400 Bad Request
        Browser->>Browser: Wyświetl błąd
    else Rejestracja pomyślna
        SupabaseAuth-->>AstroAPI: Success: user + session
        deactivate SupabaseAuth
        AstroAPI->>AstroAPI: Ustawienie cookies (HttpOnly, Secure)
        Note right of AstroAPI: setAll() z @supabase/ssr
        AstroAPI-->>Browser: 200 OK + user data
        deactivate AstroAPI
        Browser->>Browser: window.location.href = '/'
        Note right of Browser: Pełne przeładowanie dla SSR
    end
    
    Note over Browser,SupabaseAuth: LOGOWANIE UŻYTKOWNIKA (US-002)
    
    Browser->>Browser: Wypełnienie LoginForm
    activate Browser
    Browser->>Browser: Walidacja client-side (Zod)
    Browser->>AstroAPI: POST /api/auth/login
    deactivate Browser
    Note right of Browser: Body: email, password
    
    activate AstroAPI
    AstroAPI->>AstroAPI: createSupabaseServerInstance()
    AstroAPI->>SupabaseAuth: auth.signInWithPassword()
    activate SupabaseAuth
    
    alt Błędne dane logowania
        SupabaseAuth-->>AstroAPI: Error: Invalid credentials
        AstroAPI-->>Browser: 400 Bad Request
        Browser->>Browser: Wyświetl błąd
    else Logowanie pomyślne
        SupabaseAuth-->>AstroAPI: Success: user + session
        deactivate SupabaseAuth
        AstroAPI->>AstroAPI: Ustawienie cookies (HttpOnly, Secure)
        AstroAPI-->>Browser: 200 OK + user data
        deactivate AstroAPI
        Browser->>Browser: window.location.href = '/'
    end
    
    Note over Browser,SupabaseAuth: WERYFIKACJA SESJI (każdy request)
    
    Browser->>Middleware: GET / (chroniona trasa)
    activate Middleware
    Middleware->>Middleware: Sprawdzenie PUBLIC_PATHS
    Note right of Middleware: Pomijamy /auth/*, /api/auth/*
    Middleware->>Middleware: createSupabaseServerInstance()
    Note right of Middleware: getAll() cookies z headers
    
    Middleware->>SupabaseAuth: auth.getUser()
    activate SupabaseAuth
    Note right of Middleware: ZAWSZE getUser(), NIE getSession()
    
    alt Token ważny
        SupabaseAuth-->>Middleware: Success: user data
        deactivate SupabaseAuth
        Middleware->>Middleware: locals.user = user data
        Note right of Middleware: Ustawienie email, id
        Middleware->>Browser: Renderowanie strony
        deactivate Middleware
        Note right of Browser: Dostęp do Astro.locals.user
    else Token wygasł lub nieprawidłowy
        SupabaseAuth-->>Middleware: Error: Invalid token
        Middleware->>Middleware: Sprawdzenie możliwości odświeżenia
        
        alt Token można odświeżić
            Middleware->>SupabaseAuth: Automatyczne odświeżenie
            activate SupabaseAuth
            SupabaseAuth-->>Middleware: Nowy access token
            deactivate SupabaseAuth
            Middleware->>Middleware: setAll() nowe cookies
            Middleware->>Middleware: locals.user = user data
            Middleware->>Browser: Renderowanie strony
            deactivate Middleware
        else Sesja wygasła całkowicie
            Middleware-->>Browser: Redirect /auth/login?redirectTo=/
            deactivate Middleware
            Note right of Browser: Użytkownik musi się zalogować ponownie
        end
    end
    
    Note over Browser,SupabaseAuth: CHRONIONY REQUEST API
    
    Browser->>AstroAPI: POST /api/products
    activate Browser
    Note right of Browser: Middleware już wykonany
    deactivate Browser
    activate AstroAPI
    AstroAPI->>AstroAPI: Odczyt locals.user
    
    alt Użytkownik zalogowany
        AstroAPI->>AstroAPI: userId = locals.user.id
        AstroAPI->>AstroAPI: Logika biznesowa
        AstroAPI-->>Browser: 200 OK + data
        deactivate AstroAPI
    else Brak użytkownika (nie powinno się zdarzyć)
        AstroAPI-->>Browser: 401 Unauthorized
        deactivate AstroAPI
        Browser->>Browser: Czyszczenie lokalne + redirect
    end
    
    Note over Browser,SupabaseAuth: WYLOGOWANIE
    
    Browser->>AstroAPI: POST /api/auth/logout
    activate AstroAPI
    AstroAPI->>AstroAPI: createSupabaseServerInstance()
    AstroAPI->>SupabaseAuth: auth.signOut()
    activate SupabaseAuth
    SupabaseAuth-->>AstroAPI: Success
    deactivate SupabaseAuth
    AstroAPI->>AstroAPI: Czyszczenie cookies
    Note right of AstroAPI: setAll() pustych wartości
    AstroAPI-->>Browser: 200 OK
    deactivate AstroAPI
    Browser->>Browser: window.location.href = '/auth/login'
    
    Note over Browser,SupabaseAuth: RESET HASŁA - KROK 1 (żądanie linku)
    
    Browser->>Browser: Wypełnienie ResetPasswordForm
    activate Browser
    Browser->>AstroAPI: POST /api/auth/reset-password
    deactivate Browser
    Note right of Browser: Body: email, action: 'request'
    
    activate AstroAPI
    AstroAPI->>AstroAPI: createSupabaseServerInstance()
    AstroAPI->>SupabaseAuth: auth.resetPasswordForEmail()
    activate SupabaseAuth
    Note right of SupabaseAuth: redirectTo: /auth/reset-password
    SupabaseAuth->>SupabaseAuth: Wysłanie emaila z linkiem
    SupabaseAuth-->>AstroAPI: Success
    deactivate SupabaseAuth
    AstroAPI-->>Browser: 200 OK
    deactivate AstroAPI
    Browser->>Browser: Wyświetl komunikat
    Note right of Browser: Nie ujawniamy czy email istnieje
    
    Note over Browser,SupabaseAuth: RESET HASŁA - KROK 2 (nowe hasło)
    
    Browser->>Browser: Kliknięcie linku z emaila
    Note right of Browser: URL: /auth/reset-password?code=xyz
    Browser->>Browser: Wypełnienie nowego hasła
    activate Browser
    Browser->>AstroAPI: POST /api/auth/reset-password
    deactivate Browser
    Note right of Browser: Body: code, password, action: 'confirm'
    
    activate AstroAPI
    AstroAPI->>AstroAPI: createSupabaseServerInstance()
    AstroAPI->>SupabaseAuth: auth.exchangeCodeForSession(code)
    activate SupabaseAuth
    
    alt Code nieprawidłowy lub wygasł
        SupabaseAuth-->>AstroAPI: Error: Invalid code
        AstroAPI-->>Browser: 400 Bad Request
        Browser->>Browser: Wyświetl błąd
    else Code poprawny
        SupabaseAuth-->>AstroAPI: Success: session
        AstroAPI->>SupabaseAuth: auth.updateUser(password)
        SupabaseAuth-->>AstroAPI: Success
        deactivate SupabaseAuth
        AstroAPI-->>Browser: 200 OK
        deactivate AstroAPI
        Browser->>Browser: Redirect /auth/login?reset=success
        Note right of Browser: Komunikat sukcesu, możliwość logowania
    end
```

</mermaid_diagram>

## Szczegóły przepływów

### 1. Rejestracja (US-001)

**Aktorzy:** Przeglądarka → Astro API → Supabase Auth

**Kroki:**
1. Użytkownik wypełnia `RegisterForm.tsx` (email, password, confirmPassword)
2. Walidacja client-side przez Zod (min. 8 znaków, zgodność haseł)
3. `POST /api/auth/register` z body `{ email, password }`
4. API tworzy per-request Supabase client: `createSupabaseServerInstance()`
5. Wywołanie `supabase.auth.signUp({ email, password })`
6. Supabase Auth:
   - Sprawdza unikalność emaila
   - Tworzy konto w `auth.users`
   - Zwraca `user` + `session` (access_token, refresh_token)
7. API ustawia cookies przez `setAll()` z `@supabase/ssr`:
   - `sb-access-token` (HttpOnly, Secure, SameSite: lax)
   - `sb-refresh-token` (HttpOnly, Secure, SameSite: lax)
8. Zwrot `200 OK` z danymi użytkownika
9. Przeglądarka wykonuje `window.location.href = '/'` (pełne przeładowanie SSR)
10. Middleware przy kolejnym requeście odczyta cookies i ustawi `locals.user`

**Alternatywne ścieżki:**
- Email zajęty → `400 Bad Request` → komunikat "Konto z tym adresem już istnieje"
- Błąd walidacji → komunikat przy polu, nie wysyłamy requestu

**Bezpieczeństwo:**
- Hasło przesyłane przez HTTPS
- Cookie HttpOnly (JavaScript nie ma dostępu)
- Supabase hashuje hasło (bcrypt)

### 2. Logowanie (US-002)

**Aktorzy:** Przeglądarka → Astro API → Supabase Auth

**Kroki:**
1. Użytkownik wypełnia `LoginForm.tsx` (email, password)
2. Walidacja client-side przez Zod
3. `POST /api/auth/login` z body `{ email, password }`
4. API tworzy per-request Supabase client
5. Wywołanie `supabase.auth.signInWithPassword({ email, password })`
6. Supabase Auth:
   - Weryfikacja hasła
   - Generowanie access_token i refresh_token
   - Zwrot `user` + `session`
7. API ustawia cookies przez `setAll()`
8. Zwrot `200 OK` z danymi użytkownika
9. Przeglądarka wykonuje `window.location.href = '/'`

**Alternatywne ścieżki:**
- Błędne dane → `400 Bad Request` → "Nieprawidłowy email lub hasło"
- Zapomniałeś hasła? → link do `/auth/reset-password`

**Bezpieczeństwo:**
- Nie ujawniamy czy email istnieje (generic error message)
- Rate limiting (Supabase Auth wbudowany)

### 3. Weryfikacja sesji (Middleware, każdy request)

**Aktorzy:** Przeglądarka → Middleware → Supabase Auth

**Kroki:**
1. Każdy request przechodzi przez middleware (`src/middleware/index.ts`)
2. Middleware sprawdza `PUBLIC_PATHS` (pomija `/auth/*`, `/api/auth/*`)
3. Utworzenie per-request Supabase client:
   ```typescript
   createSupabaseServerInstance({
     cookies: context.cookies,
     headers: request.headers
   })
   ```
4. **WAŻNE:** Wywołanie `auth.getUser()` (NIE `getSession()`)
   - `getUser()` weryfikuje token na serwerze Supabase
   - `getSession()` tylko odczytuje lokalnie (podatne na ataki)
5. Supabase Auth sprawdza:
   - Czy access_token jest ważny
   - Czy nie wygasł (domyślnie 1h)
   - Jeśli wygasł: próba odświeżenia przez refresh_token
6. Wyniki:
   - **Token ważny:** zwrot `user` → middleware ustawia `locals.user = { email, id }`
   - **Token wygasł, ale refresh możliwy:** automatyczne odświeżenie → nowe cookies → `locals.user`
   - **Sesja całkowicie wygasła:** `user = null` → redirect `/auth/login?redirectTo=...`
7. Dla zalogowanych: renderowanie strony z dostępem do `Astro.locals.user`

**Odświeżanie tokenu:**
- Automatyczne przez `@supabase/ssr`
- Używa `getAll()` i `setAll()` dla cookies
- Transparentne dla użytkownika
- Refresh token ważny 60 dni (domyślnie)

**Publiczne ścieżki:**
```typescript
const PUBLIC_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/reset-password',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/reset-password',
  '/api/auth/logout',
];
```

### 4. Chronione API endpoints

**Aktorzy:** Przeglądarka → Astro API (po middleware)

**Kroki:**
1. Request do np. `POST /api/products`
2. Middleware już wykonany → `locals.user` ustawiony lub null
3. Endpoint sprawdza `locals.user?.id`:
   ```typescript
   const userId = locals.user?.id;
   if (!userId) {
     return new Response(JSON.stringify({ error: 'Unauthorized' }), {
       status: 401
     });
   }
   ```
4. Logika biznesowa z użyciem `userId`
5. Zwrot odpowiedzi

**Uwaga:** Middleware dla API endpoints działa tak samo jak dla stron

### 5. Wylogowanie

**Aktorzy:** Przeglądarka → Astro API → Supabase Auth

**Kroki:**
1. Kliknięcie przycisku "Wyloguj" w nawigacji
2. `POST /api/auth/logout`
3. API tworzy per-request Supabase client
4. Wywołanie `supabase.auth.signOut()`
5. Supabase Auth:
   - Unieważnienie access_token
   - Usunięcie sesji z bazy
6. API czyści cookies przez `setAll()` (puste wartości)
7. Zwrot `200 OK`
8. Przeglądarka wykonuje redirect `/auth/login`

### 6. Reset hasła

**Krok 1 - Żądanie linku:**

**Aktorzy:** Przeglądarka → Astro API → Supabase Auth → Email

**Kroki:**
1. Użytkownik wypełnia `ResetPasswordForm.tsx` (widok 1: email)
2. `POST /api/auth/reset-password` z body `{ email, action: 'request' }`
3. API tworzy per-request Supabase client
4. Wywołanie:
   ```typescript
   supabase.auth.resetPasswordForEmail(email, {
     redirectTo: `${origin}/auth/reset-password`
   })
   ```
5. Supabase Auth wysyła email z linkiem zawierającym code
6. Zwrot `200 OK` (zawsze, nie ujawniamy czy email istnieje)
7. Komunikat: "Jeśli email istnieje, wysłaliśmy link do resetowania hasła"

**Krok 2 - Ustawienie nowego hasła:**

**Aktorzy:** Przeglądarka → Astro API → Supabase Auth

**Kroki:**
1. Użytkownik klika link z emaila → `/auth/reset-password?code=xyz`
2. `ResetPasswordForm.tsx` wykrywa `code` w URL → wyświetla widok 2
3. Wypełnienie formularza: nowe hasło, potwierdzenie
4. `POST /api/auth/reset-password` z body `{ code, password, action: 'confirm' }`
5. API tworzy per-request Supabase client
6. Wywołanie `supabase.auth.exchangeCodeForSession(code)`:
   - Weryfikacja code
   - Utworzenie tymczasowej sesji
7. Wywołanie `supabase.auth.updateUser({ password })`:
   - Aktualizacja hasła w bazie
   - Hashowanie nowego hasła
8. Zwrot `200 OK`
9. Redirect `/auth/login?reset=success` → komunikat sukcesu

**Alternatywne ścieżki:**
- Code nieprawidłowy/wygasły → `400 Bad Request` → komunikat błędu
- Hasło za krótkie → walidacja client-side, nie wysyłamy

## Bezpieczeństwo

### Cookies

**Konfiguracja:**
```typescript
{
  path: '/',
  secure: true,        // HTTPS only
  httpOnly: true,      // JavaScript nie ma dostępu
  sameSite: 'lax',     // Ochrona przed CSRF
}
```

**Zawartość:**
- `sb-access-token` - JWT token (1h ważności)
- `sb-refresh-token` - token do odświeżania (60 dni)

### Best Practices

1. ✅ **Używaj `auth.getUser()` zamiast `getSession()`**
   - `getUser()` weryfikuje token na serwerze
   - Bezpieczniejsze, zapobiega atakom typu token forgery

2. ✅ **Per-request server client**
   - Każdy request ma swój własny client
   - Unika race conditions przy odświeżaniu tokenu

3. ✅ **Używaj TYLKO `getAll()` i `setAll()`**
   - Wymagane przez `@supabase/ssr`
   - Prawidłowa obsługa wielu cookies

4. ✅ **HttpOnly cookies**
   - JavaScript nie ma dostępu
   - Ochrona przed XSS

5. ✅ **Nie eksponuj kluczy w komponencie klienckim**
   - `SUPABASE_KEY` tylko na serwerze
   - Komponenty React wywołują API, nie Supabase bezpośrednio

6. ✅ **Pełne przeładowanie po auth**
   - `window.location.href` zamiast `navigate()`
   - Odświeżenie sesji SSR

7. ✅ **Nie ujawniaj istnienia konta**
   - Generic error messages
   - Jednakowe komunikaty dla błędnych danych

### Common Pitfalls (czego NIE robić)

1. ❌ NIE używaj pojedynczych metod cookie (`get`, `set`, `remove`)
2. ❌ NIE importuj z `@supabase/auth-helpers-nextjs`
3. ❌ NIE pomijaj wywołania `auth.getUser()` w middleware
4. ❌ NIE modyfikuj logiki obsługi cookies
5. ❌ NIE wywoływaj Supabase Auth bezpośrednio z React
6. ❌ NIE używaj `navigate()` po auth - używaj `window.location.href`

## Diagramy pomocnicze

### Cykl życia sesji

```
1. Login/Register → Cookie ustawiony (access + refresh token)
2. Każdy request → Middleware weryfikuje token
3. Token wygasa (1h) → Automatyczne odświeżenie przez refresh token
4. Refresh token wygasa (60 dni) → Wymagane ponowne logowanie
5. Logout → Czyszczenie cookies i unieważnienie sesji
```

### Przepływ cookies

```
Browser Request
  ↓ (cookies w headers)
Middleware
  ↓ getAll() - odczyt wszystkich cookies
createSupabaseServerInstance
  ↓
auth.getUser() - weryfikacja + ewentualne odświeżenie
  ↓ setAll() - zapis nowych/odświeżonych cookies
Response (z nowymi cookies w headers)
```

## Zmienne środowiskowe

**Wymagane:**
- `SUPABASE_URL` - URL projektu Supabase
- `SUPABASE_KEY` - Anon key (publiczny, ale tylko do użytku server-side w tej architekturze)

**Konfiguracja w `src/env.d.ts`:**
```typescript
interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
}

namespace App {
  interface Locals {
    user?: {
      email: string;
      id: string;
    };
  }
}
```

## Wymagane biblioteki

- `@supabase/supabase-js` - Supabase client
- `@supabase/ssr` - **WYMAGANE** dla prawidłowej obsługi cookies w SSR
- `zod` - walidacja client-side

**Instalacja:**
```bash
npm install @supabase/ssr @supabase/supabase-js zod
```

