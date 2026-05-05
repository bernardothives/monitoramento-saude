"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts'
import { AdminFilter } from "@/app/dashboard/admin-filter"
import { DepartmentDashboard } from "./department-dashboard"
import { PdfGeneratorButton } from "./pdf-generator-button"
import { Users, Target, CheckCircle2 } from "lucide-react"

interface AdminDashboardProps {
  stats: {
    totalMetas: number
    completedMetas: number
    percentGlobal: number
    chartData: any[]
  }
  acoesStats?: any[]
  departments: { id: string; nome: string }[]
  currentDeptId?: string
  departmentData?: any // Present only if filtered
}

export function AdminDashboard({ stats, acoesStats, departments, currentDeptId, departmentData }: AdminDashboardProps) {
  
  // If a department is selected, we show the filter AND the Dept Dashboard
  if (currentDeptId && departmentData) {
      return (
          <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b pb-4">
                 <div>
                    <h2 className="text-3xl font-bold tracking-tight">Painel de Gestão</h2>
                    <p className="text-muted-foreground">Visão Administrativa</p>
                 </div>
                 <div className="flex flex-col sm:flex-row items-center gap-4">
                     <PdfGeneratorButton />
                     <div className="flex items-center gap-2">
                         <label htmlFor="dept-filter" className="text-sm font-medium">Visualizar Departamento:</label>
                         <AdminFilter id="dept-filter" departments={departments} currentDeptId={currentDeptId} />
                     </div>
                 </div>
              </div>
              
              <DepartmentDashboard data={departmentData} />
          </div>
      )
  }

  // Otherwise, Global Overview
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
         <div>
            <h2 className="text-3xl font-bold tracking-tight">Visão Geral da Prefeitura</h2>
            <p className="text-muted-foreground">Monitoramento consolidado do PAS 2026</p>
         </div>
         <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-lg border">
             <label htmlFor="dept-filter" className="text-sm font-medium">Auditar Departamento:</label>
             <AdminFilter id="dept-filter" departments={departments} currentDeptId={currentDeptId} />
         </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Metas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMetas}</div>
            <p className="text-xs text-muted-foreground">Metas cadastradas em todos os setores</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Metas Concluídas (No Prazo)</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedMetas}</div>
            <p className="text-xs text-muted-foreground">Status "VERDE" no período atual</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Índice de Eficácia Global</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.percentGlobal.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Média ponderada de realização</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Desempenho por Departamento (% Metas no Prazo)</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            {/* Explicit style to prevent Recharts measurement errors */}
            <div style={{ width: '100%', height: 350 }}>
              <ResponsiveContainer width="99%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={stats.chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={150} tick={{fontSize: 12}} />
                  <Tooltip 
                      cursor={{fill: 'transparent'}}
                      contentStyle={{ borderRadius: '8px' }} 
                  />
                  <Bar dataKey="pct" name="% Concluído" radius={[0, 4, 4, 0]}>
                      {stats.chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.pct >= 70 ? '#22c55e' : entry.pct >= 50 ? '#eab308' : '#ef4444'} />
                      ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {acoesStats && (
          <Card>
            <CardHeader>
              <CardTitle>Monitoramento de Ações por Departamento</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer width="99%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart data={acoesStats} layout="vertical" margin={{ left: 20, right: 20 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={150} tick={{fontSize: 12}} />
                    <Tooltip 
                        cursor={{fill: 'transparent'}}
                        contentStyle={{ borderRadius: '8px' }} 
                    />
                    <Legend />
                    <Bar dataKey="emExecucao" name="Realizando" stackId="a" fill="#22c55e" />
                    <Bar dataKey="naoIniciadas" name="Pendente" stackId="a" fill="#94a3b8" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
