'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts'

const COLORS = {
  VERDE: '#22c55e', // green-500
  AMARELO: '#eab308', // yellow-500
  VERMELHO: '#ef4444', // red-500
  PENDENTE: '#94a3b8' // slate-400
};

export function AdminCharts({ metas, departments }: { metas: any[], departments: any[] }) {
  
  // 1. Status Distribution (Pie Chart)
  const statusCounts = { VERDE: 0, AMARELO: 0, VERMELHO: 0, PENDENTE: 0 };
  
  metas.forEach(m => {
     const sorted = m.monitoramentos?.sort((a: any, b: any) => b.quadrimestre - a.quadrimestre) || [];
     const status = (sorted[0]?.statusRAG || "PENDENTE") as keyof typeof statusCounts;
     if (statusCounts[status] !== undefined) statusCounts[status]++;
  });

  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  // 2. Dept Performance (Bar Chart) - Top 5 by % Completed Metas (Green)
  const deptStats = departments.map(dept => {
      const deptMetas = metas.filter(m => m.departamentoId === dept.id);
      const total = deptMetas.length;
      if (total === 0) return null;

      const green = deptMetas.filter(m => {
          const sorted = m.monitoramentos?.sort((a: any, b: any) => b.quadrimestre - a.quadrimestre) || [];
          return sorted[0]?.statusRAG === 'VERDE';
      }).length;

      return {
          name: dept.nome.substring(0, 15) + '...', // Truncate
          pct: Math.round((green / total) * 100),
          total
      };
  }).filter(Boolean).sort((a, b) => b!.pct - a!.pct).slice(0, 7);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <Card>
        <CardHeader>
          <CardTitle>Status das Metas (Global)</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Performance (% Metas Verdes)</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={deptStats as any[]}>
              <XAxis dataKey="name" fontSize={10} angle={-15} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip cursor={{fill: 'transparent'}} />
              <Bar dataKey="pct" name="% Concluído" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
