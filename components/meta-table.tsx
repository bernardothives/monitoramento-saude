"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight, Edit } from "lucide-react"
import { useState, Fragment } from "react"
import { UpdateMetaSheet } from "./update-meta-sheet"

export function MetaTable({ metas }: { metas: any[] }) {
  const [expandedMetaIds, setExpandedMetaIds] = useState<Set<string>>(new Set())

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedMetaIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setExpandedMetaIds(newSet)
  }

  // Helper for RAG Color
  const getStatusColor = (status?: string) => {
    switch (status) {
      case "VERDE": return "bg-green-500 hover:bg-green-600";
      case "AMARELO": return "bg-yellow-500 hover:bg-yellow-600";
      case "VERMELHO": return "bg-red-500 hover:bg-red-600";
      default: return "bg-gray-400 hover:bg-gray-500";
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]"></TableHead>
            <TableHead className="w-[80px]">Nº</TableHead>
            <TableHead className="min-w-[200px]">Descrição</TableHead>
            <TableHead>Indicador</TableHead>
            <TableHead className="text-right">Linha Base (2024)</TableHead>
            <TableHead className="text-right">Meta Plano (2029)</TableHead>
            <TableHead className="text-right">Meta Física (2026)</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {metas.map((meta) => {
            const isExpanded = expandedMetaIds.has(meta.id)
            const monitoramento = meta.monitoramentos?.[0] // Latest due to ordering
            
            return (
              <Fragment key={meta.id}>
                <TableRow className={isExpanded ? "bg-muted/50" : ""}>
                  <TableCell>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => toggleExpand(meta.id)}
                    >
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium">{meta.numero}</TableCell>
                  <TableCell className="max-w-[300px] text-sm">{meta.descricao}</TableCell>
                  <TableCell className="text-sm">{meta.indicadorNome}</TableCell>
                  <TableCell className="text-right text-sm">
                    {meta.linhaBaseValor} <span className="text-xs text-muted-foreground">{meta.unidadeMedida}</span>
                  </TableCell>
                  <TableCell className="text-right text-sm">{meta.metaPlano2029}</TableCell>
                  <TableCell className="text-right font-bold">{meta.metaFisica2026}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={`${getStatusColor(monitoramento?.statusRAG)} text-white`}>
                        {monitoramento ? `${monitoramento.valorRealizado}` : "Pend."}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <UpdateMetaSheet meta={meta}>
                        <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                        </Button>
                    </UpdateMetaSheet>
                  </TableCell>
                </TableRow>
                
                {isExpanded && (
                    <TableRow className="bg-muted/50">
                        <TableCell colSpan={9} className="p-4">
                            <div className="pl-12">
                                <h4 className="mb-2 font-semibold text-sm uppercase tracking-wider text-muted-foreground">Plano de Ação</h4>
                                {meta.acoes.length > 0 ? (
                                    <ul className="list-disc pl-5 space-y-1">
                                        {meta.acoes.map((acao: any) => (
                                            <li key={acao.id} className="text-sm">{acao.descricao}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">Nenhuma ação cadastrada para este departamento.</p>
                                )}
                                
                                {monitoramento?.justificativa && (
                                    <div className="mt-4 p-3 border rounded bg-background">
                                        <p className="text-xs font-bold text-muted-foreground mb-1">Última Justificativa:</p>
                                        <p className="text-sm">{monitoramento.justificativa}</p>
                                    </div>
                                )}
                            </div>
                        </TableCell>
                    </TableRow>
                )}
              </Fragment>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
