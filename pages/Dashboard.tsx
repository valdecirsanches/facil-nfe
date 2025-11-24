import React, { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { StatCard } from '../components/StatCard';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { FileTextIcon, CheckCircleIcon, ClockIcon, TrendingUpIcon } from 'lucide-react';
import { db } from '../utils/database';
import { useCompany } from '../context/CompanyContext';
interface DashboardProps {
  onNavigate: (page: string) => void;
}
export function Dashboard({
  onNavigate
}: DashboardProps) {
  const {
    activeCompanyId
  } = useCompany();
  const [stats, setStats] = useState({
    today: 0,
    month: 0,
    total: 0,
    pending: 0
  });
  const [recentNFes, setRecentNFes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (activeCompanyId) {
      loadDashboardData();
    }
  }, [activeCompanyId]);
  const loadDashboardData = async () => {
    if (!activeCompanyId) return;
    try {
      const nfes = await db.getNFes(activeCompanyId);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const todayNFes = nfes.filter(nfe => {
        const nfeDate = new Date(nfe.data_emissao);
        nfeDate.setHours(0, 0, 0, 0);
        return nfeDate.getTime() === today.getTime();
      });
      const monthNFes = nfes.filter(nfe => {
        const nfeDate = new Date(nfe.data_emissao);
        return nfeDate >= startOfMonth;
      });
      const totalValue = nfes.reduce((sum, nfe) => sum + parseFloat(nfe.valor_total), 0);
      const pendingNFes = nfes.filter(nfe => nfe.status !== 'Autorizada');
      setStats({
        today: todayNFes.length,
        month: monthNFes.length,
        total: totalValue,
        pending: pendingNFes.length
      });
      setRecentNFes(nfes.slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };
  if (!activeCompanyId) {
    return <div className="flex-1 bg-gray-50">
        <Header title="Dashboard" />
        <main className="p-8">
          <Card className="p-12 text-center">
            <p className="text-gray-600">
              Selecione uma empresa para visualizar o dashboard
            </p>
          </Card>
        </main>
      </div>;
  }
  if (loading) {
    return <div className="flex-1 bg-gray-50">
        <Header title="Dashboard" />
        <main className="p-8">
          <p className="text-gray-600">Carregando...</p>
        </main>
      </div>;
  }
  return <div className="flex-1 bg-gray-50">
      <Header title="Dashboard" />

      <main className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Notas Hoje" value={stats.today.toString()} icon={FileTextIcon} />
          <StatCard title="Notas Este Mês" value={stats.month.toString()} icon={TrendingUpIcon} />
          <StatCard title="Total Emitido" value={`R$ ${(stats.total / 1000).toFixed(1)}K`} icon={CheckCircleIcon} />
          <StatCard title="Pendentes" value={stats.pending.toString()} icon={ClockIcon} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Últimas Notas Emitidas
              </h3>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('nfe-list')}>
                Ver todas
              </Button>
            </div>

            {recentNFes.length === 0 ? <div className="text-center py-8">
                <FileTextIcon size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">Nenhuma nota emitida ainda</p>
                <Button onClick={() => onNavigate('new-nfe')} className="mt-4">
                  Emitir Primeira NFe
                </Button>
              </div> : <div className="space-y-4">
                {recentNFes.map(nfe => <div key={nfe.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-900">
                          NFe {nfe.numero}
                        </span>
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                          {nfe.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {nfe.cliente_nome}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        R$ {parseFloat(nfe.valor_total).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(nfe.data_emissao).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>)}
              </div>}
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Ações Rápidas
            </h3>
            <div className="space-y-3">
              <Button className="w-full" onClick={() => onNavigate('new-nfe')}>
                <FileTextIcon size={18} className="mr-2" />
                Emitir Nova NFe
              </Button>
              <Button variant="secondary" className="w-full" onClick={() => onNavigate('nfe-list')}>
                Consultar Notas
              </Button>
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Dica do Dia</h4>
              <p className="text-sm text-blue-700">
                Cadastre seus clientes e produtos antes de emitir notas para
                agilizar o processo.
              </p>
            </div>
          </Card>
        </div>
      </main>
    </div>;
}