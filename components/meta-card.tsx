'use client'

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { UpdateMetaSheet } from "./update-meta-sheet"
import { clsx } from "clsx"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, AlertCircle, Clock } from "lucide-react"

export function MetaCard({ meta }: { meta: any }) {
  // Find latest monitoramento
  const sortedMonitoramentos = meta.monitoramentos?.sort((a: any, b: any) => {
    if (a.quadrimestre !== b.quadrimestre) return b.quadrimestre - a.quadrimestre;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
  
  const latest = sortedMonitoramentos?.[0];
  const realizado = latest?.valorRealizado || 0;
  const target = meta.metaFisica2026 || 1; 
  const percent = Math.min((realizado / target) * 100, 100);
  
  const status = latest?.statusRAG || "PENDENTE";
  
  const statusConfig = {
    "VERDE": { color: "bg-green-500", icon: CheckCircle2, text: "No Prazo" },
    "AMARELO": { color: "bg-yellow-500", icon: Clock, text: "Atenção" },
    "VERMELHO": { color: "bg-red-500", icon: AlertCircle, text: "Atrasado" },
    "PENDENTE": { color: "bg-slate-400", icon: Clock, text: "Pendente" }
  }[status as string] || { color: "bg-slate-400", icon: Clock, text: "Pendente" };

  const StatusIcon = statusConfig.icon;

  return (
    <Card 
        className="flex flex-col w-full shadow-sm hover:shadow-md transition-shadow border-t-4 border-t-primary/20"
        style={{ height: 'auto', minHeight: 0 }} // Force auto height
    >
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-2">
            <div className="flex justify-between items-start gap-2">
                 <span className="text-xs font-mono text-muted-foreground bg-slate-100 px-2 py-1 rounded w-fit shrink-0">
                    Meta {meta.numero}
                </span>
                <Badge className={clsx("text-white shrink-0 gap-1 pl-1 pr-2", statusConfig.color)}>
                    <StatusIcon className="w-3 h-3" />
                    {status}
                </Badge>
            </div>
            {/* Title flows naturally with break-words */}
            <CardTitle 
                className="text-lg font-bold leading-relaxed mt-1 whitespace-normal break-words"
                style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
            >
                {meta.descricao}
            </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="flex flex-col gap-4">
        {/* Indicator Section - Explicit Block with Fluid Height */}
        <div 
            className="flex flex-col space-y-1 bg-slate-50 p-3 rounded-md border border-slate-100"
            style={{ height: 'auto' }}
        >
             <span className="text-xs font-semibold text-muted-foreground uppercase">Indicador</span>
             <p 
                className="text-sm font-medium leading-relaxed whitespace-normal break-words"
                style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
             >
                {meta.indicadorNome}
             </p>
        </div>

        {/* Progress Section */}
        <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
                <span className="text-muted-foreground">Progresso ({meta.unidadeMedida})</span>
                <span>{realizado} / {meta.metaFisica2026}</span>
            </div>
            <Progress value={percent} className={clsx("h-2.5", statusConfig.color)} />
        </div>

        {/* Actions Section */}
        {meta.acoes && meta.acoes.length > 0 && (
            <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                    <Separator className="flex-1" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Plano de Ação</span>
                    <Separator className="flex-1" />
                </div>
                <ul className="space-y-2">
                    {meta.acoes.map((acao: any) => (
                        <li key={acao.id} className="text-sm text-slate-600 flex items-start gap-2">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                            <span 
                                className="leading-snug whitespace-normal break-words"
                                style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                            >
                                {acao.descricao}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        )}
        
        {latest?.justificativa && (
             <div 
                className="bg-amber-50 border border-amber-200 p-3 rounded-md text-sm text-amber-800 italic"
                style={{ height: 'auto' }}
             >
                <span className="font-semibold not-italic block text-xs mb-1">Justificativa ({latest.quadrimestre}º Quad):</span>
                <p 
                    className="whitespace-normal break-words leading-relaxed"
                    style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                >
                    "{latest.justificativa}"
                </p>
             </div>
        )}
      </CardContent>
      <CardFooter className="pt-2 mt-auto">
        <UpdateMetaSheet meta={meta}>
            <Button className="w-full font-semibold" size="lg">
                Atualizar Monitoramento
            </Button>
        </UpdateMetaSheet>
      </CardFooter>
    </Card>
  )
}