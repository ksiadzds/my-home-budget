// src/components/products/ConfirmDialog.tsx

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

/**
 * Propsy komponentu ConfirmDialog
 */
interface ConfirmDialogProps {
  /** Flaga otwartego dialogu (controlled) */
  open: boolean;
  /** Callback zamykający dialog */
  onOpenChange: (open: boolean) => void;
  /** Nazwa produktu do wyświetlenia w opisie */
  productName: string;
  /** Callback wywoływany po potwierdzeniu usunięcia */
  onConfirm: () => void;
  /** Flaga wyłączająca przyciski (np. podczas usuwania) */
  isDeleting?: boolean;
}

/**
 * Komponent dialogu potwierdzenia usunięcia produktu
 * 
 * @component
 * @description
 * Dialog potwierdzenia usunięcia produktu.
 * Wyświetla nazwę produktu w treści dialogu dla kontekstu.
 * Zawiera przyciski Anuluj (ghost) i Usuń (destructive).
 * 
 * Dostępność: focus trap, ESC zamyka dialog, focus na przycisk Anuluj po otwarciu.
 * 
 * @example
 * <ConfirmDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   productName="Mleko 3.2%"
 *   onConfirm={handleDelete}
 *   isDeleting={isDeleting}
 * />
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  productName,
  onConfirm,
  isDeleting = false,
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
  };

  const handleCancel = () => {
    if (!isDeleting) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
            </div>
            <DialogTitle>Potwierdź usunięcie</DialogTitle>
          </div>
        </DialogHeader>

        <DialogDescription className="pt-2">
          Czy na pewno chcesz usunąć produkt{' '}
          <span className="font-semibold text-foreground">"{productName}"</span>?
          <br />
          <br />
          Ta akcja jest nieodwracalna.
        </DialogDescription>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            onClick={handleCancel}
            disabled={isDeleting}
          >
            Anuluj
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Usuwanie...' : 'Usuń'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

