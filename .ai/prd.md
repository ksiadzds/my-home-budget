# Dokument wymagań produktu (PRD) - HomeBudget OCR

## 1. Przegląd produktu
Opis: HomeBudget OCR to aplikacja webowa, której celem jest szybka analiza paragonów sklepowych (początkowo Biedronka) w celu podsumowania wydatków według predefiniowanych kategorii. Aplikacja umożliwia użytkownikom przesłanie zdjęcia paragonu, przetworzenie go przez model AI w celu wykonania OCR, automatyczne dopasowanie produktów do kategorii oraz ręczne wprowadzenie korekt dla nierozpoznanych pozycji. Dodatkowo, aplikacja udostępnia interfejs do zarządzania produktami, umożliwiając edycję i usuwanie zapisanych mapowań.

## 2. Problem użytkownika
Problem: Użytkownicy często rezygnują z ręcznego wprowadzania wydatków do aplikacji budżetowych ze względu na żmudność i czasochłonność. Proces wprowadzania danych jest czasochłonny i podatny na błędy, co skutkuje brakiem dokładnego monitoringu wydatków. Rozwiązanie proponowane przez aplikację pozwala użytkownikom zaoszczędzić czas i energię, automatyzując proces wprowadzania danych z paragonu.

## 3. Wymagania funkcjonalne
- Uwierzytelnianie użytkownika: rejestracja, logowanie i bezpieczna sesja powiązana z prywatną bazą produktów.
- Przesyłanie zdjęcia paragonu: interfejs umożliwiający użytkownikowi przesłanie zdjęcia paragonu (tylko z Biedronki).
- OCR: Integracja z modelem AI, służącym do odczytu nazw produktów i cen z przesłanego zdjęcia.
- Automatyczne dopasowanie produktów: Dokładne, wrażliwe na wielkość liter porównanie rozpoznanych nazw z zapisanymi w bazie produktów, aby automatycznie przypisać kategorie.
- Weryfikacja i kategoryzacja: Interfejs weryfikacji, w którym:
  - Rozpoznane pozycje (istniejące w bazie) są oznaczane zielonym tłem.
  - Nierozpoznane pozycje są oznaczane pomarańczowym tłem i wymagają ręcznego przypisania kategorii z listy rozwijanej.
- Podsumowanie wydatków: Generowanie jednorazowego podsumowania wydatków według kategorii, które nie jest trwale zapisywane w bazie.
- Zarządzanie produktami (CRUD): Dedykowana strona umożliwiająca użytkownikowi przeglądanie, wyszukiwanie, edycję (zmiana przypisania kategorii) oraz usuwanie zapisanych produktów.

## 4. Granice produktu
- Produkt nie zapisuje trwałych podsumowań wydatków; dane są jednorazowo prezentowane użytkownikowi.
- Brak zaawansowanych raportów i wykresów analitycznych.
- Normalizacja nazw produktów (np. warianty zapisu mleka) nie będzie implementowana.
- System obsługuje tylko paragon z Biedronki; paragonów z innych sklepów, wielojęzyczność czy aplikacje mobilne nie są przewidziane w MVP.
- Użytkownik ma dostęp jedynie do predefiniowanych kategorii, które są statyczne i nie mogą być dodawane ani modyfikowane przez niego.

## 5. Historyjki użytkowników

US-001
Tytuł: Rejestracja konta
Opis: Jako nowy użytkownik chcę się zarejestrować, aby mieć dostęp do własnej bazy produktów i móc analizować swoje paragony.
Kryteria akceptacji:
- Formularz rejestracyjny zawiera pola na adres e-mail i hasło.
- Po poprawnym wypełnieniu formularza i weryfikacji danych konto jest aktywowane.
- Użytkownik otrzymuje potwierdzenie pomyślnej rejestracji i zostaje zalogowany.

US-002
Tytuł: Logowanie do aplikacji
Opis: Jako zarejestrowany użytkownik chcę móc się zalogować, aby mieć dostęp do mojej bazy produktów i móc analizować paragony.
Kryteria akceptacji:
- Po podaniu prawidłowych danych logowania użytkownik zostaje przekierowany do strony dashboard, gdzie może załadować zdjęcie paragonu.
- Błędne dane logowania wyświetlają komunikat o nieprawidłowych danych.
- Dane dotyczące logowania przechowywane są w bezpieczny sposób.

US-003
Tytuł: Przesyłanie zdjęcia paragonu i OCR
Opis: Jako zalogowany użytkownik chcę przesłać zdjęcie paragonu, aby system mógł automatycznie odczytać nazwy produktów i ceny za pomocą technologii OCR.
Kryteria akceptacji:
- Użytkownik ma możliwość przesłania zdjęcia paragonu (tylko z Biedronki).
- System przesyła zdjęcie do modelu AI, który zwraca listę pozycji z nazwami i cenami.
- W przypadku nieczytelności zdjęcia, system wyświetla czytelny komunikat o błędzie.

US-004
Tytuł: Automatyczne dopasowanie produktów do kategorii
Opis: Jako zalogowany użytkownik chcę, aby system automatycznie dopasowywał rozpoznane produkty do istniejących w bazie kategorii, co pozwala na szybkie potwierdzenie poprawności danych.
Kryteria akceptacji:
- System porównuje rozpoznane pozycje z zapisanymi w bazie, uwzględniając wielkość liter.
- Pozycje automatycznie dopasowane do bazy są oznaczone zielonym tłem w interfejsie weryfikacji.

US-005
Tytuł: Ręczne przypisanie kategorii do nowych produktów
Opis: Jako zalogowany użytkownik chcę móc ręcznie przypisać kategorię do nowych, nierozpoznanych pozycji, aby uwzględnić je w podsumowaniu wydatków.
Kryteria akceptacji:
- Nierozpoznane pozycje są oznaczone pomarańczowym tłem w interfejsie weryfikacji.
- Użytkownik ma możliwość wyboru kategorii z rozwijanej listy dla każdej nierozpoznanej pozycji.
- Po zatwierdzeniu przypisania kategorii, nowy produkt zostaje zapisany w bazie.

US-006
Tytuł: Wyświetlanie podsumowania wydatków
Opis: Jako zalogowany użytkownik chcę otrzymać podsumowanie wydatków według kategorii po przetworzeniu paragonu, aby szybko ocenić rozkład wydatków.
Kryteria akceptacji:
- System wyświetla listę kategorii z sumą wydatków dla każdej kategorii.
- Podsumowanie jest generowane po zakończeniu weryfikacji pozycji przez użytkownika.

US-007
Tytuł: Zarządzanie produktami (CRUD)
Opis: Jako zalogowany użytkownik chcę mieć możliwość przeglądania, wyszukiwania, edycji oraz usuwania zapisanych produktów, aby zarządzać moją bazą mapowań produktów.
Kryteria akceptacji:
- Użytkownik ma dostęp do dedykowanej strony zarządzania produktami.
- System umożliwia wyszukiwanie produktów według nazwy.
- Użytkownik może edytować kategorię produktu lub usunąć produkt z bazy.

## 6. Metryki sukcesu
- Czas przetwarzania paragonu: Użytkownik otrzymuje podsumowanie wydatków dla paragonu zawierającego 10+ pozycji w mniej niż 2 minuty.
- Efektywność weryfikacji: Użytkownik kończy proces weryfikacji (przypisania kategorii) dla paragonu z 10+ nierozpoznanymi pozycjami w mniej niż 5 minut.
- Skuteczność automatycznego dopasowania: Co najmniej 90% rozpoznanych pozycji z paragonu jest poprawnie dopasowanych do właściwych kategorii.
- Czytelność komunikatów o błędach: Użytkownik otrzymuje jasny i zrozumiały komunikat o błędzie w przypadku problemów z odczytem paragonu.
