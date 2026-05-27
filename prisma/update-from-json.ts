/**
 * Script NÃO-DESTRUTIVO de atualização das metas a partir do dados.json.
 *
 * O QUE FAZ:
 *  - Cria/atualiza Diretrizes, Objetivos, Metas e Ações conforme o JSON.
 *  - Preserva 100% dos dados de uso: Monitoramentos e Ações em execução.
 *
 * O QUE NÃO FAZ:
 *  - Nunca apaga monitoramentos.
 *  - Nunca reseta o campo emExecucao das ações.
 *  - Nunca apaga registros que estão no banco mas sumiram do JSON
 *    (apenas avisa). Use --apply-deletes para remover de fato.
 *
 * USO:
 *   npx tsx prisma/update-from-json.ts            (dry-run, mostra o que faria)
 *   npx tsx prisma/update-from-json.ts --apply    (aplica as mudanças)
 *   npx tsx prisma/update-from-json.ts --apply --apply-deletes
 *       (aplica e também REMOVE metas/ações que sumiram do JSON;
 *        cuidado: remoção em cascata também apaga monitoramentos dessas metas)
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const APPLY = process.argv.includes('--apply');
const APPLY_DELETES = process.argv.includes('--apply-deletes');

function parseValue(val: string | number): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  let clean = val.replace('%', '').trim();
  if (/^\d+$/.test(clean)) return parseFloat(clean);
  if (clean.includes('.') && !clean.includes(',')) return parseFloat(clean);
  if (clean.includes(',')) {
    clean = clean.replace(/\./g, '');
    clean = clean.replace(',', '.');
  }
  const result = parseFloat(clean);
  return isNaN(result) ? 0 : result;
}

type Summary = {
  diretrizes: { created: number; updated: number };
  objetivos: { created: number; updated: number };
  metas: { created: number; updated: number };
  acoes: { created: number; updated: number };
  warnings: string[];
  deletions: { metas: string[]; acoes: string[] };
};

async function main() {
  const mode = APPLY ? '✏️  APPLY' : '👁️  DRY-RUN';
  console.log(`\n${mode} — atualizando estrutura de metas a partir do dados.json\n`);

  const jsonPath = path.join(__dirname, '../dados.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ Arquivo não encontrado: ${jsonPath}`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  const summary: Summary = {
    diretrizes: { created: 0, updated: 0 },
    objetivos: { created: 0, updated: 0 },
    metas: { created: 0, updated: 0 },
    acoes: { created: 0, updated: 0 },
    warnings: [],
    deletions: { metas: [], acoes: [] },
  };

  // Track all keys we see in the JSON, to later detect orphans in DB
  const seenMetaKeys = new Set<string>(); // `${numero}|${objetivoId}|${departamentoId}`
  const seenAcaoKeys = new Set<string>(); // `${numeroJson}|${metaId}`

  for (const deptData of data.departamentos) {
    let deptName = deptData.nome.trim();
    if (deptName === 'Amarelo') deptName = 'Educação Permanente do SUS';

    const dept = await prisma.departamento.findUnique({ where: { nome: deptName } });
    if (!dept) {
      summary.warnings.push(`Departamento "${deptName}" não existe no banco — pulando. Crie pelo seed inicial primeiro.`);
      continue;
    }

    for (const dirData of deptData.diretrizes || []) {
      const dirTitle = `DIRETRIZ ${dirData.id}`;

      // Upsert Diretriz (chave: titulo unique)
      const existingDir = await prisma.diretriz.findUnique({ where: { titulo: dirTitle } });
      let diretriz;
      if (existingDir) {
        if (existingDir.descricao !== dirData.descricao) {
          if (APPLY) {
            diretriz = await prisma.diretriz.update({
              where: { titulo: dirTitle },
              data: { descricao: dirData.descricao },
            });
          } else {
            diretriz = existingDir;
          }
          summary.diretrizes.updated++;
          console.log(`  ~ Diretriz atualizada: ${dirTitle}`);
        } else {
          diretriz = existingDir;
        }
      } else {
        if (APPLY) {
          diretriz = await prisma.diretriz.create({
            data: { titulo: dirTitle, descricao: dirData.descricao },
          });
        } else {
          diretriz = { id: '<seria-criada>', titulo: dirTitle, descricao: dirData.descricao };
        }
        summary.diretrizes.created++;
        console.log(`  + Diretriz criada: ${dirTitle}`);
      }

      for (const objData of dirData.objetivos || []) {
        const objTitle = `OBJETIVO ${objData.id}`;

        const existingObj = await prisma.objetivo.findUnique({
          where: { titulo_diretrizId: { titulo: objTitle, diretrizId: diretriz.id } },
        });
        let objetivo;
        if (existingObj) {
          if (existingObj.descricao !== objData.descricao) {
            if (APPLY) {
              objetivo = await prisma.objetivo.update({
                where: { id: existingObj.id },
                data: { descricao: objData.descricao },
              });
            } else {
              objetivo = existingObj;
            }
            summary.objetivos.updated++;
            console.log(`    ~ Objetivo atualizado: ${objTitle} (${dirTitle})`);
          } else {
            objetivo = existingObj;
          }
        } else {
          if (APPLY) {
            objetivo = await prisma.objetivo.create({
              data: { titulo: objTitle, descricao: objData.descricao, diretrizId: diretriz.id },
            });
          } else {
            objetivo = { id: '<seria-criado>', titulo: objTitle, descricao: objData.descricao, diretrizId: diretriz.id };
          }
          summary.objetivos.created++;
          console.log(`    + Objetivo criado: ${objTitle} (${dirTitle})`);
        }

        for (const metaData of objData.metas || []) {
          const metaKey = `${metaData.numero}|${objetivo.id}|${dept.id}`;
          seenMetaKeys.add(metaKey);

          const metaPayload = {
            descricao: metaData.descricao,
            indicadorNome: metaData.indicador,
            unidadeMedida: metaData.unidade_medida,
            linhaBaseAno: metaData.ano_base || 2024,
            linhaBaseValor: parseValue(metaData.valor_base),
            metaPlano2029: metaData.meta_plano_2026_2029?.toString() || '',
            metaFisica2026: parseValue(metaData.meta_fisica_2026),
          };

          const existingMeta = objetivo.id !== '<seria-criado>'
            ? await prisma.meta.findUnique({
                where: {
                  numero_objetivoId_departamentoId: {
                    numero: metaData.numero,
                    objetivoId: objetivo.id,
                    departamentoId: dept.id,
                  },
                },
              })
            : null;

          let meta;
          if (existingMeta) {
            const changed =
              existingMeta.descricao !== metaPayload.descricao ||
              existingMeta.indicadorNome !== metaPayload.indicadorNome ||
              existingMeta.unidadeMedida !== metaPayload.unidadeMedida ||
              existingMeta.linhaBaseAno !== metaPayload.linhaBaseAno ||
              existingMeta.linhaBaseValor !== metaPayload.linhaBaseValor ||
              existingMeta.metaPlano2029 !== metaPayload.metaPlano2029 ||
              existingMeta.metaFisica2026 !== metaPayload.metaFisica2026;

            if (changed) {
              if (APPLY) {
                meta = await prisma.meta.update({ where: { id: existingMeta.id }, data: metaPayload });
              } else {
                meta = existingMeta;
              }
              summary.metas.updated++;
              console.log(`      ~ Meta atualizada: ${metaData.numero} (${deptName})`);
            } else {
              meta = existingMeta;
            }
          } else {
            if (APPLY) {
              meta = await prisma.meta.create({
                data: {
                  numero: metaData.numero,
                  ...metaPayload,
                  objetivoId: objetivo.id,
                  departamentoId: dept.id,
                },
              });
            } else {
              meta = { id: '<seria-criada>', numero: metaData.numero, departamentoId: dept.id };
            }
            summary.metas.created++;
            console.log(`      + Meta criada: ${metaData.numero} (${deptName})`);
          }

          for (const acaoData of metaData.acoes || []) {
            const acaoKey = `${acaoData.id}|${meta.id}`;
            seenAcaoKeys.add(acaoKey);

            const existingAcao = meta.id !== '<seria-criada>'
              ? await prisma.acao.findUnique({
                  where: { numeroJson_metaId: { numeroJson: acaoData.id, metaId: meta.id } },
                })
              : null;

            if (existingAcao) {
              if (existingAcao.descricao !== acaoData.descricao) {
                if (APPLY) {
                  await prisma.acao.update({
                    where: { id: existingAcao.id },
                    data: { descricao: acaoData.descricao },
                  });
                }
                summary.acoes.updated++;
                console.log(`        ~ Ação atualizada: meta ${metaData.numero} ação #${acaoData.id}`);
              }
            } else {
              if (APPLY) {
                await prisma.acao.create({
                  data: {
                    numeroJson: acaoData.id,
                    descricao: acaoData.descricao,
                    metaId: meta.id,
                    departamentoId: dept.id,
                  },
                });
              }
              summary.acoes.created++;
              console.log(`        + Ação criada: meta ${metaData.numero} ação #${acaoData.id}`);
            }
          }
        }
      }
    }
  }

  // Detect orphans (registros no DB que sumiram do JSON)
  const allMetasInDb = await prisma.meta.findMany({ select: { id: true, numero: true, objetivoId: true, departamentoId: true, departamento: { select: { nome: true } } } });
  for (const m of allMetasInDb) {
    const key = `${m.numero}|${m.objetivoId}|${m.departamentoId}`;
    if (!seenMetaKeys.has(key)) {
      summary.deletions.metas.push(`Meta ${m.numero} (${m.departamento.nome}) [id=${m.id}]`);
    }
  }

  const allAcoesInDb = await prisma.acao.findMany({ select: { id: true, numeroJson: true, metaId: true, descricao: true } });
  for (const a of allAcoesInDb) {
    const key = `${a.numeroJson}|${a.metaId}`;
    if (!seenAcaoKeys.has(key)) {
      summary.deletions.acoes.push(`Ação #${a.numeroJson} [id=${a.id}] "${a.descricao.slice(0, 60)}..."`);
    }
  }

  if (APPLY && APPLY_DELETES && (summary.deletions.metas.length || summary.deletions.acoes.length)) {
    console.log('\n🗑️  Removendo órfãos (--apply-deletes)...');
    for (const a of allAcoesInDb) {
      const key = `${a.numeroJson}|${a.metaId}`;
      if (!seenAcaoKeys.has(key)) {
        await prisma.acao.delete({ where: { id: a.id } });
      }
    }
    for (const m of allMetasInDb) {
      const key = `${m.numero}|${m.objetivoId}|${m.departamentoId}`;
      if (!seenMetaKeys.has(key)) {
        await prisma.monitoramento.deleteMany({ where: { metaId: m.id } });
        await prisma.acao.deleteMany({ where: { metaId: m.id } });
        await prisma.meta.delete({ where: { id: m.id } });
      }
    }
  }

  console.log('\n📊 Resumo:');
  console.log(`  Diretrizes — criadas: ${summary.diretrizes.created}, atualizadas: ${summary.diretrizes.updated}`);
  console.log(`  Objetivos  — criados:  ${summary.objetivos.created}, atualizados: ${summary.objetivos.updated}`);
  console.log(`  Metas      — criadas: ${summary.metas.created}, atualizadas: ${summary.metas.updated}`);
  console.log(`  Ações      — criadas: ${summary.acoes.created}, atualizadas: ${summary.acoes.updated}`);

  if (summary.deletions.metas.length || summary.deletions.acoes.length) {
    console.log('\n⚠️  Itens no banco que NÃO estão mais no JSON:');
    summary.deletions.metas.forEach(m => console.log(`  - ${m}`));
    summary.deletions.acoes.forEach(a => console.log(`  - ${a}`));
    if (!APPLY_DELETES) {
      console.log('\n  (Nenhum item foi removido. Use --apply-deletes para remover de fato.)');
      console.log('  ⚠️  Remover uma Meta também apaga seus monitoramentos!');
    }
  }

  if (summary.warnings.length) {
    console.log('\n⚠️  Avisos:');
    summary.warnings.forEach(w => console.log(`  - ${w}`));
  }

  if (!APPLY) {
    console.log('\n👁️  Modo dry-run: nenhuma alteração foi salva. Rode com --apply para aplicar.');
  } else {
    console.log('\n✅ Alterações aplicadas. Monitoramentos e status de execução foram preservados.');
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
