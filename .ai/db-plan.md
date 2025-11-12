# Schemat bazy danych PostgreSQL - HomeBudget

## 1. Lista tabel

### Tabela: users

This table is managed by Supabase Auth.

- id: UUID PRIMARY KEY
- email: VARCHAR(255) NOT NULL UNIQUE
- encrypted_password: VARCHAR NOT NULL
- created_at: TIMESTAMPTZ NOT NULL DEFAULT now()
- confirmed_at: TIMESTAMPTZ

### Tabela: kategorie
- **id**: UUID, PRIMARY KEY, NOT NULL, DEFAULT uuid_generate_v4()
- **nazwa_kategorii**: VARCHAR(255), NOT NULL, UNIQUE

### Tabela: produkty
- **id**: UUID, PRIMARY KEY, NOT NULL, DEFAULT uuid_generate_v4()
- **nazwa_produktu**: VARCHAR(255), NOT NULL
- **kategoria_id**: UUID, NOT NULL, REFERENCES kategorie(id) ON DELETE RESTRICT
- **user_id**: UUID NOT NULL REFERENCES users(id)
- **created_at**: TIMESTAMP WITH TIME ZONE, NOT NULL, DEFAULT NOW()
- **updated_at**: TIMESTAMP WITH TIME ZONE, NOT NULL, DEFAULT NOW()
- **Ograniczenie unikalności**: UNIQUE (user_id, nazwa_produktu)

### Tabela: ocr_error_logs
- **id**: UUID, PRIMARY KEY, NOT NULL, DEFAULT uuid_generate_v4()
- **user_id**: UUID NOT NULL REFERENCES users(id)
- **error_type**: VARCHAR(50) NOT NULL CHECK (error_type IN ('ocr_failed', 'summary_failed', 'parsing_error', 'network_error'))
- **error_message**: TEXT NOT NULL
- **source_image_size**: INTEGER NULL
- **processing_duration**: INTEGER NULL
- **created_at**: TIMESTAMPTZ NOT NULL DEFAULT now()

## 2. Relacje między tabelami

- Tabela `produkty` posiada relację wiele-do-jednego z tabelą `kategorie` poprzez kolumnę `kategoria_id`.
- Tabela `produkty` posiada relację wiele-do-jednego z tabelą `users` poprzez kolumnę `user_id`.
- Tabela `ocr_error_logs` posiada relację wiele-do-jednego z tabelą `users` poprzez kolumnę `user_id`.

## 3. Indeksy

- Indeks na kolumnie `user_id` w tabeli `produkty` dla optymalizacji zapytań.
- Indeks na kolumnie `kategoria_id` w tabeli `produkty` dla optymalizacji zapytań.
- Indeks na kolumnie `user_id` w tabeli `ocr_error_logs` dla optymalizacji zapytań.

## 4. Zasady PostgreSQL (RLS)

- Włączenie Row-Level Security (RLS) na tabeli `produkty` z regułą opartą na `user_id`, która zapewnia, że użytkownik ma dostęp wyłącznie do rekordów przypisanych do jego identyfikatora.
- Włączenie Row-Level Security (RLS) na tabeli `ocr_error_logs` z regułą opartą na `user_id`, która zapewnia, że użytkownik ma dostęp wyłącznie do swoich własnych logów błędów.

## 5. Dodatkowe uwagi

- Schemat wykorzystuje UUID (poprzez funkcję `uuid_generate_v4()`) jako domyślną wartość dla kluczy głównych. Upewnij się, że rozszerzenie `uuid-ossp` jest aktywowane w bazie danych.
- Pola audytowe (`created_at`, `updated_at`) służą do śledzenia wersji i zmian rekordów.
- Tabela `ocr_error_logs` służy do rejestrowania problemów z przetwarzaniem OCR oraz błędów podczas generowania podsumowań wydatków.
- Logika biznesowa oraz operacje CRUD będą obsługiwane na poziomie aplikacji, a nie poprzez wyzwalacze lub procedury składowane.