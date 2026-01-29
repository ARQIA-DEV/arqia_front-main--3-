import { useState } from 'react';
import { useRouter } from 'next/router';
import { jwtDecode } from 'jwt-decode';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const [token, setToken] = useState('');
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
  const apiUrl = (path) => `${apiBaseUrl}${path}`;

  const handleLogin = async () => {
    setError(null);
    try {
      const res = await fetch(apiUrl('/api/token/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password })
      });
      const data = await res.json();
      if (data.access) {
        setToken(data.access);
        localStorage.setItem('token', data.access);
      } else {
        setError('Login inválido');
      }
    } catch (err) {
      setError('Erro na requisição');
    }
  };

  const handleUpload = async () => {
    if (!file || !token) return;
    const formData = new FormData();
    formData.append('documento', file);
    try {
      const res = await fetch(apiUrl('/api/analisar/'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError('Erro ao enviar para análise');
    }
  };

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="space-y-4">
          {!token ? (
            <>
              <h1 className="text-xl font-bold">Login</h1>
              <Input placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
              <Input placeholder="Senha" type="password" onChange={(e) => setPassword(e.target.value)} />
              <Button onClick={handleLogin}>Entrar</Button>
              {error && <p className="text-red-500 text-sm">{error}</p>}
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold">Enviar Documento para Análise</h1>
              <Input type="file" onChange={(e) => setFile(e.target.files[0])} />
              <Button onClick={handleUpload}>Analisar</Button>
              {result && (
                <pre className="bg-gray-100 p-2 rounded text-sm mt-4 overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
