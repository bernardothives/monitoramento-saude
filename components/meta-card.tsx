'use client'

import { useState, useTransition } from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { UpdateMetaSheet } from "./update-meta-sheet"
import { clsx } from "clsx"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, AlertCircle, Clock } from "lucide-react"
import { toggleAcaoExecution } from "@/app/actions"

function AcaoItem({ acao }: { acao: any }) {
    const [isPending, startTransition] = useTransition();
    const [emExecucao, setEmExecucao] = useState(acao.emExecucao || false);

    const handleToggle = () => {
        const newState = !emExecucao;
        setEmExecucao(newState);
        startTransition(async () => {
            const result = await toggleAcaoExecution(acao.id, newState);
            if (result?.error) {
                // Revert on error
                setEmExecucao(!newState);
                alert(result.error);
            }
        });
    };

    return (
        <li className="text-sm text-slate-600 flex items-center justify-between gap-3 p-2 rounded-md hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
            <div className="flex items-start gap-3">
                <span className={clsx("mt-1.5 w-2 h-2 rounded-full shrink-0", emExecucao ? "bg-green-500" : "bg-slate-300")} />
                <span className="leading-snug">
                    {acao.descricao}
                </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <span className={clsx("text-xs font-medium", emExecucao ? "text-green-600" : "text-slate-400")}>
                    {emExecucao ? "Realizando" : "Pendente"}
                </span>
                <button
                    type="button"
                    role="switch"
                    aria-checked={emExecucao}
                    onClick={handleToggle}
                    disabled={isPending}
                    className={clsx(
                        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                        emExecucao ? "bg-green-500" : "bg-slate-200"
                    )}
                >
                    <span
                        className={clsx(
                            "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform",
                            emExecucao ? "translate-x-4" : "translate-x-0"
                        )}
                    />
                </button>
            </div>
        </li>
    );
}

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
    <article 
        className="flex flex-col w-full h-auto min-h-0 shadow-sm hover:shadow-md transition-shadow border-t-4 border-t-primary/20 bg-card text-card-foreground rounded-xl border py-6"
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
                <ul className="space-y-2">
                    {meta.acoes.map((acao: any) => (
                        <AcaoItem key={acao.id} acao={acao} />
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
    </article>
  )
}