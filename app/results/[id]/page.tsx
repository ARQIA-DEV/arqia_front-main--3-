'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import axios from '@/lib/axios'
import Link from 'next/link'

type Categoria = {
  id: number
  nome: string
}

type DocumentoStatus = 'pending' | 'processing' | 'completed' | 'failed'

type Documento = {
  id: number
  nome_arquivo: string
  categoria: Categoria | null
  resultado_analise: string | null
  status: DocumentoStatus
  error_message: string | null
  data_envio: string
}

const POLL_INTERVAL_MS = 2500
const MAX_POLL_ATTEMPTS = 40
const STATUS_LABEL: Record<DocumentoStatus, string> = {
  pending: 'Pendente',
  processing: 'Processando',
  completed: 'Concluído',
  failed: 'Falhou',
}

export default function DocumentoPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()

  const [documento, setDocumento] = useState<Documento | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const id = typeof params.id === 'string' ? params.id : params.id?.[0]

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (!id || !session?.access) return

    setLoading(true)
    let isCancelled = false
    let pollAttempts = 0
    let timer: ReturnType<typeof setTimeout> | null = null

    const fetchDocumento = async (): Promise<Documento | null> => {
      try {
        setError('')
        const res = await axios.get(`/api/documentos/${id}/`, {
          headers: {
            Authorization: `Bearer ${session.access}`,
          },
        })
        const data = res.data as Documento
        if (!isCancelled) {
          setDocumento(data)
        }
        return data
      } catch (err) {
        console.error(err)
        if (!isCancelled) {
          setError('Erro ao carregar documento.')
        }
        return null
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    const shouldPoll = (doc: Documento) => {
      return doc.status === 'pending' || doc.status === 'processing'
    }

    const pollDocumento = async () => {
      const data = await fetchDocumento()
      if (isCancelled || !data) return

      if (shouldPoll(data) && pollAttempts < MAX_POLL_ATTEMPTS) {
        pollAttempts += 1
        timer = setTimeout(pollDocumento, POLL_INTERVAL_MS)
      }
    }

    pollDocumento()

    return () => {
      isCancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [id, session, status, router])

  if (loading) return <p className="p-4">Carregando...</p>
  if (error || !documento) return <p className="p-4 text-red-500">{error || 'Documento não encontrado.'}</p>
  const categoriaNome = documento.categoria?.nome || 'Sem categoria'

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white shadow-md rounded text-azul-escuro">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{documento.nome_arquivo}</h1>
        <Link href="/results" className="text-sm bg-azul-claro text-white px-3 py-1 rounded hover:bg-azul-medio">
          Voltar para resultados
        </Link>
      </div>

      <p className="text-sm mb-4 text-azul-medio">
        Categoria: <strong>{categoriaNome}</strong> <br />
        Enviado em: {new Date(documento.data_envio).toLocaleString('pt-BR')}
        <br />
        Status: <strong>{STATUS_LABEL[documento.status]}</strong>
      </p>

      {(documento.status === 'pending' || documento.status === 'processing') && (
        <p className="text-sm mb-4 text-azul-medio">Análise em processamento. Esta página atualiza automaticamente.</p>
      )}

      {documento.status === 'failed' && (
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Falha no processamento</h2>
          <p className="text-red-600">{documento.error_message || 'Não foi possível processar o documento.'}</p>
        </div>
      )}

      {documento.status === 'completed' && (
        <div>
          <h2 className="text-lg font-semibold mb-2">Resultado da Análise:</h2>
          <pre className="bg-gray-100 p-3 rounded max-h-80 overflow-y-auto whitespace-pre-wrap">
            {documento.resultado_analise || 'Nenhum resultado disponível.'}
          </pre>
        </div>
      )}
    </div>
  )
}
