'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import axios from '@/lib/axios'
import { normalizeDocumento } from '@/lib/normalizeDocumento'
import type { DocumentoNormalizado } from '@/lib/normalizeDocumento'
import Link from 'next/link'

const POLL_INTERVAL_MS = 2500
const MAX_POLL_ATTEMPTS = 40
const formatDate = (value: string | null) => {
  if (!value) return 'Data indisponível'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Data indisponível' : date.toLocaleString('pt-BR')
}

export default function DocumentoPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()

  const [documento, setDocumento] = useState<DocumentoNormalizado | null>(null)
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

    const fetchDocumento = async (): Promise<DocumentoNormalizado | null> => {
      try {
        setError('')
        const res = await axios.get(`/api/documentos/${id}/`, {
          headers: {
            Authorization: `Bearer ${session.access}`,
          },
        })
        const data = normalizeDocumento(res.data)
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

    const shouldPoll = (doc: DocumentoNormalizado) => {
      return doc.statusCode === 'pending' || doc.statusCode === 'processing'
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

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white dark:bg-[#0F1B33] shadow-md rounded text-azul-escuro dark:text-slate-100">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{documento.nomeArquivo}</h1>
        <Link href="/results" className="text-sm bg-azul-claro text-white px-3 py-1 rounded hover:bg-azul-medio">
          Voltar para resultados
        </Link>
      </div>

      <p className="text-sm mb-4 text-azul-medio dark:text-slate-300">
        Categoria: <strong>{documento.categoria}</strong> <br />
        Enviado em: {formatDate(documento.enviadoEm)}
        <br />
        Status: <strong>{documento.status || 'Indefinido'}</strong>
      </p>

      {(documento.statusCode === 'pending' || documento.statusCode === 'processing') && (
        <p className="text-sm mb-4 text-azul-medio">Análise em processamento. Esta página atualiza automaticamente.</p>
      )}

      {documento.statusCode === 'failed' && (
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Falha no processamento</h2>
          <p className="text-red-600">{documento.erro || 'Não foi possível processar o documento.'}</p>
        </div>
      )}

      {documento.statusCode === 'completed' && (
        <div>
          <h2 className="text-lg font-semibold mb-2">Resultado da Análise:</h2>
          <pre className="bg-gray-100 text-slate-900 dark:bg-[#081226] dark:text-slate-100 dark:border dark:border-slate-700 p-3 rounded max-h-80 overflow-y-auto whitespace-pre-wrap">
            {documento.analise || 'Nenhum resultado disponível.'}
          </pre>
        </div>
      )}
    </div>
  )
}
