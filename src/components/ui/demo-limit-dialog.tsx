
'use client';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

type DemoLimitDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function DemoLimitDialog({ isOpen, onClose }: DemoLimitDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex justify-center mb-4">
             <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
          </div>
          <AlertDialogTitle className="text-center text-lg font-bold">Límite de la Versión Demo Alcanzado</AlertDialogTitle>
          <AlertDialogDescription className="text-center text-muted-foreground">
            Ha alcanzado el número máximo de registros permitidos en esta versión de demostración. Para continuar y crear registros ilimitados, por favor adquiera la versión completa.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose} className="w-full">Entendido</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
