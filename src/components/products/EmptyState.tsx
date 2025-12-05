// src/components/products/EmptyState.tsx

import { PackageOpen, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EmptyStateType } from "@/types";

/**
 * Propsy komponentu EmptyState
 */
interface EmptyStateProps {
  /** Typ pustego stanu */
  type: EmptyStateType;
  /** Callback do czyszczenia filtra (opcjonalny, tylko dla type="no_results") */
  onClearFilter?: () => void;
}

/**
 * Komponent wyświetlający pusty stan widoku Products
 *
 * @component
 * @description
 * Wyświetlany gdy lista produktów jest pusta.
 * Rozróżnia dwa scenariusze:
 * 1. Brak produktów w bazie (nowy użytkownik)
 * 2. Brak wyników wyszukiwania
 *
 * Wyświetla ikonę, tytuł i opis.
 * W przypadku pustego wyszukiwania, sugeruje zmianę kryteriów lub czyszczenie filtra.
 *
 * @example
 * <EmptyState type="no_products" />
 * <EmptyState type="no_results" onClearFilter={() => clearSearch()} />
 */
export function EmptyState({ type, onClearFilter }: EmptyStateProps) {
  const isNoProducts = type === "no_products";

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="rounded-full bg-muted p-6 mb-4">
        {isNoProducts ? (
          <PackageOpen className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
        ) : (
          <SearchX className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
        )}
      </div>

      <h2 className="text-xl font-semibold mb-2">{isNoProducts ? "Brak produktów" : "Brak wyników"}</h2>

      <p className="text-muted-foreground max-w-md mb-6">
        {isNoProducts ? (
          <>
            Nie masz jeszcze żadnych produktów. Dodaj produkty poprzez proces OCR na{" "}
            <a href="/" className="underline hover:text-foreground transition-colors">
              stronie głównej
            </a>
            .
          </>
        ) : (
          "Brak wyników dla podanego wyszukiwania. Spróbuj użyć innych słów kluczowych lub wyczyść filtr."
        )}
      </p>

      {!isNoProducts && onClearFilter && (
        <Button variant="outline" onClick={onClearFilter}>
          Wyczyść filtr
        </Button>
      )}
    </div>
  );
}
