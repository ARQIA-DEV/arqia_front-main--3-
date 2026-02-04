'use client'

import { useState, FormEvent, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import axios from '@/lib/axios'

export default function UploadPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [file, setFile] = useState<File | null>(null)
  const [category, setCategory] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')
  const [isUploading, setIsUploading] = useState(false)
  const [documentoId, setDocumentoId] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login')
    }
  }, [status, router])

  if (status !== 'authenticated') return null

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setMessage('')
    setMessageType('')
    setDocumentoId(null)

    if (!file || !category) {
      setMessage('Selecione um arquivo e uma categoria.')
      setMessageType('error')
      return
    }

    if (!session?.access) {
      setMessage('Você precisa estar logado para enviar arquivos.')
      setMessageType('error')
      return
    }

    if (file.type !== 'application/pdf') {
      setMessage('Por enquanto, só PDF.')
      setMessageType('error')
      return
    }

    const formData = new FormData()
    formData.append('arquivo', file)
    formData.append('categoria', category)

    setIsUploading(true)

    try {
      const response = await axios.post('/api/analisar/', formData, {
        headers: {
          Authorization: `Bearer ${session.access}`,
        },
      })

      const documentoId = response?.data?.documento_id
      if (documentoId) {
        setMessageType('success')
        setMessage('Análise enviada com sucesso! Você pode visualizar o resultado abaixo.')
        setDocumentoId(documentoId)
      } else {
        setMessage('Erro interno ao obter ID do documento.')
        setMessageType('error')
      }
    } catch (err: any) {
      console.error(err)
      const msg = err?.response?.data?.erro || err?.response?.data?.detail || 'Erro ao enviar o arquivo.'
      setMessage(msg)
      setMessageType('error')
    } finally {
      setIsUploading(false)
    }
  }

  const canSubmit = !!file && !!category && !!session?.access && !isUploading

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white dark:bg-[#0C1528] shadow-md rounded text-[#002333] dark:text-white">
      <h1 className="text-xl font-bold mb-4">Enviar documento</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full"
          accept=".pdf,application/pdf"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full border rounded px-3 py-2"
        >
          <option value="">Selecione a categoria</option>
          <option value="medicamentos">Medicamentos</option>
          <option value="distribuicao_medicamentos">Distribuição de Medicamentos</option>
          <option value="transplante_capilar">Transplante Capilar</option>
          <option value="tratamento_capilar">Tratamento Capilar</option>
          <option value="alimentos">Alimentos</option>
          <option value="cosmeticos">Cosméticos</option>
          <option value="veterinario">Veterinário</option>
          <option value="saneantes">Saneantes</option>
          <option value="estetica">Estética</option>
          <option value="dispositivos_medicos">Dispositivos Médicos</option>
          <option value="insumos_farmaceuticos">Insumos Farmacêuticos</option>
          <option value="outros">Outros</option>
        </select>

        <button
          type="submit"
          disabled={!canSubmit}
          className={`w-full py-2 rounded text-white transition ${
            canSubmit ? 'bg-[#015958] hover:bg-[#008F8C]' : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          {isUploading ? 'Enviando...' : 'Enviar'}
        </button>

        {message && (
          <p
            className={`text-center text-sm ${
              messageType === 'success' ? 'text-green-600' : 'text-red-500'
            }`}
          >
            {message}
          </p>
        )}

        {documentoId && (
          <div className="text-center mt-4">
            <a
              href={`/results/${documentoId}`}
              className="inline-block bg-[#015958] hover:bg-[#008F8C] text-white px-4 py-2 rounded"
            >
              Ver resultado da análise
            </a>
          </div>
        )}
      </form>
    </div>
  )
}
