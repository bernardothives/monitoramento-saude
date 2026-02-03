'use client'

import { useState } from 'react'
import { useActionState } from 'react'
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

export function UpdateMetaSheet({ meta, children }: { meta: any, children: React.ReactNode }) {
  const [state, formAction] = useActionState(updateMonitoramento, null)
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Atualizar Monitoramento</SheetTitle>
          <SheetDescription>
            Informe o progresso da meta {meta.numero} para o quadrimestre.
          </SheetDescription>
        </SheetHeader>
        <form action={(formData) => {
            formAction(formData);
            setOpen(false); // Close on submit (optimistic) or wait? 
            // Ideally wait for success but for simplicity close.
        }} className="grid gap-4 py-4">
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
            <Input id="valorRealizado" name="valorRealizado" type="number" step="0.01" className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="justificativa" className="text-right">
              Justificativa
            </Label>
            <Textarea id="justificativa" name="justificativa" className="col-span-3" />
          </div>
          
          <SheetFooter>
            <SheetClose asChild>
              <Button type="submit">Salvar</Button>
            </SheetClose>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
