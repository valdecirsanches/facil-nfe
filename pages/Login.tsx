import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { AlertCircleIcon } from 'lucide-react';
interface LoginProps {
  onLoginSuccess: () => void;
}
export function Login({
  onLoginSuccess
}: LoginProps) {
  const {
    login
  } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        onLoginSuccess();
      } else {
        setError('Email ou senha inválidos');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      // Detectar erro específico de banco de dados
      if (err.message && err.message.includes('Too few parameter values')) {
        setError('database_error');
      } else {
        setError(err.message || 'Erro ao fazer login. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };
  return <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Easy - NFe</h1>
          <p className="text-gray-600">Sistema de Gestão de Notas Fiscais</p>
        </div>

        {error === 'database_error' ? <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircleIcon size={24} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 mb-2">
                  ⚠️ Banco de Dados Precisa ser Corrigido
                </h3>
                <p className="text-sm text-red-800 mb-3">
                  O banco de dados está desatualizado. Execute os comandos
                  abaixo no terminal:
                </p>
                <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-xs mb-3">
                  <div>cd backend</div>
                  <div>npm run fix</div>
                  <div>npm start</div>
                </div>
                <p className="text-xs text-red-700">
                  Após executar os comandos, recarregue esta página e faça login
                  novamente.
                </p>
              </div>
            </div>
          </div> : error ? <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800 flex items-center gap-2">
              <AlertCircleIcon size={16} />
              {error}
            </p>
          </div> : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="E-mail" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required disabled={loading} />

          <Input label="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required disabled={loading} />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900 font-medium mb-2">
            🔐 Credenciais Padrão:
          </p>
          <div className="text-sm text-blue-800 space-y-1">
            <p>
              <strong>Email:</strong> admin@nfe.com
            </p>
            <p>
              <strong>Senha:</strong> admin123
            </p>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Sistema NFe v1.0 - Gestão de Notas Fiscais Eletrônicas
          </p>
        </div>
      </Card>
    </div>;
}