import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function Home() {
  const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '')
  const apiUrl = (path) => `${apiBaseUrl}${path}`
  const [token, setToken] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [analysis, setAnalysis] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    const res = await fetch(apiUrl('/api/token/'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin' }) // substituir por campos do form futuramente
    })
    const data = await res.json()
    setToken(data.access)
  }

  const handleUpload = async () => {
    if (!file || !token) return
    setLoading(true)

    const formData = new FormData()
    formData.append('documento', file)

    const res = await fetch(apiUrl('/api/analisar/'), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })

    const data = await res.json()
    setAnalysis(data.resultado || JSON.stringify(data))
    setLoading(false)
  }

  return (
    <main className="max-w-xl mx-auto p-4 space-y-4">
      <Card>
        <CardContent className="p-4 space-y-2">
          <Button onClick={handleLogin}>Login (JWT)</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-4">
          <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <Button onClick={handleUpload} disabled={loading}>{loading ? 'Analisando...' : 'Enviar para análise'}</Button>
        </CardContent>
      </Card>

      {analysis && (
        <Card>
          <CardContent className="p-4">
            <p className="font-semibold mb-2">Resultado:</p>
            <pre className="whitespace-pre-wrap text-sm">{analysis}</pre>
          </CardContent>
        </Card>
      )}
    </main>
  )
}
