'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
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
  resultado_analise?: string | null
  status?: DocumentoStatus
  error_message?: string | null
  data_envio: string
  cnpj?: string
  fornecedor?: string
  valor?: number
  numero_nota?: string
  data_emissao?: string
}

type Filters = {
  cnpj: string
  fornecedor: string
  dataInicio: string
  dataFim: string
  valorMin: string
  valorMax: string
  numeroNota: string
}

type SortKey =
  | 'data_desc'
  | 'data_asc'
  | 'valor_desc'
  | 'valor_asc'
  | 'fornecedor_asc'
  | 'fornecedor_desc'

const INITIAL_FILTERS: Filters = {
  cnpj: '',
  fornecedor: '',
  dataInicio: '',
  dataFim: '',
  valorMin: '',
  valorMax: '',
  numeroNota: '',
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
  const [pageSize, setPageSize] = useState(10)

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
      if (debouncedFilters.cnpj) params.set('cnpj', debouncedFilters.cnpj)
      if (debouncedFilters.fornecedor) params.set('fornecedor', debouncedFilters.fornecedor)
      if (debouncedFilters.dataInicio) params.set('data_inicio', debouncedFilters.dataInicio)
      if (debouncedFilters.dataFim) params.set('data_fim', debouncedFilters.dataFim)
      if (debouncedFilters.valorMin) params.set('valor_min', debouncedFilters.valorMin)
      if (debouncedFilters.valorMax) params.set('valor_max', debouncedFilters.valorMax)
      if (debouncedFilters.numeroNota) params.set('numero_nota', debouncedFilters.numeroNota)

      try {
        const url = params.toString() ? `/api/documentos/?${params.toString()}` : '/api/documentos/'
        const res = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${session?.access}`,
          },
        })

        const data = Array.isArray(res.data) ? res.data : res.data?.results || []
        setDocumentos(data)
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

  const activeFilterTags = useMemo(() => {
    const tags: { key: keyof Filters; label: string; value: string }[] = []

    if (debouncedFilters.cnpj) tags.push({ key: 'cnpj', label: 'CNPJ', value: debouncedFilters.cnpj })
    if (debouncedFilters.fornecedor) {
      tags.push({ key: 'fornecedor', label: 'Fornecedor', value: debouncedFilters.fornecedor })
    }
    if (debouncedFilters.dataInicio) {
      tags.push({ key: 'dataInicio', label: 'Data (de)', value: debouncedFilters.dataInicio })
    }
    if (debouncedFilters.dataFim) {
      tags.push({ key: 'dataFim', label: 'Data (até)', value: debouncedFilters.dataFim })
    }
    if (debouncedFilters.valorMin) {
      tags.push({ key: 'valorMin', label: 'Valor (mín)', value: debouncedFilters.valorMin })
    }
    if (debouncedFilters.valorMax) {
      tags.push({ key: 'valorMax', label: 'Valor (máx)', value: debouncedFilters.valorMax })
    }
    if (debouncedFilters.numeroNota) {
      tags.push({ key: 'numeroNota', label: 'Nº da nota', value: debouncedFilters.numeroNota })
    }

    return tags
  }, [debouncedFilters])

  const filteredDocs = useMemo(() => {
    const normalize = (value?: string) => (value || '').toLowerCase()
    const matchesText = (value: string | undefined, query: string) =>
      normalize(value).includes(normalize(query))

    return documentos.filter((doc) => {
      if (debouncedFilters.cnpj && !matchesText(doc.cnpj, debouncedFilters.cnpj)) return false
      if (debouncedFilters.fornecedor && !matchesText(doc.fornecedor, debouncedFilters.fornecedor)) {
        return false
      }
      if (debouncedFilters.numeroNota && !matchesText(doc.numero_nota, debouncedFilters.numeroNota)) {
        return false
      }

      if (debouncedFilters.valorMin) {
        const min = Number(debouncedFilters.valorMin)
        if (!Number.isNaN(min) && (doc.valor ?? 0) < min) return false
      }

      if (debouncedFilters.valorMax) {
        const max = Number(debouncedFilters.valorMax)
        if (!Number.isNaN(max) && (doc.valor ?? 0) > max) return false
      }

      if (debouncedFilters.dataInicio || debouncedFilters.dataFim) {
        const dateValue = doc.data_emissao || doc.data_envio
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
    const getDate = (doc: Documento) => new Date(doc.data_emissao || doc.data_envio).getTime()
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
        <p className="font-semibold mb-3">Filtros</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="CNPJ"
            value={filters.cnpj}
            onChange={(e) => setFilters((prev) => ({ ...prev, cnpj: e.target.value }))}
            className="w-full border rounded px-3 py-2 text-sm bg-white text-black dark:bg-[#0C1528] dark:text-white dark:border-[#1b2b4a]"
          />
          <input
            type="text"
            placeholder="Fornecedor"
            value={filters.fornecedor}
            onChange={(e) => setFilters((prev) => ({ ...prev, fornecedor: e.target.value }))}
            className="w-full border rounded px-3 py-2 text-sm bg-white text-black dark:bg-[#0C1528] dark:text-white dark:border-[#1b2b4a]"
          />
          <input
            type="date"
            value={filters.dataInicio}
            onChange={(e) => setFilters((prev) => ({ ...prev, dataInicio: e.target.value }))}
            className="w-full border rounded px-3 py-2 text-sm bg-white text-black dark:bg-[#0C1528] dark:text-white dark:border-[#1b2b4a]"
          />
          <input
            type="date"
            value={filters.dataFim}
            onChange={(e) => setFilters((prev) => ({ ...prev, dataFim: e.target.value }))}
            className="w-full border rounded px-3 py-2 text-sm bg-white text-black dark:bg-[#0C1528] dark:text-white dark:border-[#1b2b4a]"
          />
          <input
            type="number"
            placeholder="Valor mínimo"
            value={filters.valorMin}
            onChange={(e) => setFilters((prev) => ({ ...prev, valorMin: e.target.value }))}
            className="w-full border rounded px-3 py-2 text-sm bg-white text-black dark:bg-[#0C1528] dark:text-white dark:border-[#1b2b4a]"
            min="0"
          />
          <input
            type="number"
            placeholder="Valor máximo"
            value={filters.valorMax}
            onChange={(e) => setFilters((prev) => ({ ...prev, valorMax: e.target.value }))}
            className="w-full border rounded px-3 py-2 text-sm bg-white text-black dark:bg-[#0C1528] dark:text-white dark:border-[#1b2b4a]"
            min="0"
          />
          <input
            type="text"
            placeholder="Número da nota"
            value={filters.numeroNota}
            onChange={(e) => setFilters((prev) => ({ ...prev, numeroNota: e.target.value }))}
            className="w-full border rounded px-3 py-2 text-sm bg-white text-black dark:bg-[#0C1528] dark:text-white dark:border-[#1b2b4a]"
          />
          <div className="flex gap-2">
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="w-full border rounded px-3 py-2 text-sm bg-white text-black dark:bg-[#0C1528] dark:text-white dark:border-[#1b2b4a]"
            >
              <option value="data_desc">Ordenar por: mais recentes</option>
              <option value="data_asc">Ordenar por: mais antigos</option>
              <option value="valor_desc">Ordenar por: maior valor</option>
              <option value="valor_asc">Ordenar por: menor valor</option>
              <option value="fornecedor_asc">Ordenar por: fornecedor A-Z</option>
              <option value="fornecedor_desc">Ordenar por: fornecedor Z-A</option>
            </select>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="w-28 border rounded px-3 py-2 text-sm bg-white text-black dark:bg-[#0C1528] dark:text-white dark:border-[#1b2b4a]"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {activeFilterTags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {activeFilterTags.map((tag) => (
              <button
                key={tag.key}
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, [tag.key]: '' }))}
                className="text-xs bg-[#015958] text-white px-2 py-1 rounded-full hover:bg-[#008F8C] transition"
              >
                {tag.label}: {tag.value} ✕
              </button>
            ))}
            <button
              type="button"
              onClick={() => setFilters(INITIAL_FILTERS)}
              className="text-xs bg-gray-500 text-white px-2 py-1 rounded-full hover:bg-gray-600 transition"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>

      {loading && <p className="text-azul-medio">Carregando...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && filteredDocs.length === 0 && (
        <p className="text-azul-escuro">Sem resultados encontrados.</p>
      )}

      {!loading && filteredDocs.length > 0 && (
        <div className="flex items-center justify-between text-sm text-azul-escuro mb-3">
          <span>
            {filteredDocs.length} resultado{filteredDocs.length !== 1 ? 's' : ''}
          </span>
          <span>
            Página {currentPage} de {totalPages}
          </span>
        </div>
      )}

      <ul className="space-y-4">
        {pagedDocs.map((doc) => (
          <li key={doc.id} className="border rounded p-4 shadow-sm hover:bg-[#F2F2F2] transition">
            <Link href={`/results/${doc.id}`}>
              <p className="font-semibold hover:underline">{doc.nome_arquivo}</p>
              <p className="text-sm text-azul-claro">{doc.categoria?.nome || 'Sem categoria'}</p>
              {doc.fornecedor && <p className="text-xs text-azul-escuro">Fornecedor: {doc.fornecedor}</p>}
              {doc.cnpj && <p className="text-xs text-azul-escuro">CNPJ: {doc.cnpj}</p>}
              {typeof doc.valor === 'number' && (
                <p className="text-xs text-azul-escuro">
                  Valor: {doc.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              )}
              <p className="text-xs text-azul-medio">
                {new Date(doc.data_emissao || doc.data_envio).toLocaleString('pt-BR')}
              </p>
            </Link>
          </li>
        ))}
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
