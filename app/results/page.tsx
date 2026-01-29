'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import axios from '@/lib/axios'
import Link from 'next/link'

type Documento = {
  id: number
  nome_arquivo: string
  categoria: string
  data_envio: string
}

export default function ResultsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    const fetchData = async () => {
      try {
        const res = await axios.get('https://arqia.onrender.com/api/documentos/', {
          headers: {
            Authorization: `Bearer ${session?.access}`,
          },
        })
        setDocumentos(res.data)
      } catch (err) {
        console.error(err)
        setError('Erro ao carregar documentos.')
      } finally {
        setLoading(false)
      }
    }

    if (session?.access) fetchData()
  }, [session, status, router])

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white dark:bg-[#0C1528] shadow-md rounded text-black dark:text-white">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Documentos Enviados</h1>
        <Link href="/upload" className="text-sm text-white bg-azul-claro px-3 py-1 rounded hover:bg-azul-medio transition">
          Enviar novo
        </Link>
      </div>

      {loading && <p className="text-azul-medio">Carregando...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && documentos.length === 0 && (
        <p className="text-azul-escuro">Nenhum documento encontrado.</p>
      )}

      <ul className="space-y-4">
        {documentos.map((doc) => (
          <li key={doc.id} className="border rounded p-4 shadow-sm hover:bg-[#F2F2F2] transition">
            <Link href={`/results/${doc.id}`}>
              <p className="font-semibold hover:underline">{doc.nome_arquivo}</p>
              <p className="text-sm text-azul-claro">{doc.categoria}</p>
              <p className="text-xs text-azul-medio">{new Date(doc.data_envio).toLocaleString('pt-BR')}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
