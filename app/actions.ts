'use server'

import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

// +++ Helper de Segurança: Sanitização de Input +++
function sanitize(input: string | null | undefined): string {
  if (!input) return "";
  // Remove todas as tags HTML para prevenir XSS.
  return input.replace(/<[^>]*>?/gm, '');
}

// ... (Existing login/logout logic remains) ...
export async function login(prevState: any, formData: FormData) {
  const deptId = formData.get('deptId') as string;
  const password = formData.get('password') as string;

  if (!deptId || !password) {
    return { error: 'Preencha todos os campos.' };
  }

  const dept = await db.departamento.findUnique({
    where: { id: deptId },
  });

  if (!dept || dept.senha !== password) {
    return { error: 'Departamento ou senha incorretos.' };
  }

  const cookieStore = await cookies();
  cookieStore.set('dept_id', dept.id, { httpOnly: true });
  cookieStore.set('is_admin', dept.isAdmin ? 'true' : 'false', { httpOnly: true });

  redirect('/dashboard');
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('dept_id');
  cookieStore.delete('is_admin');
  redirect('/login');
}

export async function getDepartments() {
  return await db.departamento.findMany({
    orderBy: { nome: 'asc' },
    select: { id: true, nome: true },
  });
}

export async function getCurrentUser() {
    const cookieStore = await cookies();
    const deptId = cookieStore.get('dept_id')?.value;
    const isAdmin = cookieStore.get('is_admin')?.value === 'true';
    
    if (!deptId) return null;

    const dept = await db.departamento.findUnique({
        where: { id: deptId },
        select: { id: true, nome: true, isAdmin: true }
    });

    return dept;
}

// Main hierarchical fetch
export async function getHierarchicalData(targetDeptId?: string) {
  const cookieStore = await cookies();
  const currentDeptId = cookieStore.get('dept_id')?.value;
  const isAdmin = cookieStore.get('is_admin')?.value === 'true';

  if (!currentDeptId) redirect('/login');

  // If not admin, force own dept
  const filterDeptId = isAdmin ? (targetDeptId || currentDeptId) : currentDeptId;

  const data = await db.diretriz.findMany({
    where: {
      objetivos: {
        some: {
          metas: {
            some: {
              departamentoId: filterDeptId
            }
          }
        }
      }
    },
    include: {
      objetivos: {
        where: {
          metas: {
            some: {
              departamentoId: filterDeptId
            }
          }
        },
        include: {
          metas: {
            where: {
              departamentoId: filterDeptId
            },
            orderBy: { numero: 'asc' }, 
            include: {
              acoes: {
                  where: {
                      departamentoId: filterDeptId
                  }
              },
              monitoramentos: {
                  where: {
                      ano: 2026 
                  },
                  orderBy: { quadrimestre: 'desc' },
                  take: 1 
              }
            }
          }
        }
      }
    }
  });

  return { data, filterDeptId };
}

// New: Global Stats for Admin
export async function getGlobalStats() {
    const metas = await db.meta.findMany({
        include: {
            departamento: true,
            monitoramentos: {
                where: { ano: 2026 },
                orderBy: { quadrimestre: 'desc' },
                take: 1
            }
        }
    });

    const totalMetas = metas.length;
    let completedMetas = 0;
    
    // Group by Dept for Chart
    const deptStatsMap: Record<string, { total: number, completed: number }> = {};

    metas.forEach(m => {
        const latest = m.monitoramentos[0];
        const isGreen = latest?.statusRAG === 'VERDE';
        if (isGreen) completedMetas++;

        const deptName = m.departamento.nome;
        if (!deptStatsMap[deptName]) deptStatsMap[deptName] = { total: 0, completed: 0 };
        
        deptStatsMap[deptName].total++;
        if (isGreen) deptStatsMap[deptName].completed++;
    });

    const percentGlobal = totalMetas > 0 ? (completedMetas / totalMetas) * 100 : 0;
    
    const chartData = Object.entries(deptStatsMap).map(([name, stat]) => ({
        name: name,
        pct: stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0
    })).sort((a, b) => b.pct - a.pct); // Top performers first

    return {
        totalMetas,
        completedMetas,
        percentGlobal,
        chartData
    };
}


export async function updateMonitoramento(prevState: any, formData: FormData) {
  const metaId = formData.get('metaId') as string;
  const quadrimestre = parseInt(formData.get('quadrimestre') as string);
  const valorRealizadoStr = formData.get('valorRealizado') as string;
  const justificativa = sanitize(formData.get('justificativa') as string);

  if (!metaId) return { error: "Meta ID ausente." };

  try {
    // IDOR PROTECTION: Check user permissions
    const cookieStore = await cookies();
    const deptId = cookieStore.get('dept_id')?.value;
    const isAdmin = cookieStore.get('is_admin')?.value === 'true';

    if (!deptId) return { error: "Usuário não autenticado." };

    const meta = await db.meta.findUnique({ where: { id: metaId } });
    if (!meta) return { error: "Meta não encontrada." };

    // Enforce ownership unless admin
    if (!isAdmin && meta.departamentoId !== deptId) {
      return { error: "Acesso não autorizado para editar esta meta." };
    }

    const valorRealizado = parseFloat(valorRealizadoStr);
    
    // Status Logic
    let statusRAG = "PENDENTE";
    
    if (!isNaN(valorRealizado)) {
        const target = meta.metaFisica2026;
        const base = meta.linhaBaseValor;
        
        let performance = 0; 
        
        // Zero-division check
        if (target > 0) {
            if (target > base) {
                performance = valorRealizado / target;
            } else if (target < base) {
                 if (valorRealizado <= target) performance = 1.1; // Exceeded goal
                 else if (valorRealizado < base) performance = 0.8; // Better than baseline
                 else performance = 0.5; // Worse than baseline
            } else { // target === base
                if (valorRealizado === target) performance = 1;
                else performance = 0.5; 
            }
        } else { // target is 0 or negative, handle appropriately
            if (valorRealizado === target) performance = 1.1; // Met the zero target
            else if (valorRealizado > 0 && meta.tipoMeta === 'REDUZIR') performance = 0.5; // Failed to reduce to zero
            else performance = 0; // Default case
        }
        
        if (performance >= 1) statusRAG = "VERDE";
        else if (performance >= 0.7) statusRAG = "AMARELO";
        else statusRAG = "VERMELHO";
    }

    await db.monitoramento.upsert({
      where: {
        metaId_quadrimestre_ano: {
          metaId,
          quadrimestre,
          ano: 2026
        }
      },
      create: {
        metaId,
        quadrimestre,
        ano: 2026,
        valorRealizado: isNaN(valorRealizado) ? null : valorRealizado,
        justificativa,
        statusRAG
      },
      update: {
        valorRealizado: isNaN(valorRealizado) ? null : valorRealizado,
        justificativa,
        statusRAG
      }
    });

    revalidatePath('/dashboard');
    return { success: true, message: "Monitoramento salvo com sucesso!" };
  } catch (e) {
    console.error(e);
    return { error: "Erro interno ao salvar." };
  }
}
