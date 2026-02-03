"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useRouter, useSearchParams } from "next/navigation"

interface AdminFilterProps {
  departments: { id: string; nome: string }[]
  currentDeptId?: string
}

export function AdminFilter({ departments, currentDeptId }: AdminFilterProps) {
  const router = useRouter()
  
  const handleChange = (value: string) => {
    router.push(`/dashboard?deptId=${value}`)
  }

  return (
    <Select value={currentDeptId} onValueChange={handleChange}>
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder="Selecione um departamento" />
      </SelectTrigger>
      <SelectContent>
        {departments.map((dept) => (
          <SelectItem key={dept.id} value={dept.id}>
            {dept.nome}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
