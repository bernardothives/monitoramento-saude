import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Helper to parse numbers
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

// Precise passwords as requested
const deptPasswords: Record<string, string> = {
  "Planejamento": "plan2026",
  "Atenção Primária": "primaria",
  "Atenção Especializada": "especial",
  "Regulação": "regula",
  "Vigilância Epidemiológica": "vigepe",
  "Vigilância Sanitária": "visa",
  "Educação Permanente do SUS": "educasus",
  "Direção Geral": "direcao"
};

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Clear Database
  await prisma.acao.deleteMany();
  await prisma.monitoramento.deleteMany();
  await prisma.meta.deleteMany();
  await prisma.objetivo.deleteMany();
  await prisma.diretriz.deleteMany();
  await prisma.departamento.deleteMany();

  // 2. Create Admin Department
  const deptAdmin = await prisma.departamento.create({
    data: {
      nome: 'Planejamento',
      isAdmin: true,
      senha: deptPasswords['Planejamento'], 
    }
  });
  console.log(`✅ Admin created: ${deptAdmin.nome} (Password: ${deptPasswords['Planejamento']})`);

  // 3. Read JSON (Correct path: monitor-metas/dados.json)
  const jsonPath = path.join(__dirname, '../dados.json'); 
  console.log(`📂 Reading JSON from: ${jsonPath}`);
  
  if (!fs.existsSync(jsonPath)) {
      console.error(`❌ ERROR: File not found at ${jsonPath}`);
      process.exit(1);
  }

  const rawData = fs.readFileSync(jsonPath, 'utf-8');
  const data = JSON.parse(rawData);

  const diretrizMap = new Map<string, string>();
  const objetivoMap = new Map<string, string>();

  // 4. Iterate Departments
  for (const deptData of data.departamentos) {
    let deptName = deptData.nome.trim();
    
    // STRICT Rename Rule
    if (deptName === 'Amarelo') {
      console.log('⚠️  Renaming "Amarelo" to "Educação Permanente do SUS"');
      deptName = 'Educação Permanente do SUS';
    }

    // Default password fallback if name doesn't match exactly (shouldn't happen with correct list)
    const password = deptPasswords[deptName] || "temp1234";

    if (password === "temp1234") {
        console.warn(`⚠️  Warning: No specific password found for "${deptName}". Using default.`);
    }

    // Create Department
    const dept = await prisma.departamento.create({
      data: {
        nome: deptName,
        isAdmin: false,
        senha: password
      }
    });
    console.log(`🏢 Department processed: ${dept.nome} (Password: ${password})`);

    // Iterate Diretrizes
    if (deptData.diretrizes) {
      for (const dirData of deptData.diretrizes) {
        const dirJsonId = dirData.id;
        const dirTitle = `DIRETRIZ ${dirJsonId}`; 
        
        let diretrizId = diretrizMap.get(dirJsonId);

        if (!diretrizId) {
            const newDir = await prisma.diretriz.create({
                data: {
                    titulo: dirTitle,
                    descricao: dirData.descricao
                }
            });
            diretrizId = newDir.id;
            diretrizMap.set(dirJsonId, diretrizId);
        }

        if (dirData.objetivos) {
            for (const objData of dirData.objetivos) {
                const objJsonId = objData.id;
                const objMapKey = `${dirJsonId}-${objJsonId}`;
                let objetivoId = objetivoMap.get(objMapKey);

                if (!objetivoId) {
                     const newObj = await prisma.objetivo.create({
                        data: {
                            titulo: `OBJETIVO ${objData.id}`, 
                            descricao: objData.descricao,
                            diretrizId: diretrizId
                        }
                     });
                     objetivoId = newObj.id;
                     objetivoMap.set(objMapKey, objetivoId);
                }

                if (objData.metas) {
                    for (const metaData of objData.metas) {
                        const valBase = parseValue(metaData.valor_base);
                        const metaFisica = parseValue(metaData.meta_fisica_2026);
                        
                        const meta = await prisma.meta.create({
                            data: {
                                numero: metaData.numero.toString(),
                                descricao: metaData.descricao,
                                indicadorNome: metaData.indicador,
                                unidadeMedida: metaData.unidade_medida,
                                linhaBaseAno: metaData.ano_base || 2024,
                                linhaBaseValor: valBase,
                                metaPlano2029: metaData.meta_plano_2026_2029?.toString() || "",
                                metaFisica2026: metaFisica,
                                objetivoId: objetivoId,
                                departamentoId: dept.id
                            }
                        });

                        if (metaData.acoes) {
                            for (const acaoData of metaData.acoes) {
                                await prisma.acao.create({
                                    data: {
                                        descricao: acaoData.descricao,
                                        metaId: meta.id,
                                        departamentoId: dept.id
                                    }
                                });
                            }
                        }
                    }
                }
            }
        }
      }
    }
  }

  console.log('✅ Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
