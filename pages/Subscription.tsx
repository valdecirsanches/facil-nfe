import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';
import { CheckIcon, CrownIcon, TrendingUpIcon, AlertCircleIcon, CreditCardIcon } from 'lucide-react';
import { toast } from 'sonner';
interface Plan {
  id: number;
  nome: string;
  descricao: string;
  limite_nfes: number;
  limite_produtos: number;
  limite_faturamento: number;
  preco_mensal: number;
}
interface CompanyPlan {
  plano?: {
    nome: string;
    limite_nfes: number;
    limite_produtos: number;
    limite_faturamento: number;
  };
  uso: {
    nfes_mes: number;
    produtos: number;
  };
  disponivel: {
    nfes: number;
    produtos: number;
  };
}
interface Invoice {
  id: number;
  valor: number;
  data_vencimento: string;
}
export function Subscription() {
  const {
    user
  } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<CompanyPlan | null>(null);
  const [currentPlanId, setCurrentPlanId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState('');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState<Invoice | null>(null);
  useEffect(() => {
    fetchData();
  }, []);
  const fetchData = async () => {
    try {
      setError('');
      // Buscar planos disponíveis
      const plansResponse = await fetch('http://localhost:5300/api/planos');
      if (!plansResponse.ok) throw new Error('Erro ao buscar planos');
      const plansData = await plansResponse.json();
      setPlans(plansData);
      // Buscar dados da empresa para pegar o plano_id
      if (user?.empresa_id) {
        const token = localStorage.getItem('token');
        // Buscar empresa para pegar plano_id
        const empresaResponse = await fetch(`http://localhost:5300/api/empresas/${user.empresa_id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (empresaResponse.ok) {
          const empresaData = await empresaResponse.json();
          setCurrentPlanId(empresaData.plano_id || 1);
        }
        // Buscar limites e uso
        const limitsResponse = await fetch(`http://localhost:5300/api/empresas/${user.empresa_id}/limites`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (limitsResponse.ok) {
          const limitsData = await limitsResponse.json();
          setCurrentPlan(limitsData);
        } else {
          // Se não conseguir buscar limites, definir plano padrão
          setCurrentPlan({
            plano: {
              nome: 'Gratuito',
              limite_nfes: 10,
              limite_produtos: 50,
              limite_faturamento: 5000
            },
            uso: {
              nfes_mes: 0,
              produtos: 0
            },
            disponivel: {
              nfes: 10,
              produtos: 50
            }
          });
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Erro ao carregar informações. Tente novamente.');
      toast.error('Erro ao carregar informações');
    } finally {
      setLoading(false);
    }
  };
  const handleUpgrade = async (planId: number) => {
    if (!user?.empresa_id) return;
    const selectedPlan = plans.find(p => p.id === planId);
    if (!selectedPlan) return;
    // Confirmar upgrade
    if (selectedPlan.preco_mensal > 0) {
      const confirm = window.confirm(`Confirmar upgrade para o plano ${selectedPlan.nome}?\n\n` + `Valor: R$ ${selectedPlan.preco_mensal.toFixed(2)}/mês\n` + `Uma fatura será gerada com vencimento em 10 dias.`);
      if (!confirm) return;
    }
    setUpgrading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5300/api/empresas/${user.empresa_id}/plano`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          plano_id: planId
        })
      });
      if (!response.ok) throw new Error('Erro ao atualizar plano');
      const result = await response.json();
      toast.success('Plano atualizado com sucesso!');
      // Se foi gerada uma fatura, mostrar modal
      if (result.fatura) {
        setGeneratedInvoice(result.fatura);
        setShowInvoiceModal(true);
      }
      fetchData();
    } catch (error) {
      console.error('Error upgrading plan:', error);
      toast.error('Erro ao atualizar plano');
    } finally {
      setUpgrading(false);
    }
  };
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };
  const formatLimit = (limit: number) => {
    return limit === -1 ? 'Ilimitado' : limit.toLocaleString('pt-BR');
  };
  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0;
    return Math.min(used / limit * 100, 100);
  };
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };
  if (loading) {
    return <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-64 bg-gray-200 rounded"></div>)}
          </div>
        </div>
      </div>;
  }
  if (error) {
    return <div className="p-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 text-red-600">
            <AlertCircleIcon size={24} />
            <div>
              <h3 className="font-semibold">Erro ao carregar dados</h3>
              <p className="text-sm text-gray-600">{error}</p>
            </div>
          </div>
          <Button onClick={fetchData} className="mt-4">
            Tentar Novamente
          </Button>
        </Card>
      </div>;
  }
  return <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Gerenciar Assinatura
        </h1>
        <p className="text-gray-600">
          Acompanhe seu uso e faça upgrade do seu plano
        </p>
      </div>

      {/* Plano Atual e Uso */}
      {currentPlan?.plano && <Card className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CrownIcon size={24} className="text-green-600" />
                <h2 className="text-xl font-bold text-gray-900">
                  Plano {currentPlan.plano.nome}
                </h2>
              </div>
              <p className="text-gray-600">Seu plano atual</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* NFes */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  NFes este mês
                </span>
                <span className="text-sm text-gray-600">
                  {currentPlan.uso.nfes_mes} /{' '}
                  {formatLimit(currentPlan.plano.limite_nfes)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full transition-all" style={{
              width: `${getUsagePercentage(currentPlan.uso.nfes_mes, currentPlan.plano.limite_nfes)}%`
            }}></div>
              </div>
              {currentPlan.disponivel.nfes !== -1 && <p className="text-xs text-gray-500 mt-1">
                  {currentPlan.disponivel.nfes} disponíveis
                </p>}
            </div>

            {/* Produtos */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Produtos cadastrados
                </span>
                <span className="text-sm text-gray-600">
                  {currentPlan.uso.produtos} /{' '}
                  {formatLimit(currentPlan.plano.limite_produtos)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full transition-all" style={{
              width: `${getUsagePercentage(currentPlan.uso.produtos, currentPlan.plano.limite_produtos)}%`
            }}></div>
              </div>
              {currentPlan.disponivel.produtos !== -1 && <p className="text-xs text-gray-500 mt-1">
                  {currentPlan.disponivel.produtos} disponíveis
                </p>}
            </div>
          </div>
        </Card>}

      {/* Planos Disponíveis */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Planos Disponíveis
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map(plan => {
          // Usar currentPlanId para identificar plano atual
          const isCurrentPlan = currentPlanId === plan.id;
          return <Card key={plan.id} className={`p-6 ${isCurrentPlan ? 'border-2 border-green-500 shadow-lg' : 'border border-gray-200'}`}>
                {isCurrentPlan && <div className="mb-4">
                    <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full">
                      PLANO ATUAL
                    </span>
                  </div>}

                {plan.preco_mensal === 0 && !isCurrentPlan && <div className="mb-4">
                    <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      GRÁTIS
                    </span>
                  </div>}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {plan.nome}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">{plan.descricao}</p>
                  <div className="text-3xl font-bold text-gray-900">
                    {formatPrice(plan.preco_mensal)}
                    <span className="text-sm font-normal text-gray-600">
                      /mês
                    </span>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-2">
                    <CheckIcon size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <span className="font-semibold">
                        {formatLimit(plan.limite_nfes)}
                      </span>
                      <span className="text-gray-600"> NFes/mês</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <CheckIcon size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <span className="font-semibold">
                        {formatLimit(plan.limite_produtos)}
                      </span>
                      <span className="text-gray-600"> produtos</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <CheckIcon size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <span className="font-semibold">
                        {plan.limite_faturamento === -1 ? 'Ilimitado' : formatPrice(plan.limite_faturamento)}
                      </span>
                      <span className="text-gray-600"> faturamento/mês</span>
                    </div>
                  </div>
                </div>

                {!isCurrentPlan && <Button className="w-full" onClick={() => handleUpgrade(plan.id)} disabled={upgrading}>
                    <TrendingUpIcon size={16} className="mr-2" />
                    {upgrading ? 'Atualizando...' : 'Fazer Upgrade'}
                  </Button>}
              </Card>;
        })}
        </div>
      </div>

      {/* Modal de Fatura Gerada */}
      {showInvoiceModal && generatedInvoice && <Dialog isOpen={showInvoiceModal} onClose={() => setShowInvoiceModal(false)} title="Fatura Gerada">
          <div className="space-y-4">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CreditCardIcon size={32} className="text-green-600" />
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Upgrade Realizado com Sucesso!
              </h3>
              <p className="text-gray-600 mb-4">
                Uma fatura foi gerada para o pagamento do seu novo plano.
              </p>
            </div>

            <Card className="p-4 bg-gray-50">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Fatura #</span>
                  <span className="text-sm font-medium">
                    {generatedInvoice.id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Valor</span>
                  <span className="text-sm font-bold text-green-600">
                    {formatPrice(generatedInvoice.valor)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Vencimento</span>
                  <span className="text-sm font-medium">
                    {formatDate(generatedInvoice.data_vencimento)}
                  </span>
                </div>
              </div>
            </Card>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>💡 Próximos passos:</strong>
                <br />
                Acesse a página "Minhas Faturas" para visualizar e realizar o
                pagamento.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setShowInvoiceModal(false)}>
                Fechar
              </Button>
              <Button className="flex-1" onClick={() => {
            setShowInvoiceModal(false);
            window.location.href = '#billing'; // Navegar para página de faturas
          }}>
                Ver Faturas
              </Button>
            </div>
          </div>
        </Dialog>}
    </div>;
}