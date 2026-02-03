'use client'

import { useState, useActionState } from 'react'
import { login } from '@/app/actions'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function LoginForm({ departments }: { departments: { id: string, nome: string }[] }) {
  const [selectedDept, setSelectedDept] = useState("")
  const [state, formAction] = useActionState(login, null)

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Monitoramento PAS 2026</CardTitle>
          <CardDescription>Entre com as credenciais do seu departamento.</CardDescription>
        </CardHeader>
        <form action={formAction}>
          <CardContent>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="dept">Departamento</Label>
                {/* Added w-full to SelectTrigger to match Input width */}
                <Select name="deptId" onValueChange={setSelectedDept} required>
                  <SelectTrigger id="dept" className="w-full">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Fallback hidden input for form submission */}
                 <input type="hidden" name="deptId" value={selectedDept} />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" name="password" type="password" placeholder="******" required />
              </div>
              {state?.error && (
                <p className="text-sm text-red-500 font-medium">{state.error}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="submit" className="w-full">Entrar</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}