'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function AdminFilter({ departments }: { departments: { id: string, nome: string }[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentDept = searchParams.get('deptId') || "all"

  return (
    <div className="w-[300px]">
      <Select 
        value={currentDept} 
        onValueChange={(val) => {
            if (val === "all") router.push('/admin/dashboard');
            else router.push(`/admin/dashboard?deptId=${val}`);
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Filtrar por Departamento" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos (Visão Geral)</SelectItem>
          {departments.map((dept) => (
            <SelectItem key={dept.id} value={dept.id}>
              {dept.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
