import React, { useState, useEffect } from 'react'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { CheckIcon } from 'lucide-react'

interface Plan {
  id: number
  nome: string
  descricao: string
  limite_nfes: number
  limite_produtos: number
  limite_faturamento: number
  preco_mensal: number
}

interface PlanSelectionProps {
  onSelect: (planId: number) => void
  onBack: () => void
  selectedPlanId?: number
}

export function PlanSelection({ onSelect, onBack, selectedPlanId }: PlanSelectionProps) {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<number>(selectedPlanId || 1)

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const response = await fetch('http://localhost:5300/api/planos')
      const data = await response.json()
      setPlans(data)
    } catch (error) {
      console.error('Error fetching plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const formatLimit = (limit: number) => {
    return limit === -1 ? 'Ilimitado' : limit.toLocaleString('pt-BR')
  }

  const handleSelect = () => {
    onSelect(selected)
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Carregando planos...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Escolha seu Plano
        </h2>
        <p className="text-gray-600">
          Selecione o plano ideal para o seu negócio
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            onClick={() => setSelected(plan.id)}
            className={`relative cursor-pointer transition-all duration-200 ${
              selected === plan.id
                ? 'transform scale-105'
                : 'hover:transform hover:scale-102'
            }`}
          >
            <Card
              className={`p-6 h-full ${
                selected === plan.id
                  ? 'border-2 border-green-500 shadow-lg'
                  : 'border border-gray-200 hover:border-green-300'
              }`}
            >
              {selected === plan.id && (
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckIcon size={20} className="text-white" />
                </div>
              )}

              {plan.preco_mensal === 0 && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    GRÁTIS
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {plan.nome}
                </h3>
                <p className="text-sm text-gray-600 mb-4">{plan.descricao}</p>
                <div className="text-3xl font-bold text-gray-900">
                  {formatPrice(plan.preco_mensal)}
                  <span className="text-sm font-normal text-gray-600">/mês</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckIcon size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <span className="font-semibold">{formatLimit(plan.limite_nfes)}</span>
                    <span className="text-gray-600"> NFes/mês</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CheckIcon size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <span className="font-semibold">{formatLimit(plan.limite_produtos)}</span>
                    <span className="text-gray-600"> produtos</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CheckIcon size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <span className="font-semibold">
                      {plan.limite_faturamento === -1
                        ? 'Ilimitado'
                        : formatPrice(plan.limite_faturamento)}
                    </span>
                    <span className="text-gray-600"> faturamento/mês</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onBack}
        >
          Voltar
        </Button>
        <Button
          type="button"
          className="flex-1"
          onClick={handleSelect}
        >
          Continuar com {plans.find(p => p.id === selected)?.nome}
        </Button>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          <strong>💡 Dica:</strong> Você pode começar com o plano Gratuito e fazer upgrade a qualquer momento conforme sua empresa cresce!
        </p>
      </div>
    </div>
  )
}