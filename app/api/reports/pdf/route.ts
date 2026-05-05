import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/app/actions";
import PDFDocument from "pdfkit";
import archiver from "archiver";
import { Writable } from "stream";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !user.isAdmin) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const quadrimestreStr = searchParams.get("quadrimestre");
  const quadrimestre = quadrimestreStr ? parseInt(quadrimestreStr) : 1;

  try {
    const departments = await db.departamento.findMany({
      include: {
        metas: {
          include: {
            objetivo: {
              include: {
                diretriz: true
              }
            },
            acoes: true, // +++ FETCH ACOES
            monitoramentos: {
              where: {
                ano: 2026,
                quadrimestre: quadrimestre
              }
            }
          }
        }
      }
    });

    const buffers: Buffer[] = [];
    const writable = new Writable({
      write(chunk, encoding, callback) {
        buffers.push(chunk);
        callback();
      }
    });

    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    archive.pipe(writable);

    for (const dept of departments) {
      // Generate for all departments that have metas
      if (dept.metas.length === 0) continue;

      const doc = new PDFDocument({ margin: 50 });
      const pdfBuffers: Buffer[] = [];
      
      const pdfWritable = new Writable({
        write(chunk, encoding, callback) {
          pdfBuffers.push(chunk);
          callback();
        }
      });
      doc.pipe(pdfWritable);

      // Helper to handle text cleanly (pdfkit default fonts don't always like special chars, but Helvetica is usually ok for pt-BR)
      doc.font('Helvetica-Bold');
      doc.fontSize(20).text(`Relatório de Monitoramento - ${dept.nome}`, { align: 'center' });
      doc.moveDown();
      doc.font('Helvetica');
      doc.fontSize(14).text(`Quadrimestre: ${quadrimestre} / Ano: 2026`, { align: 'center' });
      doc.moveDown(2);

      let currentDiretrizId = "";
      let currentObjetivoId = "";

      const sortedMetas = dept.metas.sort((a, b) => {
          if (a.objetivo.diretriz.id !== b.objetivo.diretriz.id) return a.objetivo.diretriz.titulo.localeCompare(b.objetivo.diretriz.titulo);
          if (a.objetivo.id !== b.objetivo.id) return a.objetivo.titulo.localeCompare(b.objetivo.titulo);
          return a.numero.localeCompare(b.numero);
      });

      for (const meta of sortedMetas) {
          const diretriz = meta.objetivo.diretriz;
          const objetivo = meta.objetivo;

          if (diretriz.id !== currentDiretrizId) {
              doc.fontSize(14).font('Helvetica-Bold').text(`Diretriz: ${diretriz.titulo}`);
              doc.moveDown(0.5);
              currentDiretrizId = diretriz.id;
          }

          if (objetivo.id !== currentObjetivoId) {
              doc.fontSize(12).font('Helvetica-Bold').text(`Objetivo: ${objetivo.titulo}`, { indent: 20 });
              doc.moveDown(0.5);
              currentObjetivoId = objetivo.id;
          }

          const mon = meta.monitoramentos[0];
          const status = mon ? mon.statusRAG : "PENDENTE";
          const valor = mon && mon.valorRealizado !== null ? mon.valorRealizado : "N/A";
          const justificativa = mon?.justificativa || "Sem justificativa";

          doc.fontSize(11).font('Helvetica-Bold').text(`Meta ${meta.numero}: ${meta.descricao}`, { indent: 40 });
          doc.fontSize(10).font('Helvetica').text(`Meta Física 2026: ${meta.metaFisica2026} | Realizado: ${valor}`, { indent: 60 });
          doc.text(`Status: ${status}`, { indent: 60 });
          if (status !== "VERDE" && status !== "PENDENTE") {
              doc.text(`Justificativa: ${justificativa}`, { indent: 60 });
          }
          
          if (meta.acoes && meta.acoes.length > 0) {
              doc.moveDown(0.5);
              doc.font('Helvetica-Bold').text("Ações Vinculadas:", { indent: 60 });
              doc.font('Helvetica');
              for (const acao of meta.acoes) {
                  const statusAcao = acao.emExecucao ? "[Em Execução]" : "[Pendente]";
                  doc.text(`${statusAcao} ${acao.descricao}`, { indent: 70 });
              }
          }
          doc.moveDown();
      }

      doc.moveDown(4);
      doc.fontSize(12).font('Helvetica').text("________________________________________________", { align: 'center' });
      doc.moveDown();
      doc.text(`Assinatura do(a) Diretor(a) do ${dept.nome}`, { align: 'center' });
      doc.text("Data: ____/____/2026", { align: 'center' });

      doc.end();

      await new Promise((resolve) => {
        pdfWritable.on('finish', resolve);
      });

      const deptBuffer = Buffer.concat(pdfBuffers);
      // Remove accents and spaces for the filename
      const safeDeptName = dept.nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, '_');
      archive.append(deptBuffer, { name: `Relatorio_Quadrimestre_${quadrimestre}_${safeDeptName}.pdf` });
    }

    await archive.finalize();

    await new Promise((resolve) => {
      writable.on('finish', resolve);
    });

    const finalZipBuffer = Buffer.concat(buffers);

    return new NextResponse(finalZipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="Relatorios_Monitoramento_Q${quadrimestre}.zip"`,
      }
    });

  } catch (error) {
    console.error("Error generating PDFs:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
