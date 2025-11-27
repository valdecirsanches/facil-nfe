import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCompany } from '../context/CompanyContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { DollarSignIcon, TrendingUpIcon, TrendingDownIcon, CalendarIcon, CheckCircleIcon, XCircleIcon, ClockIcon, PlusIcon, EyeIcon, TrashIcon } from 'lucide-react';
import { toast } from 'sonner';
interface Transaction {
  id: number;
  tipo: 'receber' | 'pagar';
  descricao: string;
  cliente_fornecedor: string;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  status: 'pendente' | 'pago' | 'vencido' | 'cancelado';
  forma_pagamento: string;
  observacoes: string;
  pedido_id?: number;
}
interface NewTransaction {
  tipo: 'receber' | 'pagar';
  descricao: string;
  cliente_fornecedor: string;
  valor: number;
  data_vencimento: string;
  forma_pagamento: string;
  observacoes: string;
}
export function Financial() {
  const {
    user
  } = useAuth();
  const {
    activeCompanyId
  } = useCompany();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'receber' | 'pagar'>('all');
  const [showNewTransactionModal, setShowNewTransactionModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [creating, setCreating] = useState(false);
  const [newTransaction, setNewTransaction] = useState<NewTransaction>({
    tipo: 'receber',
    descricao: '',
    cliente_fornecedor: '',
    valor: 0,
    data_vencimento: '',
    forma_pagamento: 'PIX',
    observacoes: ''
  });
  useEffect(() => {
    if (activeCompanyId) {
      fetchTransactions();
    }
  }, [activeCompanyId]);
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5300/api/empresas/${activeCompanyId}/financeiro`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Erro ao carregar transações');
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
      toast.error('Erro ao carregar transações');
    } finally {
      setLoading(false);
    }
  };
  const handleCreateTransaction = async () => {
    if (!newTransaction.descricao || !newTransaction.cliente_fornecedor || newTransaction.valor <= 0) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    setCreating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5300/api/empresas/${activeCompanyId}/financeiro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newTransaction)
      });
      if (!response.ok) throw new Error('Erro ao criar transação');
      toast.success('Transação criada com sucesso!');
      setShowNewTransactionModal(false);
      setNewTransaction({
        tipo: 'receber',
        descricao: '',
        cliente_fornecedor: '',
        valor: 0,
        data_vencimento: '',
        forma_pagamento: 'PIX',
        observacoes: ''
      });
      fetchTransactions();
    } catch (error) {
      console.error('Erro ao criar transação:', error);
      toast.error('Erro ao criar transação');
    } finally {
      setCreating(false);
    }
  };
  const handleMarkAsPaid = async (transactionId: number) => {
    if (!window.confirm('Marcar esta transação como paga?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5300/api/empresas/${activeCompanyId}/financeiro/${transactionId}/pagar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Erro ao atualizar transação');
      toast.success('Transação marcada como paga!');
      fetchTransactions();
    } catch (error) {
      console.error('Erro ao atualizar transação:', error);
      toast.error('Erro ao atualizar transação');
    }
  };
  const handleDeleteTransaction = async (transactionId: number) => {
    if (!window.confirm('Tem certeza que deseja excluir esta transação?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5300/api/empresas/${activeCompanyId}/financeiro/${transactionId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Erro ao excluir transação');
      toast.success('Transação excluída!');
      fetchTransactions();
      if (selectedTransaction?.id === transactionId) {
        setSelectedTransaction(null);
      }
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
      toast.error('Erro ao excluir transação');
    }
  };
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };
  const getStatusBadge = (status: string) => {
    const styles = {
      pendente: 'bg-yellow-100 text-yellow-800',
      pago: 'bg-green-100 text-green-800',
      vencido: 'bg-red-100 text-red-800',
      cancelado: 'bg-gray-100 text-gray-800'
    };
    const icons = {
      pendente: <ClockIcon size={14} />,
      pago: <CheckCircleIcon size={14} />,
      vencido: <XCircleIcon size={14} />,
      cancelado: <XCircleIcon size={14} />
    };
    const labels = {
      pendente: 'Pendente',
      pago: 'Pago',
      vencido: 'Vencido',
      cancelado: 'Cancelado'
    };
    return <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {icons[status as keyof typeof icons]}
        {labels[status as keyof typeof labels]}
      </span>;
  };
  const getTotalReceber = () => {
    return transactions.filter(t => t.tipo === 'receber' && t.status !== 'pago' && t.status !== 'cancelado').reduce((sum, t) => sum + t.valor, 0);
  };
  const getTotalPagar = () => {
    return transactions.filter(t => t.tipo === 'pagar' && t.status !== 'pago' && t.status !== 'cancelado').reduce((sum, t) => sum + t.valor, 0);
  };
  const getTotalRecebido = () => {
    return transactions.filter(t => t.tipo === 'receber' && t.status === 'pago').reduce((sum, t) => sum + t.valor, 0);
  };
  const getTotalPago = () => {
    return transactions.filter(t => t.tipo === 'pagar' && t.status === 'pago').reduce((sum, t) => sum + t.valor, 0);
  };
  const filteredTransactions = transactions.filter(t => {
    if (filterType === 'all') return true;
    return t.tipo === filterType;
  });
  if (!activeCompanyId) {
    return <div className="p-6">
        <Card className="p-6">
          <p className="text-gray-600">Selecione uma empresa para continuar</p>
        </Card>
      </div>;
  }
  if (loading) {
    return <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-200 rounded"></div>)}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>;
  }
  return <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Financeiro</h1>
          <p className="text-gray-600">Controle de contas a receber e pagar</p>
        </div>
        <Button onClick={() => setShowNewTransactionModal(true)}>
          <PlusIcon size={16} className="mr-2" />
          Nova Transação
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">A Receber</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(getTotalReceber())}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUpIcon size={24} className="text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">A Pagar</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(getTotalPagar())}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <TrendingDownIcon size={24} className="text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Recebido</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(getTotalRecebido())}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <CheckCircleIcon size={24} className="text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Saldo</p>
              <p className={`text-2xl font-bold ${getTotalRecebido() - getTotalPago() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(getTotalRecebido() - getTotalPago())}
              </p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <DollarSignIcon size={24} className="text-gray-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex gap-2">
          <Button size="sm" variant={filterType === 'all' ? 'default' : 'secondary'} onClick={() => setFilterType('all')}>
            Todas
          </Button>
          <Button size="sm" variant={filterType === 'receber' ? 'default' : 'secondary'} onClick={() => setFilterType('receber')}>
            <TrendingUpIcon size={14} className="mr-1" />A Receber
          </Button>
          <Button size="sm" variant={filterType === 'pagar' ? 'default' : 'secondary'} onClick={() => setFilterType('pagar')}>
            <TrendingDownIcon size={14} className="mr-1" />A Pagar
          </Button>
        </div>
      </Card>

      {/* Tabela de Transações */}
      <Card className="p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Transações</h2>

        {filteredTransactions.length === 0 ? <div className="text-center py-12">
            <DollarSignIcon size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">Nenhuma transação encontrada</p>
            <Button onClick={() => setShowNewTransactionModal(true)}>
              <PlusIcon size={16} className="mr-2" />
              Criar Primeira Transação
            </Button>
          </div> : <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Tipo
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Descrição
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Cliente/Fornecedor
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Vencimento
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Valor
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map(transaction => <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {transaction.tipo === 'receber' ? <span className="inline-flex items-center gap-1 text-green-600">
                          <TrendingUpIcon size={14} />
                          <span className="text-xs font-medium">Receber</span>
                        </span> : <span className="inline-flex items-center gap-1 text-red-600">
                          <TrendingDownIcon size={14} />
                          <span className="text-xs font-medium">Pagar</span>
                        </span>}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {transaction.descricao}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {transaction.cliente_fornecedor}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {formatDate(transaction.data_vencimento)}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">
                      {formatCurrency(transaction.valor)}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(transaction.status)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setSelectedTransaction(transaction)}>
                          <EyeIcon size={14} className="mr-1" />
                          Ver
                        </Button>

                        {transaction.status === 'pendente' && <Button size="sm" onClick={() => handleMarkAsPaid(transaction.id)}>
                            <CheckCircleIcon size={14} className="mr-1" />
                            Pagar
                          </Button>}
                      </div>
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>}
      </Card>

      {/* Modal de Nova Transação */}
      <Dialog isOpen={showNewTransactionModal} onClose={() => setShowNewTransactionModal(false)} title="Nova Transação" showFooter={false}>
        <div className="space-y-4">
          <Select label="Tipo *" value={newTransaction.tipo} onChange={e => setNewTransaction({
          ...newTransaction,
          tipo: e.target.value as 'receber' | 'pagar'
        })} required>
            <option value="receber">A Receber</option>
            <option value="pagar">A Pagar</option>
          </Select>

          <Input label="Descrição *" value={newTransaction.descricao} onChange={e => setNewTransaction({
          ...newTransaction,
          descricao: e.target.value
        })} placeholder="Ex: Venda NFe #123" required />

          <Input label={newTransaction.tipo === 'receber' ? 'Cliente *' : 'Fornecedor *'} value={newTransaction.cliente_fornecedor} onChange={e => setNewTransaction({
          ...newTransaction,
          cliente_fornecedor: e.target.value
        })} placeholder="Nome do cliente ou fornecedor" required />

          <Input label="Valor *" type="number" step="0.01" value={newTransaction.valor} onChange={e => setNewTransaction({
          ...newTransaction,
          valor: parseFloat(e.target.value) || 0
        })} placeholder="0.00" required />

          <Input label="Data de Vencimento *" type="date" value={newTransaction.data_vencimento} onChange={e => setNewTransaction({
          ...newTransaction,
          data_vencimento: e.target.value
        })} required />

          <Select label="Forma de Pagamento *" value={newTransaction.forma_pagamento} onChange={e => setNewTransaction({
          ...newTransaction,
          forma_pagamento: e.target.value
        })} required>
            <option value="PIX">PIX</option>
            <option value="Dinheiro">Dinheiro</option>
            <option value="Boleto">Boleto</option>
            <option value="Transferência">Transferência</option>
            <option value="Cartão de Crédito">Cartão de Crédito</option>
            <option value="Cartão de Débito">Cartão de Débito</option>
          </Select>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações
            </label>
            <textarea value={newTransaction.observacoes} onChange={e => setNewTransaction({
            ...newTransaction,
            observacoes: e.target.value
          })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Observações adicionais..." />
          </div>

          <div className="flex gap-3 pt-4">
            <Button className="flex-1" variant="secondary" onClick={() => setShowNewTransactionModal(false)} disabled={creating}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={handleCreateTransaction} disabled={creating}>
              {creating ? 'Criando...' : 'Criar Transação'}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Modal de Detalhes da Transação */}
      {selectedTransaction && <Dialog isOpen={!!selectedTransaction} onClose={() => setSelectedTransaction(null)} title="Detalhes da Transação" showFooter={false}>
          <div className="space-y-4">
            <Card className="p-4 bg-gray-50">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Tipo</span>
                  {selectedTransaction.tipo === 'receber' ? <span className="text-sm font-medium text-green-600">
                      A Receber
                    </span> : <span className="text-sm font-medium text-red-600">
                      A Pagar
                    </span>}
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Descrição</span>
                  <span className="text-sm font-medium">
                    {selectedTransaction.descricao}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    {selectedTransaction.tipo === 'receber' ? 'Cliente' : 'Fornecedor'}
                  </span>
                  <span className="text-sm font-medium">
                    {selectedTransaction.cliente_fornecedor}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Vencimento</span>
                  <span className="text-sm font-medium">
                    {formatDate(selectedTransaction.data_vencimento)}
                  </span>
                </div>
                {selectedTransaction.data_pagamento && <div className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      Data Pagamento
                    </span>
                    <span className="text-sm font-medium">
                      {formatDate(selectedTransaction.data_pagamento)}
                    </span>
                  </div>}
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Valor</span>
                  <span className="text-sm font-bold text-green-600">
                    {formatCurrency(selectedTransaction.valor)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    Forma de Pagamento
                  </span>
                  <span className="text-sm font-medium">
                    {selectedTransaction.forma_pagamento}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  {getStatusBadge(selectedTransaction.status)}
                </div>
                {selectedTransaction.observacoes && <div>
                    <span className="text-sm text-gray-600 block mb-1">
                      Observações
                    </span>
                    <p className="text-sm text-gray-900">
                      {selectedTransaction.observacoes}
                    </p>
                  </div>}
              </div>
            </Card>

            <div className="flex gap-3">
              {!selectedTransaction.pedido_id && selectedTransaction.status === 'pendente' && <Button className="flex-1" variant="secondary" onClick={() => handleDeleteTransaction(selectedTransaction.id)}>
                    <TrashIcon size={16} className="mr-2" />
                    Excluir
                  </Button>}

              <Button className="flex-1" variant="secondary" onClick={() => setSelectedTransaction(null)}>
                Fechar
              </Button>
            </div>
          </div>
        </Dialog>}
    </div>;
}