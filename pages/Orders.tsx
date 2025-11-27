import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCompany } from '../context/CompanyContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';
import { Input } from '../components/ui/Input';
import { SearchableSelect } from '../components/ui/SearchableSelect';
import { ShoppingCartIcon, CheckCircleIcon, XCircleIcon, ClockIcon, FileTextIcon, PlusIcon, EyeIcon, TrashIcon, AlertCircleIcon, DollarSignIcon, UndoIcon } from 'lucide-react';
import { toast } from 'sonner';
interface Order {
  id: number;
  numero: string;
  cliente_nome: string;
  cliente_cnpj: string;
  data_pedido: string;
  data_entrega: string;
  valor_total: number;
  desconto: number;
  valor_final: number;
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'faturado' | 'cancelado';
  observacoes: string;
  aprovado_por_nome?: string;
  aprovado_em?: string;
}
interface OrderItem {
  id: number;
  produto_id: number;
  produto_nome: string;
  produto_codigo: string;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  desconto: number;
  valor_total: number;
}
interface OrderDetails extends Order {
  itens: OrderItem[];
}
interface Product {
  id: number;
  descricao: string;
  codigo: string;
  valor_unitario: number;
}
interface Client {
  id: number;
  razao_social: string;
  cnpj: string;
}
interface NewOrderItem {
  produto_id: string;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  desconto: number;
}
export function Orders() {
  const {
    user
  } = useAuth();
  const {
    activeCompanyId
  } = useCompany();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  // Novo pedido
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [dataEntrega, setDataEntrega] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [orderItems, setOrderItems] = useState<NewOrderItem[]>([]);
  const [creating, setCreating] = useState(false);
  useEffect(() => {
    if (activeCompanyId) {
      fetchOrders();
      fetchClients();
      fetchProducts();
    }
  }, [activeCompanyId]);
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5300/api/empresas/${activeCompanyId}/pedidos`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Erro ao carregar pedidos');
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };
  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5300/api/empresas/${activeCompanyId}/clientes`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };
  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5300/api/empresas/${activeCompanyId}/produtos`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
        console.log('Produtos carregados:', data.length);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };
  const fetchOrderDetails = async (orderId: number) => {
    try {
      setLoadingDetails(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5300/api/empresas/${activeCompanyId}/pedidos/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Erro ao carregar detalhes');
      const data = await response.json();
      setSelectedOrder(data);
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
      toast.error('Erro ao carregar detalhes do pedido');
    } finally {
      setLoadingDetails(false);
    }
  };
  const handleApprove = async (orderId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5300/api/empresas/${activeCompanyId}/pedidos/${orderId}/aprovar`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Erro ao aprovar pedido');
      toast.success('Pedido aprovado com sucesso!');
      fetchOrders();
    } catch (error) {
      console.error('Erro ao aprovar:', error);
      toast.error('Erro ao aprovar pedido');
    }
  };
  const handleReject = async (orderId: number) => {
    const motivo = window.prompt('Motivo da rejeição:');
    if (!motivo) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5300/api/empresas/${activeCompanyId}/pedidos/${orderId}/rejeitar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          motivo
        })
      });
      if (!response.ok) throw new Error('Erro ao rejeitar pedido');
      toast.success('Pedido rejeitado');
      fetchOrders();
    } catch (error) {
      console.error('Erro ao rejeitar:', error);
      toast.error('Erro ao rejeitar pedido');
    }
  };
  const handleInvoice = async (orderId: number) => {
    if (!window.confirm('Faturar este pedido? Isso criará um registro financeiro.')) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5300/api/empresas/${activeCompanyId}/pedidos/${orderId}/faturar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao faturar pedido');
      }
      toast.success('Pedido faturado! Registro financeiro criado.');
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        fetchOrderDetails(orderId);
      }
    } catch (error: any) {
      console.error('Erro ao faturar:', error);
      toast.error(error.message || 'Erro ao faturar pedido');
    }
  };
  const handleUnInvoice = async (orderId: number) => {
    if (!window.confirm('Desfaturar este pedido? Isso removerá o registro financeiro.')) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5300/api/empresas/${activeCompanyId}/pedidos/${orderId}/desfaturar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao desfaturar pedido');
      }
      toast.success('Pedido desfaturado! Registro financeiro removido.');
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        fetchOrderDetails(orderId);
      }
    } catch (error: any) {
      console.error('Erro ao desfaturar:', error);
      toast.error(error.message || 'Erro ao desfaturar pedido');
    }
  };
  const handleAddItem = () => {
    setOrderItems([...orderItems, {
      produto_id: '',
      descricao: '',
      quantidade: 1,
      valor_unitario: 0,
      desconto: 0
    }]);
  };
  const handleRemoveItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };
  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...orderItems];
    newItems[index] = {
      ...newItems[index],
      [field]: value
    };
    // Se mudou o produto, atualizar descrição e valor
    if (field === 'produto_id' && value) {
      const product = products.find(p => p.id === parseInt(value));
      if (product) {
        newItems[index].descricao = product.descricao;
        newItems[index].valor_unitario = product.valor_unitario;
      }
    }
    setOrderItems(newItems);
  };
  const handleCreateOrder = async () => {
    if (!selectedClient) {
      toast.error('Selecione um cliente');
      return;
    }
    if (orderItems.length === 0) {
      toast.error('Adicione pelo menos um item');
      return;
    }
    // Validar itens
    for (const item of orderItems) {
      if (!item.produto_id || item.quantidade <= 0 || item.valor_unitario <= 0) {
        toast.error('Preencha todos os campos dos itens');
        return;
      }
    }
    setCreating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5300/api/empresas/${activeCompanyId}/pedidos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          cliente_id: parseInt(selectedClient),
          data_entrega: dataEntrega || null,
          observacoes: observacoes || null,
          itens: orderItems.map(item => ({
            ...item,
            produto_id: parseInt(item.produto_id)
          }))
        })
      });
      if (!response.ok) throw new Error('Erro ao criar pedido');
      const result = await response.json();
      toast.success(`Pedido ${result.numero} criado com sucesso!`);
      // Limpar formulário
      setShowNewOrderModal(false);
      setSelectedClient('');
      setDataEntrega('');
      setObservacoes('');
      setOrderItems([]);
      fetchOrders();
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      toast.error('Erro ao criar pedido');
    } finally {
      setCreating(false);
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
      aprovado: 'bg-green-100 text-green-800',
      rejeitado: 'bg-red-100 text-red-800',
      faturado: 'bg-blue-100 text-blue-800',
      cancelado: 'bg-gray-100 text-gray-800'
    };
    const icons = {
      pendente: <ClockIcon size={14} />,
      aprovado: <CheckCircleIcon size={14} />,
      rejeitado: <XCircleIcon size={14} />,
      faturado: <FileTextIcon size={14} />,
      cancelado: <XCircleIcon size={14} />
    };
    const labels = {
      pendente: 'Pendente',
      aprovado: 'Aprovado',
      rejeitado: 'Rejeitado',
      faturado: 'Faturado',
      cancelado: 'Cancelado'
    };
    return <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {icons[status as keyof typeof icons]}
        {labels[status as keyof typeof labels]}
      </span>;
  };
  const getTotalByStatus = (status: string) => {
    return orders.filter(order => order.status === status).reduce((sum, order) => sum + order.valor_final, 0);
  };
  const calculateItemTotal = (item: NewOrderItem) => {
    return item.quantidade * item.valor_unitario - item.desconto;
  };
  const calculateOrderTotal = () => {
    return orderItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Pedidos</h1>
          <p className="text-gray-600">Gerencie pedidos de venda e gere NFes</p>
        </div>
        <Button onClick={() => setShowNewOrderModal(true)}>
          <PlusIcon size={16} className="mr-2" />
          Novo Pedido
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pendentes</p>
              <p className="text-2xl font-bold text-yellow-600">
                {formatCurrency(getTotalByStatus('pendente'))}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <ClockIcon size={24} className="text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Aprovados</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(getTotalByStatus('aprovado'))}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircleIcon size={24} className="text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Faturados</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(getTotalByStatus('faturado'))}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <FileTextIcon size={24} className="text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {orders.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <ShoppingCartIcon size={24} className="text-gray-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabela de Pedidos */}
      <Card className="p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Lista de Pedidos
        </h2>

        {orders.length === 0 ? <div className="text-center py-12">
            <ShoppingCartIcon size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">Nenhum pedido encontrado</p>
            <Button onClick={() => setShowNewOrderModal(true)}>
              <PlusIcon size={16} className="mr-2" />
              Criar Primeiro Pedido
            </Button>
          </div> : <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Número
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Cliente
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Data Pedido
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
                {orders.map(order => <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">
                      {order.numero}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {order.cliente_nome}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {formatDate(order.data_pedido)}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">
                      {formatCurrency(order.valor_final)}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2 flex-wrap">
                        <Button size="sm" variant="secondary" onClick={() => fetchOrderDetails(order.id)}>
                          <EyeIcon size={14} className="mr-1" />
                          Ver
                        </Button>

                        {order.status === 'pendente' && <>
                            <Button size="sm" onClick={() => handleApprove(order.id)}>
                              <CheckCircleIcon size={14} className="mr-1" />
                              Aprovar
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => handleReject(order.id)}>
                              <XCircleIcon size={14} className="mr-1" />
                              Rejeitar
                            </Button>
                          </>}

                        {order.status === 'aprovado' && <Button size="sm" onClick={() => handleInvoice(order.id)} className="bg-blue-600 hover:bg-blue-700">
                            <DollarSignIcon size={14} className="mr-1" />
                            Faturar
                          </Button>}

                        {order.status === 'faturado' && <Button size="sm" onClick={() => toast.info('Integração com NFe será implementada')}>
                            <FileTextIcon size={14} className="mr-1" />
                            Gerar NFe
                          </Button>}
                      </div>
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>}
      </Card>

      {/* Modal de Novo Pedido */}
      <Dialog isOpen={showNewOrderModal} onClose={() => setShowNewOrderModal(false)} title="Novo Pedido" showFooter={false}>
        <div className="space-y-4">
          {/* Debug info */}
          {products.length === 0 && <Card className="p-4 bg-yellow-50 border-yellow-200">
              <div className="flex items-start gap-3">
                <AlertCircleIcon size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-900 mb-1">
                    ⚠️ Nenhum produto cadastrado
                  </p>
                  <p className="text-xs text-yellow-800">
                    Cadastre produtos antes de criar pedidos. Vá em "Produtos"
                    no menu lateral.
                  </p>
                </div>
              </div>
            </Card>}

          {/* Cliente */}
          <SearchableSelect label="Cliente" value={selectedClient} onChange={value => setSelectedClient(value)} options={clients.map(c => ({
          value: c.id.toString(),
          label: c.razao_social,
          subtitle: c.cnpj
        }))} placeholder="Selecione um cliente" required />

          {/* Data de Entrega */}
          <Input label="Data de Entrega" type="date" value={dataEntrega} onChange={e => setDataEntrega(e.target.value)} />

          {/* Itens do Pedido */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Itens do Pedido *
              </label>
              <Button size="sm" onClick={handleAddItem} disabled={products.length === 0}>
                <PlusIcon size={14} className="mr-1" />
                Adicionar Item
              </Button>
            </div>

            {orderItems.length === 0 ? <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-500 text-sm">
                  Nenhum item adicionado. Clique em "Adicionar Item" para
                  começar.
                </p>
              </div> : <div className="space-y-3">
                {orderItems.map((item, index) => <Card key={index} className="p-4 bg-gray-50">
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <SearchableSelect label="Produto" value={item.produto_id} onChange={value => handleItemChange(index, 'produto_id', value)} options={products.map(p => ({
                      value: p.id.toString(),
                      label: p.descricao,
                      subtitle: `Código: ${p.codigo} - ${formatCurrency(p.valor_unitario)}`
                    }))} placeholder="Selecione um produto" required />
                        </div>
                        <Button size="sm" variant="secondary" onClick={() => handleRemoveItem(index)} className="mt-6">
                          <TrashIcon size={14} />
                        </Button>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <Input label="Quantidade" type="number" value={item.quantidade} onChange={e => handleItemChange(index, 'quantidade', parseFloat(e.target.value) || 0)} min="0" step="0.01" />
                        <Input label="Valor Unit." type="number" value={item.valor_unitario} onChange={e => handleItemChange(index, 'valor_unitario', parseFloat(e.target.value) || 0)} min="0" step="0.01" />
                        <Input label="Desconto" type="number" value={item.desconto} onChange={e => handleItemChange(index, 'desconto', parseFloat(e.target.value) || 0)} min="0" step="0.01" />
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                        <span className="text-sm text-gray-600">
                          Total do item:
                        </span>
                        <span className="text-sm font-bold text-green-600">
                          {formatCurrency(calculateItemTotal(item))}
                        </span>
                      </div>
                    </div>
                  </Card>)}
              </div>}
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações
            </label>
            <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Observações adicionais..." />
          </div>

          {/* Total */}
          {orderItems.length > 0 && <Card className="p-4 bg-green-50 border-green-200">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-900">
                  Total do Pedido:
                </span>
                <span className="text-2xl font-bold text-green-600">
                  {formatCurrency(calculateOrderTotal())}
                </span>
              </div>
            </Card>}

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button className="flex-1" variant="secondary" onClick={() => setShowNewOrderModal(false)} disabled={creating}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={handleCreateOrder} disabled={creating || products.length === 0}>
              {creating ? 'Criando...' : 'Criar Pedido'}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Modal de Detalhes do Pedido */}
      {selectedOrder && <Dialog isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={`Pedido ${selectedOrder.numero}`} showFooter={false}>
          {loadingDetails ? <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando detalhes...</p>
            </div> : <div className="space-y-4">
              <Card className="p-4 bg-gray-50">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Cliente</span>
                    <span className="text-sm font-medium">
                      {selectedOrder.cliente_nome}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">CNPJ</span>
                    <span className="text-sm font-medium">
                      {selectedOrder.cliente_cnpj}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      Data do Pedido
                    </span>
                    <span className="text-sm font-medium">
                      {formatDate(selectedOrder.data_pedido)}
                    </span>
                  </div>
                  {selectedOrder.data_entrega && <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Data de Entrega
                      </span>
                      <span className="text-sm font-medium">
                        {formatDate(selectedOrder.data_entrega)}
                      </span>
                    </div>}
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                  {selectedOrder.aprovado_por_nome && <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Aprovado por
                      </span>
                      <span className="text-sm font-medium">
                        {selectedOrder.aprovado_por_nome}
                      </span>
                    </div>}
                </div>
              </Card>

              {/* Itens do Pedido */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3">
                  Itens do Pedido
                </h3>
                <div className="space-y-2">
                  {selectedOrder.itens.map(item => <Card key={item.id} className="p-3 bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {item.produto_nome}
                          </p>
                          <p className="text-xs text-gray-500">
                            Código: {item.produto_codigo}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-green-600">
                          {formatCurrency(item.valor_total)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Qtd: {item.quantidade}</span>
                        <span>Unit: {formatCurrency(item.valor_unitario)}</span>
                        {item.desconto > 0 && <span className="text-red-600">
                            Desc: {formatCurrency(item.desconto)}
                          </span>}
                      </div>
                    </Card>)}
                </div>
              </div>

              {/* Totais */}
              <Card className="p-4 bg-green-50 border-green-200">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">
                      {formatCurrency(selectedOrder.valor_total)}
                    </span>
                  </div>
                  {selectedOrder.desconto > 0 && <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Desconto</span>
                      <span className="font-medium text-red-600">
                        - {formatCurrency(selectedOrder.desconto)}
                      </span>
                    </div>}
                  <div className="flex justify-between text-lg pt-2 border-t border-green-300">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(selectedOrder.valor_final)}
                    </span>
                  </div>
                </div>
              </Card>

              {selectedOrder.observacoes && <Card className="p-4 bg-blue-50 border-blue-200">
                  <p className="text-sm text-gray-600 mb-1">Observações:</p>
                  <p className="text-sm text-gray-900">
                    {selectedOrder.observacoes}
                  </p>
                </Card>}

              {/* Ações no Modal */}
              <div className="flex gap-3">
                {selectedOrder.status === 'faturado' && <Button className="flex-1" variant="secondary" onClick={() => handleUnInvoice(selectedOrder.id)}>
                    <UndoIcon size={16} className="mr-2" />
                    Desfaturar
                  </Button>}

                <Button className="flex-1" variant="secondary" onClick={() => setSelectedOrder(null)}>
                  Fechar
                </Button>
              </div>
            </div>}
        </Dialog>}
    </div>;
}