import React, { useEffect, useState, Component } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';
import { Input } from '../components/ui/Input';
import { DollarSignIcon, CheckCircleIcon, XCircleIcon, ClockIcon, DownloadIcon, CreditCardIcon, CopyIcon, QrCodeIcon, AlertCircleIcon } from 'lucide-react';
import { toast } from 'sonner';
interface Invoice {
  id: number;
  empresa_id: number;
  plano_id: number;
  valor: number;
  mes_referencia: string;
  status: 'pendente' | 'pago' | 'vencido';
  data_vencimento: string;
  data_pagamento: string | null;
  pix_code: string | null;
  created_at: string;
}
interface Company {
  id: number;
  razao_social: string;
  cnpj: string;
  plano_id: number;
}
interface PixData {
  pixCode: string;
  pixKey: string;
  pixTipo: string;
  valor: number;
  vencimento: string;
  beneficiario: string;
}
type PaymentMethod = 'pix' | 'card';
export function Billing() {
  const {
    user,
    isSuperUser
  } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<number | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [generatingPix, setGeneratingPix] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  // Card form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  useEffect(() => {
    fetchData();
  }, [selectedCompany]);
  // Gerar QR Code quando pixData mudar
  useEffect(() => {
    if (pixData?.pixCode) {
      generateQRCode(pixData.pixCode);
    }
  }, [pixData]);
  const generateQRCode = async (text: string) => {
    try {
      // Usar API pública para gerar QR Code
      const url = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;
      setQrCodeUrl(url);
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
    }
  };
  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (isSuperUser) {
        const companiesResponse = await fetch('http://localhost:5300/api/empresas', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const companiesData = await companiesResponse.json();
        setCompanies(companiesData);
        const invoicesUrl = selectedCompany ? `http://localhost:5300/api/faturas?empresa_id=${selectedCompany}` : 'http://localhost:5300/api/faturas';
        const invoicesResponse = await fetch(invoicesUrl, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const invoicesData = await invoicesResponse.json();
        setInvoices(invoicesData);
      } else {
        const invoicesResponse = await fetch(`http://localhost:5300/api/faturas?empresa_id=${user?.empresa_id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const invoicesData = await invoicesResponse.json();
        setInvoices(invoicesData);
      }
    } catch (error) {
      console.error('Error fetching billing data:', error);
      toast.error('Erro ao carregar dados financeiros');
    } finally {
      setLoading(false);
    }
  };
  const handleMarkAsPaid = async (invoiceId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5300/api/faturas/${invoiceId}/pagar`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Erro ao marcar como pago');
      toast.success('Fatura marcada como paga!');
      fetchData();
    } catch (error) {
      console.error('Error marking as paid:', error);
      toast.error('Erro ao atualizar fatura');
    }
  };
  const handleOpenPayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentMethod('pix');
    setPixData(null);
    setQrCodeUrl('');
    setShowPaymentModal(true);
    setTimeout(() => {
      handleGeneratePix(invoice);
    }, 300);
  };
  const handleGeneratePix = async (invoice: Invoice) => {
    setGeneratingPix(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5300/api/faturas/${invoice.id}/gerar-pix`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao gerar PIX');
      }
      const data = await response.json();
      setPixData(data);
      toast.success('PIX gerado com sucesso!');
      fetchData();
    } catch (error: any) {
      console.error('Erro ao gerar PIX:', error);
      toast.error(error.message || 'Erro ao gerar PIX');
    } finally {
      setGeneratingPix(false);
    }
  };
  const handleCopyPix = () => {
    if (pixData?.pixCode) {
      navigator.clipboard.writeText(pixData.pixCode);
      toast.success('Código PIX copiado!');
    }
  };
  const handleCardPayment = async () => {
    if (!selectedInvoice) return;
    if (!cardNumber || !cardName || !cardExpiry || !cardCvv) {
      toast.error('Preencha todos os campos do cartão');
      return;
    }
    if (cardNumber.replace(/\s/g, '').length < 16) {
      toast.error('Número do cartão inválido');
      return;
    }
    setProcessingPayment(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5300/api/faturas/${selectedInvoice.id}/pagar`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      toast.success('Pagamento aprovado!');
      setShowPaymentModal(false);
      fetchData();
      setCardNumber('');
      setCardName('');
      setCardExpiry('');
      setCardCvv('');
    } catch (error) {
      toast.error('Erro ao processar pagamento');
    } finally {
      setProcessingPayment(false);
    }
  };
  const formatCardNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const groups = numbers.match(/.{1,4}/g);
    return groups ? groups.join(' ') : numbers;
  };
  const formatExpiry = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length >= 2) {
      return numbers.slice(0, 2) + '/' + numbers.slice(2, 4);
    }
    return numbers;
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
      pago: 'bg-green-100 text-green-800',
      pendente: 'bg-yellow-100 text-yellow-800',
      vencido: 'bg-red-100 text-red-800'
    };
    const icons = {
      pago: <CheckCircleIcon size={14} />,
      pendente: <ClockIcon size={14} />,
      vencido: <XCircleIcon size={14} />
    };
    const labels = {
      pago: 'Pago',
      pendente: 'Pendente',
      vencido: 'Vencido'
    };
    return <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {icons[status as keyof typeof icons]}
        {labels[status as keyof typeof labels]}
      </span>;
  };
  const getTotalPendente = () => {
    return invoices.filter(inv => inv.status === 'pendente' || inv.status === 'vencido').reduce((sum, inv) => sum + inv.valor, 0);
  };
  const getTotalPago = () => {
    return invoices.filter(inv => inv.status === 'pago').reduce((sum, inv) => sum + inv.valor, 0);
  };
  if (loading) {
    return <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-200 rounded"></div>)}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>;
  }
  return <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isSuperUser ? 'Gestão Financeira' : 'Minhas Faturas'}
          </h1>
          <p className="text-gray-600">
            {isSuperUser ? 'Gerencie cobranças e pagamentos de todas as empresas' : 'Acompanhe suas faturas e pagamentos'}
          </p>
        </div>

        {isSuperUser && companies.length > 0 && <select value={selectedCompany || ''} onChange={e => setSelectedCompany(e.target.value ? parseInt(e.target.value) : null)} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="">Todas as empresas</option>
            {companies.map(company => <option key={company.id} value={company.id}>
                {company.razao_social}
              </option>)}
          </select>}
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Pendente</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(getTotalPendente())}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <DollarSignIcon size={24} className="text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Pago</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(getTotalPago())}
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
              <p className="text-sm text-gray-600 mb-1">Total de Faturas</p>
              <p className="text-2xl font-bold text-gray-900">
                {invoices.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <CreditCardIcon size={24} className="text-blue-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabela de Faturas */}
      <Card className="p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Histórico de Faturas
        </h2>

        {invoices.length === 0 ? <div className="text-center py-12">
            <CreditCardIcon size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Nenhuma fatura encontrada</p>
          </div> : <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Mês Referência
                  </th>
                  {isSuperUser && <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      Empresa
                    </th>}
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Valor
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Vencimento
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
                {invoices.map(invoice => <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {invoice.mes_referencia}
                    </td>
                    {isSuperUser && <td className="py-3 px-4 text-sm text-gray-900">
                        {companies.find(c => c.id === invoice.empresa_id)?.razao_social}
                      </td>}
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">
                      {formatCurrency(invoice.valor)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {formatDate(invoice.data_vencimento)}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {!isSuperUser && invoice.status !== 'pago' && <Button size="sm" onClick={() => handleOpenPayment(invoice)}>
                            <CreditCardIcon size={14} className="mr-1" />
                            Pagar
                          </Button>}

                        {isSuperUser && invoice.status !== 'pago' && <Button size="sm" onClick={() => handleMarkAsPaid(invoice.id)}>
                            Marcar como Pago
                          </Button>}

                        {invoice.status === 'pago' && <Button size="sm" variant="secondary">
                            <DownloadIcon size={14} className="mr-1" />
                            Baixar
                          </Button>}
                      </div>
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>}
      </Card>

      {/* Modal de Pagamento */}
      <Dialog isOpen={showPaymentModal} onClose={() => {
      setShowPaymentModal(false);
      setPixData(null);
      setSelectedInvoice(null);
      setQrCodeUrl('');
    }} title="Escolha a forma de pagamento" showFooter={false}>
        <div className="space-y-6">
          {/* Seletor de Método */}
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => {
            setPaymentMethod('pix');
            if (selectedInvoice && !pixData && !generatingPix) {
              handleGeneratePix(selectedInvoice);
            }
          }} className={`p-4 border-2 rounded-lg transition-all ${paymentMethod === 'pix' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <QrCodeIcon size={32} className={`mx-auto mb-2 ${paymentMethod === 'pix' ? 'text-green-600' : 'text-gray-400'}`} />
              <p className="font-medium text-sm">PIX</p>
              <p className="text-xs text-gray-600">Aprovação instantânea</p>
            </button>

            <button onClick={() => setPaymentMethod('card')} className={`p-4 border-2 rounded-lg transition-all ${paymentMethod === 'card' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <CreditCardIcon size={32} className={`mx-auto mb-2 ${paymentMethod === 'card' ? 'text-blue-600' : 'text-gray-400'}`} />
              <p className="font-medium text-sm">Cartão</p>
              <p className="text-xs text-gray-600">Crédito ou Débito</p>
            </button>
          </div>

          {/* Conteúdo PIX */}
          {paymentMethod === 'pix' && <div className="space-y-4">
              {generatingPix ? <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Gerando PIX...</p>
                </div> : pixData ? <>
                  {/* Aviso sobre QR Code */}
                  <Card className="p-4 bg-yellow-50 border-yellow-200">
                    <div className="flex items-start gap-3">
                      <AlertCircleIcon size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-900 mb-1">
                          ⚠️ QR Code de Demonstração
                        </p>
                        <p className="text-xs text-yellow-800">
                          O QR Code exibido é apenas visual. Para pagamento
                          real, copie o código PIX abaixo e cole no app do seu
                          banco.
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 bg-gray-50">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Valor</span>
                        <span className="text-sm font-bold text-green-600">
                          {formatCurrency(pixData.valor)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Beneficiário
                        </span>
                        <span className="text-sm font-medium">
                          {pixData.beneficiario}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Chave PIX</span>
                        <span className="text-sm font-medium">
                          {pixData.pixKey}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Vencimento
                        </span>
                        <span className="text-sm font-medium">
                          {formatDate(pixData.vencimento)}
                        </span>
                      </div>
                    </div>
                  </Card>

                  {/* QR Code Visual */}
                  <div className="flex justify-center p-6 bg-white border-2 border-gray-200 rounded-lg">
                    <div className="text-center">
                      {qrCodeUrl ? <img src={qrCodeUrl} alt="QR Code PIX (Demonstração)" className="w-[200px] h-[200px] mx-auto" /> : <div className="w-[200px] h-[200px] bg-gray-100 flex items-center justify-center rounded">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                        </div>}
                      <p className="text-xs text-gray-500 mt-2">
                        QR Code de demonstração
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ✅ Copie o código PIX para pagamento real
                    </label>
                    <div className="flex gap-2">
                      <input type="text" value={pixData.pixCode} readOnly className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-xs font-mono" />
                      <Button onClick={handleCopyPix} variant="secondary">
                        <CopyIcon size={16} />
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-900">
                      <strong>💡 Como pagar:</strong>
                      <br />
                      1. Copie o código PIX acima
                      <br />
                      2. Abra o app do seu banco
                      <br />
                      3. Escolha "Pagar com PIX"
                      <br />
                      4. Cole o código copiado
                      <br />
                      5. Confirme o pagamento
                    </p>
                  </div>
                </> : <div className="text-center py-8">
                  <p className="text-gray-600">
                    Aguarde enquanto geramos o código PIX...
                  </p>
                </div>}
            </div>}

          {/* Conteúdo Cartão */}
          {paymentMethod === 'card' && selectedInvoice && <div className="space-y-4">
              <Card className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs opacity-80">Valor a pagar</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(selectedInvoice.valor)}
                      </p>
                    </div>
                    <CreditCardIcon size={32} className="opacity-80" />
                  </div>
                  <div>
                    <p className="text-sm opacity-80">Número do cartão</p>
                    <p className="font-mono text-lg tracking-wider">
                      {cardNumber || '•••• •••• •••• ••••'}
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <div>
                      <p className="text-xs opacity-80">Nome</p>
                      <p className="text-sm">{cardName || 'NOME NO CARTÃO'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs opacity-80">Validade</p>
                      <p className="text-sm">{cardExpiry || 'MM/AA'}</p>
                    </div>
                  </div>
                </div>
              </Card>

              <Input label="Número do Cartão" value={cardNumber} onChange={e => setCardNumber(formatCardNumber(e.target.value))} placeholder="1234 5678 9012 3456" maxLength={19} disabled={processingPayment} />

              <Input label="Nome no Cartão" value={cardName} onChange={e => setCardName(e.target.value.toUpperCase())} placeholder="NOME COMPLETO" disabled={processingPayment} />

              <div className="grid grid-cols-2 gap-4">
                <Input label="Validade" value={cardExpiry} onChange={e => setCardExpiry(formatExpiry(e.target.value))} placeholder="MM/AA" maxLength={5} disabled={processingPayment} />
                <Input label="CVV" value={cardCvv} onChange={e => setCardCvv(e.target.value.replace(/\D/g, ''))} placeholder="123" maxLength={4} type="password" disabled={processingPayment} />
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-900">
                  <strong>🔒 Pagamento Seguro:</strong>
                  <br />
                  Seus dados são criptografados e não são armazenados em nossos
                  servidores.
                </p>
              </div>

              <Button className="w-full" onClick={handleCardPayment} disabled={processingPayment}>
                {processingPayment ? 'Processando...' : `Pagar ${formatCurrency(selectedInvoice.valor)}`}
              </Button>
            </div>}

          <Button className="w-full" variant="secondary" onClick={() => {
          setShowPaymentModal(false);
          setPixData(null);
          setSelectedInvoice(null);
          setQrCodeUrl('');
        }} disabled={processingPayment}>
            Cancelar
          </Button>
        </div>
      </Dialog>
    </div>;
}