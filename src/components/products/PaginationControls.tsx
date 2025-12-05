// src/components/products/PaginationControls.tsx

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PaginationMetaDTO } from "@/types";

/**
 * Propsy komponentu PaginationControls
 */
interface PaginationControlsProps {
  /** Metadane paginacji z odpowiedzi API */
  pagination: PaginationMetaDTO;
  /** Callback wywoływany przy zmianie strony */
  onPageChange: (newPage: number) => void;
  /** Flaga wyłączająca kontrolki (np. podczas ładowania) */
  disabled?: boolean;
}

/**
 * Komponent kontrolek nawigacji paginacji
 *
 * @component
 * @description
 * Wyświetla numery stron, przyciski Poprzednia/Następna,
 * informację o aktualnej stronie i całkowitej liczbie stron.
 * Wyłącza przyciski na granicznych stronach.
 *
 * Dostępność: focus states, aria-labels, wskaźnik aktualnej strony (aria-current="page").
 *
 * @example
 * <PaginationControls
 *   pagination={paginationMeta}
 *   onPageChange={(page) => setPage(page)}
 *   disabled={isLoading}
 * />
 */
export function PaginationControls({ pagination, onPageChange, disabled = false }: PaginationControlsProps) {
  const { page, total_pages, has_prev, has_next } = pagination;

  const handlePrevious = () => {
    if (has_prev && !disabled) {
      onPageChange(page - 1);
    }
  };

  const handleNext = () => {
    if (has_next && !disabled) {
      onPageChange(page + 1);
    }
  };

  // Generuj numery stron do wyświetlenia (max 5 przycisków)
  const getPageNumbers = (): number[] => {
    const pages: number[] = [];
    const maxButtons = 5;
    const halfButtons = Math.floor(maxButtons / 2);

    let startPage = Math.max(1, page - halfButtons);
    let endPage = Math.min(total_pages, page + halfButtons);

    // Dostosuj zakres jeśli jesteśmy blisko początku lub końca
    if (page <= halfButtons) {
      endPage = Math.min(total_pages, maxButtons);
    } else if (page >= total_pages - halfButtons) {
      startPage = Math.max(1, total_pages - maxButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav className="flex items-center justify-between gap-4 px-2 py-4" aria-label="Paginacja produktów">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          disabled={!has_prev || disabled}
          aria-label="Przejdź do poprzedniej strony"
          className="gap-1"
        >
          <ChevronLeft size={16} />
          <span className="hidden sm:inline">Poprzednia</span>
        </Button>

        <div className="hidden md:flex items-center gap-1">
          {pageNumbers.map((pageNum) => (
            <Button
              key={pageNum}
              variant={pageNum === page ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(pageNum)}
              disabled={disabled}
              aria-label={`Przejdź do strony ${pageNum}`}
              aria-current={pageNum === page ? "page" : undefined}
              className="min-w-[2.5rem]"
            >
              {pageNum}
            </Button>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={!has_next || disabled}
          aria-label="Przejdź do następnej strony"
          className="gap-1"
        >
          <span className="hidden sm:inline">Następna</span>
          <ChevronRight size={16} />
        </Button>
      </div>

      <div className="text-sm text-muted-foreground">
        Strona <span className="font-medium">{page}</span> z <span className="font-medium">{total_pages}</span>
      </div>
    </nav>
  );
}
