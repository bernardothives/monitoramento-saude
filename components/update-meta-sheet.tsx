'use client'

import { useState, useEffect } from 'react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { updateMonitoramento } from '@/app/actions'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from 'lucide-react'

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Salvando...
        </>
      ) : (
        "Salvar Alterações"
      )}
    </Button>
  );
}

export function UpdateMetaSheet({ meta, children }: { meta: any, children: React.ReactNode }) {
  const [state, formAction] = useActionState(updateMonitoramento, null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (state?.success) {
      // Small delay to allow user to see success message before closing
      setTimeout(() => {
        setOpen(false);
      }, 1000);
    }
  }, [state]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Atualizar Monitoramento</SheetTitle>
          <SheetDescription>
            Informe o progresso da meta <span className="font-bold">{meta.numero}</span> para o quadrimestre.
          </SheetDescription>
        </SheetHeader>
        <form action={formAction} className="grid gap-4 py-4">
          <input type="hidden" name="metaId" value={meta.id} />
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quadrimestre" className="text-right">
              Período
            </Label>
            <div className="col-span-3">
                 <Select name="quadrimestre" defaultValue="1" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1º Quadrimestre</SelectItem>
                    <SelectItem value="2">2º Quadrimestre</SelectItem>
                    <SelectItem value="3">3º Quadrimestre</SelectItem>
                  </SelectContent>
                </Select>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="valorRealizado" className="text-right">
              Valor
            </Label>
            <Input id="valorRealizado" name="valorRealizado" type="number" step="any" className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="justificativa" className="text-right">
              Justificativa
            </Label>
            <Textarea id="justificativa" name="justificativa" className="col-span-3" placeholder="Se necessário, justifique o resultado..." />
          </div>
          
          <SheetFooter className="mt-4">
            <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center w-full gap-4">
                 <div className="text-sm font-medium">
                    {state?.error && <p className="text-red-600">{state.error}</p>}
                    {state?.success && <p className="text-green-600">{state.message}</p>}
                 </div>
                 <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 w-full sm:w-auto">
                    <SheetClose asChild>
                      <Button type="button" variant="outline">Cancelar</Button>
                    </SheetClose>
                    <SubmitButton />
                 </div>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
