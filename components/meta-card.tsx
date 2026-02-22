'use client'

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
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
        className="flex flex-col w-full h-auto min-h-0 shadow-sm hover:shadow-md transition-shadow border-t-4 border-t-primary/20"
    >
      <CardHeader className="pb-2 shrink-0 h-auto bg-slate-50/50 rounded-t-xl border-b border-slate-100">
        <div className="flex justify-between items-center gap-2">
             <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-1 rounded w-fit shrink-0">
                Meta {meta.numero}
            </span>
            <Badge className={clsx("text-white shrink-0 gap-1 pl-1 pr-2", statusConfig.color)}>
                <StatusIcon className="w-3 h-3" />
                {status}
            </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex flex-col gap-4 pt-5">
        
        {/* 1. DESCRIÇÃO DA META */}
        <div className="w-full h-auto whitespace-normal break-words min-w-0">
             <h3 className="text-lg font-bold leading-normal text-slate-900">
                {meta.descricao}
             </h3>
        </div>

        {/* 2. INDICADOR */}
        <div className="w-full h-auto whitespace-normal break-words flex flex-col space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-100">
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Indicador
             </span>
             <p className="text-sm font-medium leading-relaxed text-slate-700">
                {meta.indicadorNome}
             </p>
        </div>

        {/* 3. PROGRESSO */}
        <div className="space-y-2 w-full">
            <div className="flex justify-between text-sm font-medium">
                <span className="text-muted-foreground">Progresso ({meta.unidadeMedida})</span>
                <span className="font-mono">{realizado} / {meta.metaFisica2026}</span>
            </div>
            <Progress value={percent} className={clsx("h-2.5", statusConfig.color)} />
        </div>

        {/* 4. PLANO DE AÇÃO */}
        {meta.acoes && meta.acoes.length > 0 && (
            <div className="space-y-3 pt-2 w-full h-auto whitespace-normal break-words">
                <div className="flex items-center gap-2">
                    <Separator className="flex-1" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Plano de Ação</span>
                    <Separator className="flex-1" />
                </div>
                <ul className="space-y-3">
                    {meta.acoes.map((acao: any) => (
                        <li key={acao.id} className="text-sm text-slate-600 flex items-start gap-3">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                            <span className="leading-snug">
                                {acao.descricao}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        )}
        
        {/* 5. JUSTIFICATIVA */}
        {latest?.justificativa && (
             <div className="w-full h-auto whitespace-normal break-words bg-amber-50 border border-amber-200 p-4 rounded-lg text-sm text-amber-900 mt-auto">
                <span className="font-bold block text-xs mb-2 text-amber-700 uppercase">
                    Justificativa ({latest.quadrimestre}º Quad):
                </span>
                <p className="leading-relaxed italic">
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