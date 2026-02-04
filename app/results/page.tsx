'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import axios from '@/lib/axios'
import { normalizeDocumentos } from '@/lib/normalizeDocumento'
import type { DocumentoNormalizado } from '@/lib/normalizeDocumento'
import Link from 'next/link'

type Documento = DocumentoNormalizado

type Filters = {
  dataInicio: string
  dataFim: string
}

type SortKey =
  | 'data_desc'
  | 'data_asc'
  | 'valor_desc'
  | 'valor_asc'
  | 'fornecedor_asc'
  | 'fornecedor_desc'

const INITIAL_FILTERS: Filters = {
  dataInicio: '',
  dataFim: '',
}

const getDocumentoDate = (documento: Documento) => {
  return documento.dataEmissao || documento.enviadoEm
}

const formatDate = (value: string | null) => {
  if (!value) return 'Data indisponível'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Data indisponível' : date.toLocaleString('pt-BR')
}

export default function ResultsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS)
  const [debouncedFilters, setDebouncedFilters] = useState<Filters>(INITIAL_FILTERS)
  const [sortKey, setSortKey] = useState<SortKey>('data_desc')
  const [page, setPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedFilters(filters)
      setPage(1)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [filters])

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    const fetchData = async () => {
      setLoading(true)
      setError('')

      const params = new URLSearchParams()
      if (debouncedFilters.dataInicio) params.set('data_inicio', debouncedFilters.dataInicio)
      if (debouncedFilters.dataFim) params.set('data_fim', debouncedFilters.dataFim)

      try {
        const url = params.toString() ? `/api/documentos/?${params.toString()}` : '/api/documentos/'
        const res = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${session?.access}`,
          },
        })

        const data = Array.isArray(res.data) ? res.data : res.data?.results || []
        setDocumentos(normalizeDocumentos(data))
      } catch (err) {
        console.error(err)
        setError('Erro ao carregar documentos.')
      } finally {
        setLoading(false)
      }
    }

    if (session?.access) {
      void fetchData()
    }
  }, [debouncedFilters, router, session, status])

  const filteredDocs = useMemo(() => {
    return documentos.filter((doc) => {
      if (debouncedFilters.dataInicio || debouncedFilters.dataFim) {
        const dateValue = getDocumentoDate(doc)
        const docDate = dateValue ? new Date(dateValue) : null
        if (!docDate || Number.isNaN(docDate.getTime())) return false

        if (debouncedFilters.dataInicio) {
          const start = new Date(debouncedFilters.dataInicio)
          if (!Number.isNaN(start.getTime()) && docDate < start) return false
        }

        if (debouncedFilters.dataFim) {
          const end = new Date(debouncedFilters.dataFim)
          if (!Number.isNaN(end.getTime())) {
            end.setHours(23, 59, 59, 999)
            if (docDate > end) return false
          }
        }
      }

      return true
    })
  }, [debouncedFilters, documentos])

  const sortedDocs = useMemo(() => {
    const docs = [...filteredDocs]
    const getDate = (doc: Documento) => {
      const value = getDocumentoDate(doc)
      if (!value) return 0
      const parsed = new Date(value).getTime()
      return Number.isNaN(parsed) ? 0 : parsed
    }
    const getValor = (doc: Documento) => doc.valor ?? 0
    const getFornecedor = (doc: Documento) => (doc.fornecedor || '').toLowerCase()

    docs.sort((a, b) => {
      switch (sortKey) {
        case 'data_asc':
          return getDate(a) - getDate(b)
        case 'data_desc':
          return getDate(b) - getDate(a)
        case 'valor_asc':
          return getValor(a) - getValor(b)
        case 'valor_desc':
          return getValor(b) - getValor(a)
        case 'fornecedor_asc':
          return getFornecedor(a).localeCompare(getFornecedor(b))
        case 'fornecedor_desc':
          return getFornecedor(b).localeCompare(getFornecedor(a))
        default:
          return 0
      }
    })

    return docs
  }, [filteredDocs, sortKey])

  const totalPages = Math.max(1, Math.ceil(sortedDocs.length / pageSize))
  const currentPage = Math.min(page, totalPages)

  const pagedDocs = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedDocs.slice(start, start + pageSize)
  }, [currentPage, pageSize, sortedDocs])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white dark:bg-[#0C1528] shadow-md rounded text-black dark:text-white">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Documentos Enviados</h1>
        <Link
          href="/upload"
          className="text-sm text-white bg-azul-claro px-3 py-1 rounded hover:bg-azul-medio transition"
        >
          Enviar novo
        </Link>
      </div>

      <div className="mb-6 border rounded p-4 bg-[#F7FAFA] dark:bg-[#0F1B33]">
        <p className="font-semibold mb-3">Filtros (datas) e ordenação</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="date"
            value={filters.dataInicio}
            onChange={(e) => setFilters((prev) => ({ ...prev, dataInicio: e.target.value }))}
            className="w-full border rounded px-3 py-2 text-sm bg-white text-black dark:bg-[#081226] dark:text-slate-100 dark:border-slate-600 dark:[color-scheme:dark]"
          />
          <input
            type="date"
            value={filters.dataFim}
            onChange={(e) => setFilters((prev) => ({ ...prev, dataFim: e.target.value }))}
            className="w-full border rounded px-3 py-2 text-sm bg-white text-black dark:bg-[#081226] dark:text-slate-100 dark:border-slate-600 dark:[color-scheme:dark]"
          />
          <div className="flex gap-2">
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="w-full border rounded px-3 py-2 text-sm bg-white text-black dark:bg-[#081226] dark:text-slate-100 dark:border-slate-600"
            >
              <option value="data_desc">Ordenar por: mais recentes</option>
              <option value="data_asc">Ordenar por: mais antigos</option>
              <option value="valor_desc">Ordenar por: maior valor</option>
              <option value="valor_asc">Ordenar por: menor valor</option>
              <option value="fornecedor_asc">Ordenar por: fornecedor A-Z</option>
              <option value="fornecedor_desc">Ordenar por: fornecedor Z-A</option>
            </select>
            <button
              type="button"
              onClick={() => setFilters(INITIAL_FILTERS)}
              className="px-3 py-2 rounded text-sm bg-gray-500 text-white hover:bg-gray-600 transition"
            >
              Limpar
            </button>
          </div>
        </div>
      </div>

      {loading && <p className="text-azul-medio">Carregando...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && filteredDocs.length === 0 && (
        <p className="text-azul-escuro dark:text-slate-200">Sem resultados encontrados.</p>
      )}

      {!loading && filteredDocs.length > 0 && (
        <div className="flex items-center justify-between text-sm text-azul-escuro dark:text-slate-200 mb-3">
          <span>
            {filteredDocs.length} resultado{filteredDocs.length !== 1 ? 's' : ''}
          </span>
          <span>
            Página {currentPage} de {totalPages}
          </span>
        </div>
      )}

      <ul className="space-y-4">
        {pagedDocs.map((doc) => {
          const detailHref = typeof doc.id === 'number' ? `/results/${doc.id}` : '/results'
          return (
            <li
              key={doc.id ?? `${doc.nomeArquivo}-${doc.enviadoEm ?? 'sem-data'}`}
              className="border rounded p-4 shadow-sm hover:bg-[#F2F2F2] dark:border-slate-700 dark:hover:bg-[#12213d] transition"
            >
              <Link href={detailHref}>
                <p className="font-semibold hover:underline dark:text-slate-100">{doc.nomeArquivo}</p>
                <p className="text-sm text-azul-claro dark:text-teal-300">{doc.categoria}</p>
                {doc.fornecedor && <p className="text-xs text-azul-escuro dark:text-slate-300">Fornecedor: {doc.fornecedor}</p>}
                {doc.cnpj && <p className="text-xs text-azul-escuro dark:text-slate-300">CNPJ: {doc.cnpj}</p>}
                {typeof doc.valor === 'number' && (
                  <p className="text-xs text-azul-escuro dark:text-slate-300">
                    Valor: {doc.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                )}
                <p className="text-xs text-azul-medio dark:text-slate-400">{formatDate(getDocumentoDate(doc))}</p>
              </Link>
            </li>
          )
        })}
      </ul>

      {!loading && filteredDocs.length > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className={`px-3 py-2 rounded text-white transition ${
              currentPage === 1 ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#015958] hover:bg-[#008F8C]'
            }`}
          >
            Página anterior
          </button>
          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className={`px-3 py-2 rounded text-white transition ${
              currentPage === totalPages
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-[#015958] hover:bg-[#008F8C]'
            }`}
          >
            Próxima página
          </button>
        </div>
      )}
    </div>
  )
}
