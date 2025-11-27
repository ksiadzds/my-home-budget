### Moduł uwierzytelniania (rejestracja, logowanie, reset hasła) – specyfikacja architektoniczna

Na podstawie PRD (US-001, US-002) oraz stacku z `.ai/tech-stack.md` (Astro 5, React 19, TypeScript 5, Tailwind 4, Shadcn/ui, Supabase), poniższa dokumentacja definiuje architekturę modułu rejestracji, logowania i resetowania hasła.

**Architektura:** API-first z SSR (React → API endpoints → Supabase Auth)

**Zakres MVP:**
- Rejestracja nowego konta
- Logowanie do aplikacji
- Wylogowanie
- Reset hasła (żądanie linku + ustawienie nowego hasła)

---

## 1. Architektura interfejsu użytkownika

### 1.1. Layouty i tryby (auth vs non-auth)
- **`src/layouts/Layout.astro` (rozszerzenie)**:
  - Integracja z sesją (SSR) poprzez odczyt `Astro.locals.user`:
    - Gdy użytkownik jest zalogowany: wyświetl awatar/ikonę użytkownika oraz przycisk „Wyloguj".
    - Gdy użytkownik nie jest zalogowany: wyświetl linki „Zaloguj" i „Zarejestruj".
  - Warunkowe renderowanie elementów nawigacji na podstawie `locals.user`.

- **`src/layouts/AuthLayout.astro` (nowy, opcjonalny)**:
  - Minimalistyczny układ dla stron auth – skupienie na formularzu.
  - Brak elementów rozpraszających.

### 1.2. Strony (Astro) i komponenty (React)

**Strony Astro (routing, SSR):**
- `src/pages/auth/login.astro` – logowanie
- `src/pages/auth/register.astro` – rejestracja
- `src/pages/auth/reset-password.astro` – reset hasła (formularz żądania linku + formularz ustawienia nowego hasła)

**Nawigacja:**
- Po sukcesie logowania/rejestracji → redirect do `/`
- Po sukcesie żądania resetu → komunikat „Jeśli email istnieje, wysłaliśmy link"
- Po ustawieniu nowego hasła → redirect do `/auth/login?reset=success`

**Linki między stronami:**
- `/auth/login` → link "Nie masz konta? Zarejestruj się" → `/auth/register`
- `/auth/login` → link "Zapomniałeś hasła?" → `/auth/reset-password`
- `/auth/register` → link "Masz już konto? Zaloguj się" → `/auth/login`

**Komponenty React (formularze, interakcje):**

Katalog: `src/components/auth/`

1. **`LoginForm.tsx`**
   - Pola: email, password
   - Akcja: wywołuje `POST /api/auth/login`
   - Stan: loading, error, success
   - Obsługa błędów z API

2. **`RegisterForm.tsx`**
   - Pola: email, password, confirmPassword
   - Akcja: wywołuje `POST /api/auth/register`
   - Po sukcesie: auto-login i redirect do `/` (zgodnie z PRD)

3. **`ResetPasswordForm.tsx`**
   - Dwa widoki w jednym komponencie:
     - **Widok 1 (żądanie linku):** pole email → `POST /api/auth/reset-password` (body: `{ email, action: 'request' }`)
     - **Widok 2 (nowe hasło):** pola newPassword, confirmPassword → `POST /api/auth/reset-password` (body: `{ code, password, action: 'confirm' }`)
   - Komponent wykrywa obecność `code` w URL query aby wybrać widok

**UI:**
- Shadcn/ui: `button`, `input`, `card`, `alert`
- Tailwind 4
- ARIA atrybuty, focus states
- Przyjazne komunikaty po polsku

**Walidacja:**
- `zod` na poziomie formularzy (client-side)
- Opcjonalnie `react-hook-form` z `zodResolver`

### 1.3. Rozdzielenie odpowiedzialności

| Warstwa | Odpowiedzialność |
|---------|------------------|
| **Astro (strony)** | SSR, sprawdzenie sesji (`locals.user`), routing, redirecty, osadzanie komponentów |
| **React (komponenty)** | Walidacja client-side, wywołania fetch do API, zarządzanie stanem UI |
| **API endpoints** | Wywołania Supabase Auth, zarządzanie cookies, zwracanie odpowiedzi |
| **Middleware** | Per-request server client, sprawdzenie sesji, ochrona tras |

### 1.4. Walidacja i komunikaty błędów

**Walidacja client-side (Zod):**
- `email`: `.email()` → "Podaj poprawny adres email"
- `password`: `.min(8)` → "Hasło musi mieć min. 8 znaków"
- `confirmPassword`: musi być zgodne z `password` → "Hasła muszą być identyczne"

**Mapowanie błędów Supabase (w komponentach React):**
```typescript
const errorMessages: Record<string, string> = {
  'Invalid login credentials': 'Nieprawidłowy email lub hasło',
  'User already registered': 'Konto z tym adresem email już istnieje',
  'Email not confirmed': 'Potwierdź swój adres email',
};
```

**Zasady:**
- Nie ujawniać istnienia emaila przy reset hasła
- Błędy przy polach + globalny Alert
- Przyjazne nazwy po polsku

### 1.5. Kluczowe scenariusze UX

**Rejestracja (US-001):**
1. Użytkownik wypełnia formularz (email, hasło)
2. Kliknięcie "Zarejestruj się" → `POST /api/auth/register`
3. Po sukcesie: auto-login i redirect do `/` (dashboard)
4. Toast: "Konto utworzone pomyślnie"

**Logowanie (US-002):**
1. Użytkownik wypełnia formularz (email, hasło)
2. Kliknięcie "Zaloguj się" → `POST /api/auth/login`
3. Po sukcesie: redirect do `/` lub `redirectTo` z query
4. Błąd: komunikat "Nieprawidłowy email lub hasło"

**Wylogowanie:**
1. Kliknięcie przycisku "Wyloguj" w nagłówku
2. `POST /api/auth/logout`
3. Redirect do `/auth/login`

**Reset hasła:**
1. **Krok 1 - Żądanie linku:**
   - Użytkownik wpisuje email na `/auth/reset-password`
   - `POST /api/auth/reset-password` (action: 'request')
   - Komunikat: "Jeśli email istnieje, wysłaliśmy link do resetowania hasła"
2. **Krok 2 - Nowe hasło:**
   - Kliknięcie linku z maila → `/auth/reset-password?code=...`
   - Formularz: newPassword, confirmPassword
   - `POST /api/auth/reset-password` (action: 'confirm')
   - Redirect do `/auth/login?reset=success`

**Sesja wygasła:**
- Middleware wykrywa brak sesji → redirect do `/auth/login?redirectTo=/current-path`

---

## 2. Logika backendowa

### 2.1. Middleware i kontekst SSR

**Plik:** `src/middleware/index.ts`

**Odpowiedzialność:**
1. Utworzenie per-request Supabase server client
2. Sprawdzenie sesji użytkownika (`auth.getUser()`)
3. Ustawienie `locals.user`
4. Ochrona tras (redirect dla niezalogowanych)

**Publiczne ścieżki (bez wymaganej sesji):**
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

**Logika:**
```typescript
import { defineMiddleware } from 'astro:middleware';
import { createSupabaseServerInstance } from '../db/supabase.client.ts';

export const onRequest = defineMiddleware(
  async ({ locals, cookies, url, request, redirect }, next) => {
    // Pomiń sprawdzenie auth dla publicznych ścieżek
    if (PUBLIC_PATHS.includes(url.pathname)) {
      return next();
    }

    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // WAŻNE: Zawsze najpierw getUser()
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      locals.user = {
        email: user.email!,
        id: user.id,
      };
    } else {
      // Przekieruj niezalogowanych do login
      return redirect(`/auth/login?redirectTo=${url.pathname}`);
    }

    return next();
  }
);
```

### 2.2. Endpointy API

**Katalog:** `src/pages/api/auth/`

#### 2.2.1. `login.ts`

```typescript
import type { APIRoute } from 'astro';
import { createSupabaseServerInstance } from '../../../db/supabase.client.ts';

export const POST: APIRoute = async ({ request, cookies }) => {
  const { email, password } = await request.json();

  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ user: data.user }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
```

#### 2.2.2. `register.ts`

```typescript
import type { APIRoute } from 'astro';
import { createSupabaseServerInstance } from '../../../db/supabase.client.ts';

export const POST: APIRoute = async ({ request, cookies }) => {
  const { email, password } = await request.json();

  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ user: data.user }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
```

#### 2.2.3. `logout.ts`

```typescript
import type { APIRoute } from 'astro';
import { createSupabaseServerInstance } from '../../../db/supabase.client.ts';

export const POST: APIRoute = async ({ cookies, request }) => {
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  const { error } = await supabase.auth.signOut();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(null, { status: 200 });
};
```

#### 2.2.4. `reset-password.ts`

```typescript
import type { APIRoute } from 'astro';
import { createSupabaseServerInstance } from '../../../db/supabase.client.ts';

export const POST: APIRoute = async ({ request, cookies }) => {
  const body = await request.json();
  const { action } = body;

  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // Krok 1: Wyślij link do resetu
  if (action === 'request') {
    const { email } = body;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${new URL(request.url).origin}/auth/reset-password`,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: 'Reset link sent' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Krok 2: Ustaw nowe hasło
  if (action === 'confirm') {
    const { code, password } = body;

    // Wymiana code na sesję
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      return new Response(JSON.stringify({ error: exchangeError.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Aktualizacja hasła
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: 'Password updated' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ error: 'Invalid action' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
};
```

### 2.3. Aktualizacja istniejących endpointów

**Endpointy produktów i receipts:**
- Zastąpić `mockUserId` → `locals.user?.id`
- Dodać sprawdzenie: brak `user` → `401 Unauthorized`

**Przykład:**

```typescript
// src/pages/api/products.ts
export const POST: APIRoute = async ({ request, locals }) => {
  const userId = locals.user?.id;
  
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Reszta logiki bez zmian, używając userId
};
```

### 2.4. Walidacja danych wejściowych

**Formularze auth:** walidacja client-side (Zod) + mapowanie błędów Supabase

**API endpoints:** opcjonalna walidacja server-side (Zod)

**Nowy plik:** `src/lib/validations/auth.validation.ts`

```typescript
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Podaj poprawny adres email'),
  password: z.string().min(8, 'Hasło musi mieć min. 8 znaków'),
});

export const registerSchema = z.object({
  email: z.string().email('Podaj poprawny adres email'),
  password: z.string().min(8, 'Hasło musi mieć min. 8 znaków'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Hasła muszą być identyczne',
  path: ['confirmPassword'],
});

export const resetPasswordRequestSchema = z.object({
  email: z.string().email('Podaj poprawny adres email'),
});

export const resetPasswordConfirmSchema = z.object({
  code: z.string().min(1, 'Kod jest wymagany'),
  password: z.string().min(8, 'Hasło musi mieć min. 8 znaków'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Hasła muszą być identyczne',
  path: ['confirmPassword'],
});
```

---

## 3. System autentykacji (Supabase Auth + Astro)

### 3.1. Klient Supabase

**Plik:** `src/db/supabase.client.ts`

**WAŻNE:**
- Używamy **TYLKO** `@supabase/ssr` (NIE auth-helpers)
- Używamy **TYLKO** `getAll()` i `setAll()` dla cookies
- **NIE** używamy pojedynczych `get()`, `set()`, `remove()`

```typescript
import type { AstroCookies } from 'astro';
import { createServerClient, type CookieOptionsWithName } from '@supabase/ssr';
import type { Database } from './database.types.ts';

export const cookieOptions: CookieOptionsWithName = {
  path: '/',
  secure: true,
  httpOnly: true,
  sameSite: 'lax',
};

function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  return cookieHeader.split(';').map((cookie) => {
    const [name, ...rest] = cookie.trim().split('=');
    return { name, value: rest.join('=') };
  });
}

export const createSupabaseServerInstance = (context: {
  headers: Headers;
  cookies: AstroCookies;
}) => {
  const supabase = createServerClient<Database>(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_KEY,
    {
      cookieOptions,
      cookies: {
        getAll() {
          return parseCookieHeader(context.headers.get('Cookie') ?? '');
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            context.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  return supabase;
};
```

### 3.2. Ochrona tras

**W stronach Astro:**

```astro
---
// src/pages/index.astro
const { user } = Astro.locals;

if (!user) {
  return Astro.redirect('/auth/login');
}
---

<Layout>
  <DashboardView client:load />
</Layout>
```

**Dla stron auth (już zalogowany):**

```astro
---
// src/pages/auth/login.astro
const { user } = Astro.locals;

if (user) {
  return Astro.redirect('/');
}
---

<AuthLayout>
  <LoginForm client:load />
</AuthLayout>
```

### 3.3. Zmienne środowiskowe

**Plik:** `.env`

```env
SUPABASE_URL=your_project_url
SUPABASE_KEY=your_anon_key
```

**Plik:** `src/env.d.ts`

```typescript
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
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

**ZAWSZE aktualizuj `src/env.d.ts` przy dodawaniu nowych zmiennych środowiskowych lub wartości w `Astro.locals`!**

### 3.4. Komponenty, moduły, kontrakty – lista plików

**UI (React):**
- `src/components/auth/LoginForm.tsx`
- `src/components/auth/RegisterForm.tsx`
- `src/components/auth/ResetPasswordForm.tsx`

**Strony (Astro):**
- `src/pages/auth/login.astro`
- `src/pages/auth/register.astro`
- `src/pages/auth/reset-password.astro`

**API (Astro endpoints):**
- `src/pages/api/auth/login.ts`
- `src/pages/api/auth/register.ts`
- `src/pages/api/auth/logout.ts`
- `src/pages/api/auth/reset-password.ts`

**Middleware:**
- `src/middleware/index.ts`

**Klient Supabase:**
- `src/db/supabase.client.ts`

**Walidacje:**
- `src/lib/validations/auth.validation.ts`

**Layout (opcjonalny):**
- `src/layouts/AuthLayout.astro`

**Typy (kontrakty)** – w `src/types.ts`:
```typescript
export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthError {
  message: string;
  code?: string;
}
```

### 3.5. Wzorce wywołań API z React

**Przykład w LoginForm.tsx:**

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError(null);

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error || 'Wystąpił błąd');
      return;
    }

    // Sukces - redirect przez window.location (pełne przeładowanie dla SSR)
    window.location.href = '/';
  } catch (err) {
    setError('Wystąpił błąd połączenia');
  } finally {
    setLoading(false);
  }
};
```

**WAŻNE:** Po sukcesie auth używaj `window.location.href` zamiast `navigate()` aby wymusić pełne przeładowanie strony i odświeżenie sesji SSR.

---

## 4. Zmiany kompatybilne z istniejącym kodem

**Middleware aktualnie:**

```3:8:src/middleware/index.ts
import { supabaseClient } from '../db/supabase.client.ts';

export const onRequest = defineMiddleware((context, next) => {
  context.locals.supabase = supabaseClient;
  return next();
});
```

**Po implementacji:**
- Zastąpienie `supabaseClient` → `createSupabaseServerInstance(context)`
- Dodanie logiki sprawdzania sesji i redirectów
- Zachowanie zgodności z `locals` (dodanie `locals.user`)

**API produktów - miejsca na podmianę:**

```75:83:src/pages/api/products.ts
const { nazwa_produktu, kategoria_id } = validationResult.data;

// TODO: Po implementacji uwierzytelnienia, pobierz userId z sesji
// Na razie używamy mock userId dla celów deweloperskich
const mockUserId = '00000000-0000-0000-0000-000000000001';

// Utworzenie instancji serwisu produktów
const productsService = new ProductsService(supabase);
```

**Po implementacji:** `const userId = locals.user?.id;` + sprawdzenie 401

---

## 5. Kryteria akceptacji (mapowanie do PRD)

**US-001 Rejestracja konta:**
- ✅ Formularz rejestracyjny zawiera pola na adres e-mail i hasło
- ✅ Po poprawnym wypełnieniu formularza konto jest aktywowane
- ✅ Użytkownik otrzymuje potwierdzenie pomyślnej rejestracji i zostaje zalogowany
- ✅ Po sukcesie redirect do `/` (dashboard z możliwością przesyłania paragonów)
- ✅ Użytkownik ma dostęp do własnej, prywatnej bazy produktów

**US-002 Logowanie do aplikacji:**
- ✅ Po podaniu prawidłowych danych użytkownik zostaje przekierowany do dashboardu
- ✅ Błędne dane logowania wyświetlają komunikat o nieprawidłowych danych
- ✅ Dane dotyczące logowania przechowywane są w bezpieczny sposób (cookies HttpOnly)

**Dodatkowo (poza MVP, ale przewidziane w architekturze):**
- ✅ Reset hasła: wysyłka maila + ustawienie nowego hasła
- ✅ Wylogowanie: czyszczenie sesji i redirect do `/auth/login`

**Zgodność z istniejącą funkcjonalnością:**
- ✅ Po włączeniu auth wszystkie endpointy produktów i receipts wymagają sesji użytkownika
- ✅ Middleware sprawdza sesję dla wszystkich chronioych tras
- ✅ Publiczne ścieżki auth działają bez sesji

---

## 6. Security Best Practices

- ✅ Cookies z `httpOnly`, `secure`, `sameSite: 'lax'`
- ✅ Nigdy nie eksponuj kluczy Supabase w komponentach klienckich
- ✅ Walidacja danych po stronie serwera (opcjonalnie)
- ✅ Proper error handling i logging
- ✅ Nie ujawniaj istnienia konta przy reset hasła
- ✅ Używaj TYLKO `getAll`/`setAll` dla cookies (per @supabase/ssr)

---

## 7. Common Pitfalls (czego NIE robić)

1. ❌ NIE używaj pojedynczych metod cookie (`get`, `set`, `remove`)
2. ❌ NIE importuj z `@supabase/auth-helpers-nextjs`
3. ❌ NIE pomijaj wywołania `auth.getUser()` w middleware
4. ❌ NIE modyfikuj logiki obsługi cookies
5. ❌ NIE wywoływaj Supabase Auth bezpośrednio z komponentów React (tylko przez API)
6. ❌ NIE używaj `navigate()` po auth - używaj `window.location.href` dla SSR

---

## 8. Wymagania techniczne i biblioteki

- Astro 5 (SSR, Node adapter)
- React 19
- TypeScript 5
- Tailwind 4
- Shadcn/ui
- `@supabase/supabase-js`
- **`@supabase/ssr`** (WYMAGANE dla cookies)
- `zod` (walidacja)
- Opcjonalnie: `react-hook-form`

**Instalacja:**

```bash
npm install @supabase/ssr @supabase/supabase-js
```

---

## 9. Przyszłe usprawnienia

- Włączenie RLS i polityk bezpieczeństwa w produkcji
- OAuth (Google, GitHub)
- Rate limiting dla akcji auth
- Centralny system logowania błędów
- Potwierdzenie email (wyłączone w dev dla auto-login po rejestracji)

---

**Dokument definiuje pełną architekturę modułu auth zgodną z best practices dla Astro SSR + Supabase Auth.**
