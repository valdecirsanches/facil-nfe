// Cole este conteúdo COMPLETO em pages/Register.tsx

import React, { useState } from 'react'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { CompanyRegistration } from '../components/CompanyRegistration'
import { PlanSelection } from '../components/PlanSelection'
import { AlertCircleIcon, ArrowLeftIcon, BuildingIcon, CheckCircleIcon } from 'lucide-react'
import { toast } from 'sonner'

interface RegisterProps {
  onBack: () => void
  onSuccess: () => void
}

type Step = 'cnpj' | 'plan' | 'company' | 'user'

export function Register({ onBack, onSuccess }: RegisterProps) {
  const [step, setStep] = useState<Step>('cnpj')
  const [cnpj, setCnpj] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [companyExists, setCompanyExists] = useState(false)
  const [companyHasUsers, setCompanyHasUsers] = useState(false)
  const [companyId, setCompanyId] = useState<number | null>(null)
  const [selectedPlanId, setSelectedPlanId] = useState<number>(1)

  // User form state
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 14) {
      return numbers
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
    }
    return value
  }

  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNPJ(e.target.value)
    setCnpj(formatted)
    setError('')
  }

  const validateCNPJ = async () => {
    const cnpjNumbers = cnpj.replace(/\D/g, '')
    
    if (cnpjNumbers.length !== 14) {
      setError('CNPJ deve ter 14 dígitos')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Check if company exists
      const response = await fetch(`http://localhost:5300/api/empresas/cnpj/${cnpjNumbers}`)
      
      if (response.ok) {
        const company = await response.json()
        setCompanyExists(true)
        setCompanyId(company.id)
        
        // Check if company has users
        const usersResponse = await fetch(`http://localhost:5300/api/empresas/${company.id}/usuarios`)
        const users = await usersResponse.json()
        
        if (users.length > 0) {
          setCompanyHasUsers(true)
          setError('Esta empresa já possui usuários cadastrados. Solicite ao administrador que crie seu acesso.')
        } else {
          // Company exists but no users - go to plan selection
          setStep('plan')
        }
      } else if (response.status === 404) {
        // Company doesn't exist - go to plan selection first
        setCompanyExists(false)
        setStep('plan')
      } else {
        throw new Error('Erro ao verificar CNPJ')
      }
    } catch (err) {
      console.error('Error validating CNPJ:', err)
      setError('Erro ao validar CNPJ. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handlePlanSelected = (planId: number) => {
    setSelectedPlanId(planId)
    if (companyExists) {
      setStep('user')
    } else {
      setStep('company')
    }
  }

  const handleCompanyCreated = (newCompanyId: number) => {
    setCompanyId(newCompanyId)
    setStep('user')
  }

  const handleUserRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!nome || !email || !senha) {
      setError('Preencha todos os campos')
      return
    }

    if (senha !== confirmarSenha) {
      setError('As senhas não coincidem')
      return
    }

    if (senha.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres')
      return
    }

    if (!companyId) {
      setError('Empresa não identificada')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('http://localhost:5300/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          email,
          senha,
          empresa_id: companyId,
          tipo: 'admin',
          ativo: 1
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao criar usuário')
      }

      toast.success('Cadastro realizado com sucesso!')
      setTimeout(() => onSuccess(), 1500)
    } catch (err: any) {
      console.error('Error creating user:', err)
      setError(err.message || 'Erro ao criar usuário. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl p-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeftIcon size={20} />
          Voltar para login
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BuildingIcon size={32} className="text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {step === 'cnpj' && 'Criar Nova Conta'}
            {step === 'plan' && 'Escolha seu Plano'}
            {step === 'company' && 'Cadastrar Empresa'}
            {step === 'user' && 'Criar Usuário'}
          </h1>
          <p className="text-gray-600">
            {step === 'cnpj' && 'Informe o CNPJ da sua empresa para começar'}
            {step === 'plan' && 'Selecione o plano ideal para seu negócio'}
            {step === 'company' && 'Complete os dados da empresa'}
            {step === 'user' && 'Crie seu usuário administrador'}
          </p>
        </div>

        {error && !companyHasUsers && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800 flex items-center gap-2">
              <AlertCircleIcon size={16} />
              {error}
            </p>
          </div>
        )}

        {companyHasUsers && (
          <div className="mb-6 p-6 bg-amber-50 border-2 border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircleIcon size={24} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-900 mb-2">
                  Empresa já cadastrada
                </h3>
                <p className="text-sm text-amber-800 mb-3">
                  Esta empresa já possui usuários cadastrados no sistema.
                </p>
                <p className="text-sm text-amber-800">
                  Para obter acesso, entre em contato com o administrador da empresa e solicite a criação do seu usuário.
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 'cnpj' && !companyHasUsers && (
          <form onSubmit={(e) => { e.preventDefault(); validateCNPJ(); }} className="space-y-4">
            <Input
              label="CNPJ da Empresa"
              value={cnpj}
              onChange={handleCNPJChange}
              placeholder="00.000.000/0000-00"
              maxLength={18}
              required
              disabled={loading}
            />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Verificando...' : 'Continuar'}
            </Button>
          </form>
        )}

        {step === 'plan' && (
          <PlanSelection
            selectedPlanId={selectedPlanId}
            onSelect={handlePlanSelected}
            onBack={() => setStep('cnpj')}
          />
        )}

        {step === 'company' && (
          <CompanyRegistration
            cnpj={cnpj.replace(/\D/g, '')}
            planId={selectedPlanId}
            onSuccess={handleCompanyCreated}
            onCancel={() => setStep('plan')}
          />
        )}

        {step === 'user' && (
          <form onSubmit={handleUserRegistration} className="space-y-4">
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircleIcon size={20} />
                <p className="text-sm font-medium">
                  Empresa identificada! Crie seu usuário administrador.
                </p>
              </div>
            </div>

            <Input
              label="Nome Completo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome completo"
              required
              disabled={loading}
            />

            <Input
              label="E-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              disabled={loading}
            />

            <Input
              label="Senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              disabled={loading}
            />

            <Input
              label="Confirmar Senha"
              type="password"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              placeholder="Digite a senha novamente"
              required
              disabled={loading}
            />

            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setStep('plan')}
                disabled={loading}
              >
                Voltar
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? 'Criando conta...' : 'Criar Conta'}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  )
}