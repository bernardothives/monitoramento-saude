import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/app/actions";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
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
            acoes: true,
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
      if (dept.metas.length === 0) continue;

      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      let page = pdfDoc.addPage();
      const { width, height } = page.getSize();
      let y = height - 50;
      const margin = 50;
      
      const drawText = (text: string, xPos: number, currentY: number, usedFont: any, size: number, color = rgb(0,0,0)) => {
        // Very basic line wrap logic for pdf-lib to prevent text going off-page
        const words = text.split(' ');
        let line = '';
        let resultY = currentY;

        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const testWidth = usedFont.widthOfTextAtSize(testLine, size);
          if (testWidth > width - margin - xPos && n > 0) {
            if (resultY < 50) {
              page = pdfDoc.addPage();
              resultY = height - 50;
            }
            page.drawText(line, { x: xPos, y: resultY, size, font: usedFont, color });
            line = words[n] + ' ';
            resultY -= (size + 4);
          } else {
            line = testLine;
          }
        }
        if (resultY < 50) {
            page = pdfDoc.addPage();
            resultY = height - 50;
        }
        page.drawText(line, { x: xPos, y: resultY, size, font: usedFont, color });
        return resultY - (size + 4);
      };

      // Header
      const headerText = `Relatorio de Monitoramento - ${dept.nome}`;
      const headerWidth = fontBold.widthOfTextAtSize(headerText, 20);
      y = drawText(headerText, (width - headerWidth) / 2, y, fontBold, 20);
      y -= 10;
      
      const subHeaderText = `Quadrimestre: ${quadrimestre} / Ano: 2026`;
      const subHeaderWidth = font.widthOfTextAtSize(subHeaderText, 14);
      y = drawText(subHeaderText, (width - subHeaderWidth) / 2, y, font, 14);
      y -= 20;

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
              y = drawText(`Diretriz: ${diretriz.titulo}`, margin, y, fontBold, 14);
              y -= 10;
              currentDiretrizId = diretriz.id;
          }

          if (objetivo.id !== currentObjetivoId) {
              y = drawText(`Objetivo: ${objetivo.titulo}`, margin + 20, y, fontBold, 12);
              y -= 10;
              currentObjetivoId = objetivo.id;
          }

          const mon = meta.monitoramentos[0];
          const status = mon ? mon.statusRAG : "PENDENTE";
          const valor = mon && mon.valorRealizado !== null ? mon.valorRealizado : "N/A";
          const justificativa = mon?.justificativa || "Sem justificativa";

          y = drawText(`Meta ${meta.numero}: ${meta.descricao}`, margin + 40, y, fontBold, 11);
          y = drawText(`Meta Fisica 2026: ${meta.metaFisica2026} | Realizado: ${valor}`, margin + 60, y, font, 10);
          
          let statusColor = rgb(0,0,0);
          if (status === "VERDE") statusColor = rgb(0, 0.5, 0);
          if (status === "AMARELO") statusColor = rgb(0.8, 0.6, 0);
          if (status === "VERMELHO") statusColor = rgb(0.8, 0, 0);
          
          y = drawText(`Status: ${status}`, margin + 60, y, fontBold, 10, statusColor);
          
          if (status !== "VERDE" && status !== "PENDENTE") {
              y = drawText(`Justificativa: ${justificativa}`, margin + 60, y, font, 10);
          }
          
          if (meta.acoes && meta.acoes.length > 0) {
              y -= 5;
              y = drawText("Acoes Vinculadas:", margin + 60, y, fontBold, 10);
              for (const acao of meta.acoes) {
                  const statusAcao = acao.emExecucao ? "[Em Execucao]" : "[Pendente]";
                  y = drawText(`${statusAcao} ${acao.descricao}`, margin + 70, y, font, 10);
              }
          }
          y -= 15;
      }

      if (y < 100) {
          page = pdfDoc.addPage();
          y = height - 50;
      }

      y -= 30;
      const lineText = "________________________________________________";
      const lineWidth = font.widthOfTextAtSize(lineText, 12);
      y = drawText(lineText, (width - lineWidth) / 2, y, font, 12);
      
      y -= 5;
      const signText = `Assinatura do(a) Diretor(a) do ${dept.nome}`;
      const signWidth = font.widthOfTextAtSize(signText, 12);
      y = drawText(signText, (width - signWidth) / 2, y, font, 12);

      const dateText = "Data: ____/____/2026";
      const dateWidth = font.widthOfTextAtSize(dateText, 12);
      y = drawText(dateText, (width - dateWidth) / 2, y, font, 12);

      const pdfBytes = await pdfDoc.save();
      const safeDeptName = dept.nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, '_');
      archive.append(Buffer.from(pdfBytes), { name: `Relatorio_Quadrimestre_${quadrimestre}_${safeDeptName}.pdf` });
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
