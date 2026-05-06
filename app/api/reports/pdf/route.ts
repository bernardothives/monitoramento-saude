import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/app/actions";
import { PDFDocument, StandardFonts, rgb, cmyk } from "pdf-lib";
import archiver from "archiver";
import { Writable } from "stream";

// Helper colors for modern design
const colors = {
  primary: rgb(0.12, 0.16, 0.29),      // Slate/Dark Blue
  secondary: rgb(0.33, 0.38, 0.45),    // Grayish
  accent: rgb(0.15, 0.38, 0.82),       // Blue
  lightGray: rgb(0.95, 0.96, 0.97),
  border: rgb(0.85, 0.85, 0.85),
  textMain: rgb(0.1, 0.1, 0.1),
  textMuted: rgb(0.4, 0.4, 0.4),
  success: rgb(0.13, 0.65, 0.36),      // Green
  warning: rgb(0.91, 0.70, 0.04),      // Yellow
  danger: rgb(0.89, 0.26, 0.26),       // Red
  white: rgb(1, 1, 1)
};

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
      let y = height;
      const margin = 40;
      const contentWidth = width - (margin * 2);
      let pageNum = 1;

      // Draw Header function
      const drawPageHeader = () => {
        // Top colored bar
        page.drawRectangle({
          x: 0, y: height - 10, width: width, height: 10, color: colors.accent
        });
        
        y = height - 50;
        
        // Title
        page.drawText("Monitoramento PAS 2026", { x: margin, y, size: 24, font: fontBold, color: colors.primary });
        y -= 15;
        page.drawText(`Relatorio do Departamento: ${dept.nome}`, { x: margin, y, size: 12, font: font, color: colors.secondary });
        
        // Date / Period badge
        const periodText = `Quadrimestre: ${quadrimestre} / Ano: 2026`;
        const periodWidth = fontBold.widthOfTextAtSize(periodText, 10);
        page.drawRectangle({
          x: width - margin - periodWidth - 10, y: y - 5,
          width: periodWidth + 10, height: 18,
          color: colors.lightGray,
          borderColor: colors.border,
          borderWidth: 1
        });
        page.drawText(periodText, { x: width - margin - periodWidth - 5, y: y, size: 10, font: fontBold, color: colors.primary });
        
        y -= 30;
        // Divider
        page.drawLine({
          start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: colors.border
        });
        y -= 25;
      };

      const drawPageFooter = () => {
        page.drawLine({
          start: { x: margin, y: 35 }, end: { x: width - margin, y: 35 }, thickness: 1, color: colors.border
        });
        page.drawText(`Página ${pageNum}`, { x: width - margin - 40, y: 20, size: 9, font: font, color: colors.textMuted });
        page.drawText(`Documento gerado automaticamente pelo Sistema de Monitoramento`, { x: margin, y: 20, size: 8, font: font, color: colors.textMuted });
      };

      // Wrap text helper
      const drawWrappedText = (text: string, xPos: number, currentY: number, usedFont: any, size: number, color = colors.textMain, maxWidth = contentWidth) => {
        text = text || "";
        text = String(text).replace(/[\r\n]+/g, ' '); // Clean newlines
        const words = text.split(' ');
        let line = '';
        let resultY = currentY;

        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const testWidth = usedFont.widthOfTextAtSize(testLine, size);
          
          if (testWidth > maxWidth && n > 0) {
            checkPageBreak(size + 4);
            page.drawText(line, { x: xPos, y: resultY, size, font: usedFont, color });
            line = words[n] + ' ';
            resultY -= (size + 4);
          } else {
            line = testLine;
          }
        }
        checkPageBreak(size + 4);
        page.drawText(line, { x: xPos, y: resultY, size, font: usedFont, color });
        return resultY - (size + 4);
      };

      // Check page break and draw header/footer
      const checkPageBreak = (neededHeight: number) => {
        if (y - neededHeight < 60) {
          drawPageFooter();
          page = pdfDoc.addPage();
          pageNum++;
          drawPageHeader();
        }
      };

      // INIT PAGE 1
      drawPageHeader();

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
              checkPageBreak(60);
              y -= 10;
              // Diretriz Header Block
              page.drawRectangle({ x: margin, y: y - 10, width: contentWidth, height: 25, color: colors.primary });
              y = drawWrappedText(`DIRETRIZ: ${diretriz.titulo.toUpperCase()}`, margin + 10, y - 1, fontBold, 12, colors.white, contentWidth - 20);
              y -= 5;
              if (diretriz.descricao && diretriz.descricao.trim() !== "") {
                  y = drawWrappedText(diretriz.descricao, margin + 10, y, font, 10, colors.textMain, contentWidth - 20);
              }
              y -= 10;
              currentDiretrizId = diretriz.id;
          }

          if (objetivo.id !== currentObjetivoId) {
              checkPageBreak(50);
              y -= 5;
              y = drawWrappedText(`Objetivo: ${objetivo.titulo}`, margin + 5, y, fontBold, 11, colors.accent, contentWidth - 10);
              y -= 2;
              if (objetivo.descricao && objetivo.descricao.trim() !== "") {
                  y = drawWrappedText(objetivo.descricao, margin + 5, y, font, 10, colors.textMuted, contentWidth - 10);
              }
              y -= 5;
              currentObjetivoId = objetivo.id;
          }

          checkPageBreak(80);

          const mon = meta.monitoramentos[0];
          const status = mon ? mon.statusRAG : "PENDENTE";
          const valor = mon && mon.valorRealizado !== null ? mon.valorRealizado : "N/A";
          const justificativa = mon?.justificativa || "Sem justificativa informada no periodo.";

          // Meta Block Background
          y -= 5;
          const startMetaY = y;
          page.drawRectangle({ x: margin, y: y - 12, width: contentWidth, height: 16, color: colors.lightGray });
          
          y = drawWrappedText(`Meta ${meta.numero}: ${meta.descricao}`, margin + 5, y - 2, fontBold, 10, colors.textMain, contentWidth - 10);
          y -= 8;

          // Status Badge
          let statusColor = colors.secondary;
          let badgeText = " PENDENTE ";
          if (status === "VERDE") { statusColor = colors.success; badgeText = " NO PRAZO (VERDE) "; }
          if (status === "AMARELO") { statusColor = colors.warning; badgeText = " ATENCAO (AMARELO) "; }
          if (status === "VERMELHO") { statusColor = colors.danger; badgeText = " ATRASADA (VERMELHO) "; }

          const badgeWidth = fontBold.widthOfTextAtSize(badgeText, 9) + 8;
          page.drawRectangle({ x: margin + 10, y: y - 2, width: badgeWidth, height: 13, color: statusColor });
          page.drawText(badgeText, { x: margin + 14, y: y + 1.5, size: 8, font: fontBold, color: colors.white });

          // Values
          const valorText = `Alvo 2026: ${meta.metaFisica2026}  |  Realizado: ${valor}`;
          page.drawText(valorText, { x: margin + badgeWidth + 25, y: y + 1, size: 9, font: font, color: colors.textMain });
          y -= 15;

          // Justificativa (if not Green/Pendente)
          if (status === "AMARELO" || status === "VERMELHO") {
              checkPageBreak(40);
              page.drawText("Justificativa / Motivo:", { x: margin + 10, y, size: 9, font: fontBold, color: colors.danger });
              y -= 12;
              y = drawWrappedText(justificativa, margin + 10, y, font, 9, colors.textMuted, contentWidth - 20);
              y -= 5;
          }

          // Ações
          if (meta.acoes && meta.acoes.length > 0) {
              checkPageBreak(30);
              page.drawText("Ações Estratégicas Vinculadas:", { x: margin + 10, y, size: 9, font: fontBold, color: colors.textMain });
              y -= 12;
              for (const acao of meta.acoes) {
                  checkPageBreak(20);
                  const isExec = acao.emExecucao;
                  
                  // Checkbox / Circle
                  page.drawCircle({ x: margin + 14, y: y + 3, size: 3, color: isExec ? colors.success : colors.white, borderColor: isExec ? colors.success : colors.border, borderWidth: 1 });
                  
                  y = drawWrappedText(`${acao.descricao}`, margin + 24, y, font, 9, isExec ? colors.textMain : colors.textMuted, contentWidth - 35);
              }
          }
          y -= 10;
          
          // Bottom line for meta
          page.drawLine({
              start: { x: margin + 10, y: y + 5 }, end: { x: width - margin, y: y + 5 }, thickness: 0.5, color: colors.border, opacity: 0.5
          });
      }

      // Signatures
      checkPageBreak(120);
      y -= 40;
      const lineText = "______________________________________________________";
      const lineWidth = font.widthOfTextAtSize(lineText, 10);
      drawWrappedText(lineText, (width - lineWidth) / 2, y, font, 10);
      y -= 15;
      
      const signText = `Assinatura do(a) Diretor(a) do Setor: ${dept.nome}`;
      const signWidth = fontBold.widthOfTextAtSize(signText, 10);
      drawWrappedText(signText, (width - signWidth) / 2, y, fontBold, 10);
      y -= 15;

      const dateText = "Data: ____ / ____ / 2026";
      const dateWidth = font.widthOfTextAtSize(dateText, 10);
      drawWrappedText(dateText, (width - dateWidth) / 2, y, font, 10);

      drawPageFooter();

      const pdfBytes = await pdfDoc.save();
      const safeDeptName = dept.nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, '_');
      archive.append(Buffer.from(pdfBytes), { name: `Relatorio_Quadrimestre_${quadrimestre}_${safeDeptName}.pdf` });
    }

    // Fix Stream Deadlock: setup the promise before finalizing
    const streamPromise = new Promise((resolve, reject) => {
      writable.on('finish', resolve);
      writable.on('error', reject);
      archive.on('error', reject);
      archive.on('warning', (err) => {
        if (err.code === 'ENOENT') {
          console.warn('Archiver warning:', err);
        } else {
          reject(err);
        }
      });
    });

    if (archive.pointer() === 0) {
      archive.append('Nenhum dado encontrado para gerar relatorios neste quadrimestre.', { name: 'Aviso.txt' });
    }

    await archive.finalize();
    await streamPromise;

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
