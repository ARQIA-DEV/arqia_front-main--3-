'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import axios from '@/lib/axios'
import Link from 'next/link'

type Documento = {
  id: number
  nome_arquivo: string
  categoria: string
  texto_extraido: string
  resultado_analise: string
  data_envio: string
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

    const fetchDocumento = async () => {
      try {
        const res = await axios.get(`/api/documentos/${id}/`, {
          headers: {
            Authorization: `Bearer ${session.access}`,
          },
        })
        setDocumento(res.data)
      } catch (err) {
        console.error(err)
        setError('Erro ao carregar documento.')
      } finally {
        setLoading(false)
      }
    }

    fetchDocumento()
  }, [id, session, status, router])

  if (loading) return <p className="p-4">Carregando...</p>
  if (error || !documento) return <p className="p-4 text-red-500">{error || 'Documento não encontrado.'}</p>

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white shadow-md rounded text-azul-escuro">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{documento.nome_arquivo}</h1>
        <Link href="/results" className="text-sm bg-azul-claro text-white px-3 py-1 rounded hover:bg-azul-medio">
          Voltar para resultados
        </Link>
      </div>

      <p className="text-sm mb-4 text-azul-medio">
        Categoria: <strong>{documento.categoria}</strong> <br />
        Enviado em: {new Date(documento.data_envio).toLocaleString('pt-BR')}
      </p>

        {/* <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Texto Extraído:</h2>
        <pre className="bg-gray-100 p-3 rounded max-h-80 overflow-y-auto whitespace-pre-wrap">
          {documento.texto_extraido || 'Nenhum texto disponível.'}
        </pre>
      </div> */}

      <div>
        <h2 className="text-lg font-semibold mb-2">Resultado da Análise:</h2>
        <pre className="bg-gray-100 p-3 rounded max-h-80 overflow-y-auto whitespace-pre-wrap">
          {documento.resultado_analise || 'Nenhum resultado disponível.'}
        </pre>
      </div>
    </div>
  )
}
