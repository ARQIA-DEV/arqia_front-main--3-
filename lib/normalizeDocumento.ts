const STATUS_LABEL_BY_CODE = {
  pending: 'Pendente',
  processing: 'Processando',
  completed: 'Concluído',
  failed: 'Falhou',
} as const

export type DocumentoStatusCode = keyof typeof STATUS_LABEL_BY_CODE

export type DocumentoNormalizado = {
  id: number | null
  nomeArquivo: string
  status: string
  statusCode: DocumentoStatusCode | ''
  categoria: string
  analise: string
  erro: string
  enviadoEm: string | null
  cnpj: string
  fornecedor: string
  valor: number | null
  numeroNota: string
  dataEmissao: string | null
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

const asString = (value: unknown) => {
  if (typeof value === 'string') return value
  if (value === null || value === undefined) return ''
  return String(value)
}

const asNullableString = (value: unknown) => {
  const text = asString(value).trim()
  return text ? text : null
}

const asNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value

  if (typeof value === 'string') {
    const normalized = value.includes(',') && !value.includes('.')
      ? value.replace(',', '.')
      : value
    const parsed = Number(normalized)
    if (Number.isFinite(parsed)) return parsed
  }

  return null
}

const asStatusCode = (value: unknown): DocumentoStatusCode | '' => {
  const status = asString(value).trim().toLowerCase()
  if (!status) return ''

  // Backend (Django) -> Front
  if (status === 'queued') return 'pending'
  if (status === 'done') return 'completed'
  if (status === 'error') return 'failed'

  // Front native codes
  if (status === 'pending' || status === 'processing' || status === 'completed' || status === 'failed') {
    return status
  }

  // PT-BR labels
  if (status === 'pendente' || status === 'na fila') return 'pending'
  if (status === 'processando') return 'processing'
  if (status === 'concluido' || status === 'concluído') return 'completed'
  if (status === 'falhou' || status === 'erro') return 'failed'

  return ''
}

const asCategoria = (record: Record<string, unknown>) => {
  const categoriaNome =
    asNullableString(record.categoria_nome ?? record.categoriaNome) ??
    (isRecord(record.categoria) ? asNullableString(record.categoria.nome) : null)

  if (categoriaNome) return categoriaNome

  if (typeof record.categoria === 'number') return `Categoria #${record.categoria}`
  if (typeof record.categoria === 'string' && record.categoria.trim()) return record.categoria

  return 'Sem categoria'
}

export function normalizeDocumento(raw: unknown): DocumentoNormalizado {
  const record = isRecord(raw) ? raw : {}

  const statusCode = asStatusCode(record.status_code ?? record.statusCode ?? record.status)
  const statusLabel =
    asNullableString(record.status_label ?? record.statusLabel) ??
    (statusCode ? STATUS_LABEL_BY_CODE[statusCode] : null) ??
    asString(record.status)

  return {
    id: typeof record.id === 'number' ? record.id : asNumber(record.id),
    nomeArquivo: asString(record.nomeArquivo ?? record.nome_arquivo ?? record.titulo),
    status: statusLabel || '',
    statusCode,
    categoria: asCategoria(record),
    analise: asString(record.analise ?? record.resultado_analise),
    erro: asString(record.erro ?? record.error_message),
    enviadoEm: asNullableString(
      record.enviadoEm ?? record.data_envio ?? record.uploaded_at ?? record.created_at ?? record.enviado_em,
    ),
    cnpj: asString(record.cnpj),
    fornecedor: asString(record.fornecedor),
    valor: asNumber(record.valor),
    numeroNota: asString(record.numeroNota ?? record.numero_nota),
    dataEmissao: asNullableString(record.dataEmissao ?? record.data_emissao),
  }
}

export function normalizeDocumentos(raw: unknown): DocumentoNormalizado[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => normalizeDocumento(item))
}
