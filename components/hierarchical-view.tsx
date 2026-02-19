"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronRight, ArrowLeft, Target, ListChecks } from "lucide-react"
import { MetaCard } from "./meta-card"

// Types matching the Prisma include structure
type DataProps = {
  id: string
  titulo: string
  descricao: string
  objetivos: {
    id: string
    titulo: string
    descricao: string
    metas: any[] // We pass this down to MetaCard
  }[]
}[]

export function HierarchicalView({ data }: { data: DataProps }) {
  const [selectedDiretrizId, setSelectedDiretrizId] = useState<string | null>(null)
  const [selectedObjetivoId, setSelectedObjetivoId] = useState<string | null>(null)

  // SAFEGUARD: Ensure data is an array
  const safeData = Array.isArray(data) ? data : [];

  const selectedDiretriz = safeData.find(d => d.id === selectedDiretrizId)
  const selectedObjetivo = selectedDiretriz?.objetivos.find(o => o.id === selectedObjetivoId)

  // Level 1: Directives List
  if (!selectedDiretriz) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {safeData.map((dir) => (
          <Card 
            key={dir.id} 
            className="cursor-pointer hover:bg-accent/50 transition-colors border-l-4 border-l-primary"
            onClick={() => setSelectedDiretrizId(dir.id)}
          >
            <CardHeader>
              <CardTitle className="text-lg leading-tight mb-2">{dir.titulo}</CardTitle>
              <CardDescription className="line-clamp-4">{dir.descricao}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <Target className="mr-2 h-4 w-4" />
                {dir.objetivos.length} Objetivos
              </div>
            </CardContent>
          </Card>
        ))}
        {safeData.length === 0 && (
          <div className="col-span-full text-center p-8 text-muted-foreground border border-dashed rounded-lg">
            Nenhuma diretriz encontrada para este departamento.
          </div>
        )}
      </div>
    )
  }

  // Level 2: Objectives List
  if (!selectedObjetivo) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={() => setSelectedDiretrizId(null)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
             <h3 className="text-lg font-semibold">{selectedDiretriz.titulo}</h3>
             <p className="text-sm text-muted-foreground">{selectedDiretriz.descricao}</p>
          </div>
        </div>

        <div className="grid gap-4">
          {selectedDiretriz.objetivos.map((obj) => (
            <Card 
              key={obj.id} 
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => setSelectedObjetivoId(obj.id)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">
                  {obj.titulo}
                </CardTitle>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mt-2">{obj.descricao}</p>
                <div className="mt-4 flex items-center text-xs text-muted-foreground">
                    <ListChecks className="mr-2 h-3 w-3" />
                    {obj.metas.length} Metas
                </div>
              </CardContent>
            </Card>
          ))}
          {selectedDiretriz.objetivos.length === 0 && (
            <div className="p-4 text-center text-muted-foreground border rounded-lg bg-muted/20">
              Nenhum objetivo cadastrado nesta diretriz para seu departamento.
            </div>
          )}
        </div>
      </div>
    )
  }

  // Level 3: Metas Grid (Vertical Flow)
  return (
    <div className="space-y-6">
       <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={() => setSelectedObjetivoId(null)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
             <h3 className="text-lg font-semibold">{selectedObjetivo.titulo}</h3>
             <p className="text-sm text-muted-foreground">{selectedObjetivo.descricao}</p>
          </div>
        </div>

        {selectedObjetivo.metas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-min align-top">
                {selectedObjetivo.metas.map((meta) => (
                    <MetaCard key={meta.id} meta={meta} />
                ))}
            </div>
        ) : (
            <div className="p-8 text-center text-muted-foreground border border-dashed rounded-lg bg-slate-50">
                Nenhuma meta cadastrada neste objetivo para seu departamento.
            </div>
        )}
    </div>
  )
}