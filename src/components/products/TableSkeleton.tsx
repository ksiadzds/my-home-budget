// src/components/products/TableSkeleton.tsx

/**
 * Komponent szkieletu wiersza tabeli podczas ładowania
 *
 * @component
 * @description
 * Prosty komponent wyświetlający animowany szkielet dla wierszy tabeli.
 * Używany podczas ładowania danych z API.
 *
 * @param {number} rows - Liczba wierszy do wyświetlenia (default: 5)
 *
 * @example
 * <TableSkeleton rows={3} />
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, index) => (
        <tr key={index} className="border-b">
          <td className="px-4 py-3">
            <div className="h-4 w-full max-w-[200px] bg-muted animate-pulse rounded" />
          </td>
          <td className="px-4 py-3">
            <div className="h-9 w-full max-w-[150px] bg-muted animate-pulse rounded" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          </td>
          <td className="px-4 py-3">
            <div className="h-9 w-9 bg-muted animate-pulse rounded" />
          </td>
        </tr>
      ))}
    </>
  );
}
