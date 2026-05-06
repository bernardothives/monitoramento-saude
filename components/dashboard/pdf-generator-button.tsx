"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Loader2 } from "lucide-react"

export function PdfGeneratorButton() {
  const [loading, setLoading] = useState(false)
  const [quadrimestre, setQuadrimestre] = useState("1")

  const handleDownload = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/reports/pdf?quadrimestre=${quadrimestre}`, {
        method: 'GET',
      })
      
      if (!response.ok) {
        throw new Error("Falha ao gerar relatórios")
      }

      let filename = `Relatorio_Monitoramento_Q${quadrimestre}.pdf`;
      const contentDisposition = response.headers.get('Content-Disposition');
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch.length === 2) {
          filename = filenameMatch[1];
        }
      } else {
        // Fallback for admin if header is missing
        if (response.headers.get('Content-Type') === 'application/zip') {
          filename = `Relatorios_Monitoramento_Q${quadrimestre}.zip`;
        }
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename;
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error(error)
      alert("Erro ao gerar os relatórios. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-lg border">
      <label className="text-sm font-medium">Exportar (PDF):</label>
      <Select value={quadrimestre} onValueChange={setQuadrimestre}>
        <SelectTrigger className="w-[120px] bg-background">
          <SelectValue placeholder="Quadrimestre" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">1º Quad</SelectItem>
          <SelectItem value="2">2º Quad</SelectItem>
          <SelectItem value="3">3º Quad</SelectItem>
        </SelectContent>
      </Select>
      <Button 
        onClick={handleDownload} 
        disabled={loading}
        variant="default"
        size="sm"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Gerando...
          </>
        ) : (
          <>
            <Download className="mr-2 h-4 w-4" />
            Baixar Documento
          </>
        )}
      </Button>
    </div>
  )
}
