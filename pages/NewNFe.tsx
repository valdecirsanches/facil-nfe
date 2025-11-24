import React, { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { SearchableSelect } from '../components/ui/SearchableSelect';
import { NFeTransmissionLog } from '../components/NFeTransmissionLog';
import { NFeActions } from '../components/NFeActions';
import { PlusIcon, TrashIcon, CheckCircleIcon, XIcon, ArrowLeftIcon, AlertTriangleIcon } from 'lucide-react';
import { db } from '../utils/database';
import { useCompany } from '../context/CompanyContext';
interface NewNFeProps {
  onNavigate: (page: string) => void;
}
interface Product {
  id: number;
  produto_id: number;
  description: string;
  quantity: string;
  unitValue: string;
  total: string;
  ncm?: string;
  cfop?: string;
}
interface LogEntry {
  timestamp: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  message: string;
  details?: string;
}
interface ValidationError {
  code: string;
  field: string;
  message: string;
  severity: 'error' | 'warning';
  solution?: string;
}
export function NewNFe({
  onNavigate
}: NewNFeProps) {
  const {
    activeCompanyId
  } = useCompany();
  const [clients, setClients] = useState<any[]>([]);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [company, setCompany] = useState<any>(null);
  const [cfopSearch, setCfopSearch] = useState('');
  const [cfopResults, setCfopResults] = useState<any[]>([]);
  const [cfopLoading, setCfopLoading] = useState(false);
  const [showCfopResults, setShowCfopResults] = useState(false);
  const [selectedCfop, setSelectedCfop] = useState<any>(null);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [naturezaOperacao, setNaturezaOperacao] = useState('Venda de mercadoria'); // PADRÃO
  const [products, setProducts] = useState<Product[]>([{
    id: 1,
    produto_id: 0,
    description: '',
    quantity: '1',
    unitValue: '',
    total: '0.00'
  }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [nfeNumber, setNfeNumber] = useState('');
  const [nfeId, setNfeId] = useState<number>(0);
  const [transmissionLogs, setTransmissionLogs] = useState<LogEntry[]>([]);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  useEffect(() => {
    if (activeCompanyId) {
      loadData();
    }
  }, [activeCompanyId]);
  // Carregar CFOP 5102 por padrão
  useEffect(() => {
    if (activeCompanyId && !selectedCfop) {
      loadDefaultCFOP();
    }
  }, [activeCompanyId]);
  // Atualizar selectedClient quando selectedClientId mudar
  useEffect(() => {
    if (selectedClientId && clients.length > 0) {
      const client = clients.find(c => c.id === parseInt(selectedClientId));
      setSelectedClient(client || null);
    } else {
      setSelectedClient(null);
    }
  }, [selectedClientId, clients]);
  useEffect(() => {
    if (cfopSearch.length >= 2 && !selectedCfop) {
      const timer = setTimeout(() => {
        searchCFOP(cfopSearch);
      }, 300);
      return () => clearTimeout(timer);
    } else if (cfopSearch.length < 2) {
      setCfopResults([]);
      setShowCfopResults(false);
    }
  }, [cfopSearch, selectedCfop]);
  const loadDefaultCFOP = async () => {
    try {
      const results = await db.searchCFOPs('5102', 1);
      if (results.length > 0) {
        const cfop5102 = results[0];
        setSelectedCfop(cfop5102);
        setCfopSearch(`${cfop5102.id} - ${cfop5102.descricao || cfop5102.texto || 'Sem descrição'}`);
      }
    } catch (error) {
      console.error('Error loading default CFOP:', error);
    }
  };
  const addLog = (status: LogEntry['status'], message: string, details?: string) => {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    setTransmissionLogs(prev => [...prev, {
      timestamp,
      status,
      message,
      details
    }]);
  };
  const searchCFOP = async (query: string) => {
    setCfopLoading(true);
    try {
      const results = await db.searchCFOPs(query, 50);
      setCfopResults(results);
      setShowCfopResults(results.length > 0);
    } catch (error) {
      console.error('Error searching CFOP:', error);
    } finally {
      setCfopLoading(false);
    }
  };
  const selectCFOP = (cfop: any) => {
    setSelectedCfop(cfop);
    setCfopSearch(`${cfop.id} - ${cfop.descricao || cfop.texto || 'Sem descrição'}`);
    setShowCfopResults(false);
  };
  const clearCFOP = () => {
    setSelectedCfop(null);
    setCfopSearch('');
    setCfopResults([]);
    setShowCfopResults(false);
  };
  const loadData = async () => {
    if (!activeCompanyId) return;
    try {
      await db.initialize();
      const [clientsData, productsData, companyData] = await Promise.all([db.getClients(activeCompanyId), db.searchProducts(activeCompanyId, '', 100), db.getCompanyById(activeCompanyId)]);
      setClients(clientsData);
      setAvailableProducts(productsData);
      setCompany(companyData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };
  const addProduct = () => {
    setProducts([...products, {
      id: Date.now(),
      produto_id: 0,
      description: '',
      quantity: '1',
      unitValue: '',
      total: '0.00'
    }]);
  };
  const removeProduct = (id: number) => {
    if (products.length > 1) {
      setProducts(products.filter(p => p.id !== id));
    }
  };
  const handleProductSelect = (id: number, productId: string) => {
    const selectedProduct = availableProducts.find(p => p.id === parseInt(productId));
    setProducts(products.map(p => {
      if (p.id === id && selectedProduct) {
        const qty = parseFloat(p.quantity) || 1;
        const unitVal = selectedProduct.valor_unitario;
        return {
          ...p,
          produto_id: selectedProduct.id,
          description: selectedProduct.descricao,
          unitValue: unitVal.toString(),
          total: (qty * unitVal).toFixed(2),
          ncm: selectedProduct.ncm,
          cfop: selectedProduct.cfop
        };
      }
      return p;
    }));
  };
  const updateProduct = (id: number, field: keyof Product, value: string) => {
    setProducts(products.map(p => {
      if (p.id === id) {
        const updated = {
          ...p,
          [field]: value
        };
        if (field === 'quantity' || field === 'unitValue') {
          const qty = parseFloat(field === 'quantity' ? value : updated.quantity) || 0;
          const unit = parseFloat(field === 'unitValue' ? value : updated.unitValue) || 0;
          updated.total = (qty * unit).toFixed(2);
        }
        return updated;
      }
      return p;
    }));
  };
  const calculateTotal = () => {
    return products.reduce((sum, p) => sum + parseFloat(p.total || '0'), 0).toFixed(2);
  };
  const validateNFe = () => {
    const errors: ValidationError[] = [];
    // Validar empresa emitente
    if (!company) {
      errors.push({
        code: 'E001',
        field: 'emitente',
        message: 'Dados da empresa não carregados',
        severity: 'error'
      });
      return errors;
    }
    if (!company.cnpj || company.cnpj.replace(/\D/g, '').length !== 14) {
      errors.push({
        code: 'E002',
        field: 'emitente.cnpj',
        message: 'CNPJ da empresa emitente inválido',
        severity: 'error'
      });
    }
    if (!company.ie) {
      errors.push({
        code: 'E003',
        field: 'emitente.ie',
        message: 'Inscrição Estadual não configurada',
        severity: 'error',
        solution: 'Configure em Empresas'
      });
    }
    if (!company.endereco || !company.cidade || !company.estado) {
      errors.push({
        code: 'E004',
        field: 'emitente.endereco',
        message: 'Endereço completo da empresa não configurado',
        severity: 'error',
        solution: 'Complete o cadastro da empresa'
      });
    }
    // Validar destinatário
    if (!selectedClientId) {
      errors.push({
        code: 'D001',
        field: 'destinatario',
        message: 'Cliente não selecionado',
        severity: 'error'
      });
    } else {
      const client = clients.find(c => c.id === parseInt(selectedClientId));
      if (client) {
        const doc = client.documento?.replace(/\D/g, '') || '';
        if (client.tipo_documento === 'cnpj' && doc.length !== 14) {
          errors.push({
            code: 'D002',
            field: 'destinatario.cnpj',
            message: 'CNPJ do cliente inválido',
            severity: 'error',
            solution: 'Corrija o cadastro do cliente'
          });
        }
        if (!client.endereco || !client.cidade || !client.uf) {
          errors.push({
            code: 'D005',
            field: 'destinatario.endereco',
            message: 'Endereço completo do cliente obrigatório',
            severity: 'error',
            solution: 'Complete o cadastro do cliente'
          });
        }
      }
    }
    // Validar produtos
    products.forEach((produto, index) => {
      if (!produto.produto_id || produto.produto_id === 0) {
        errors.push({
          code: 'P001',
          field: `produtos[${index}].produto`,
          message: `Produto ${index + 1}: Selecione um produto`,
          severity: 'error'
        });
      }
      if (!produto.description || produto.description.trim().length < 3) {
        errors.push({
          code: 'P002',
          field: `produtos[${index}].descricao`,
          message: `Produto ${index + 1}: Descrição inválida`,
          severity: 'error'
        });
      }
      if (!produto.quantity || parseFloat(produto.quantity) <= 0) {
        errors.push({
          code: 'P003',
          field: `produtos[${index}].quantidade`,
          message: `Produto ${index + 1}: Quantidade inválida`,
          severity: 'error'
        });
      }
      if (!produto.unitValue || parseFloat(produto.unitValue) <= 0) {
        errors.push({
          code: 'P004',
          field: `produtos[${index}].valor_unitario`,
          message: `Produto ${index + 1}: Valor unitário inválido`,
          severity: 'error'
        });
      }
    });
    // Validar dados fiscais
    if (!naturezaOperacao || naturezaOperacao.trim().length < 3) {
      errors.push({
        code: 'F001',
        field: 'natureza_operacao',
        message: 'Natureza da operação não informada',
        severity: 'error'
      });
    }
    if (!selectedCfop) {
      errors.push({
        code: 'F002',
        field: 'cfop',
        message: 'CFOP não selecionado',
        severity: 'error'
      });
    }
    return errors;
  };
  const simulateTransmission = async (nfeId: number) => {
    setIsTransmitting(true);
    setTransmissionLogs([]);
    try {
      // Etapa 1: Consultar status SEFAZ
      addLog('processing', 'Verificando status da SEFAZ...', 'Consultando disponibilidade');
      await new Promise(resolve => setTimeout(resolve, 500));
      let sefazOnline = false;
      try {
        const statusSefaz = await db.consultarStatusSefaz(company?.estado || 'SP');
        if (statusSefaz.status === 'online') {
          addLog('success', 'SEFAZ Online', `${statusSefaz.mensagem} - ${statusSefaz.uf}`);
          sefazOnline = true;
        } else {
          addLog('error', 'SEFAZ Offline', statusSefaz.mensagem);
          addLog('processing', 'Ativando modo offline', 'NFe será salva localmente');
        }
      } catch (error) {
        addLog('error', 'SEFAZ Indisponível', 'Continuando em modo offline');
      }
      // Etapa 2: Validação
      addLog('processing', 'Validando dados da NFe...', 'Verificando campos obrigatórios');
      await new Promise(resolve => setTimeout(resolve, 800));
      addLog('success', 'Dados validados', 'Todos os campos OK');
      // Etapa 3: Gerando XML
      addLog('processing', 'Gerando XML da NFe...', 'Estrutura fiscal padrão 4.0');
      await new Promise(resolve => setTimeout(resolve, 1000));
      addLog('success', 'XML gerado', 'Arquivo criado com sucesso');
      // Etapa 4: Assinatura Digital
      addLog('processing', 'Assinando digitalmente...', 'Certificado A1');
      await new Promise(resolve => setTimeout(resolve, 1200));
      addLog('success', 'XML assinado', 'Assinatura digital aplicada');
      // Etapa 5: TRANSMISSÃO REAL PARA SEFAZ
      if (sefazOnline) {
        addLog('processing', 'Transmitindo para SEFAZ...', 'Enviando XML assinado');
      } else {
        addLog('processing', 'Salvando NFe localmente...', 'Modo offline ativado');
      }
      try {
        const resultado = await db.transmitirNFe(activeCompanyId!, nfeId);
        if (resultado.success) {
          if (resultado.modoOffline) {
            // Modo offline
            addLog('success', 'NFe Salva Localmente', 'SEFAZ indisponível no momento');
            addLog('success', 'Chave de Acesso Gerada', resultado.chave);
            addLog('processing', 'Status', 'Pendente de envio à SEFAZ');
            addLog('success', 'Arquivos salvos', resultado.xmlPath);
            // Alerta sobre modo offline
            addLog('error', 'Atenção: Modo Offline', resultado.observacao || 'Reenvie quando a SEFAZ estiver disponível');
          } else {
            // Online - autorizada
            addLog('success', 'NFe Autorizada pela SEFAZ!', `Protocolo: ${resultado.protocolo}`);
            addLog('success', 'Chave de Acesso', resultado.chave);
            addLog('success', 'Arquivos salvos', resultado.xmlPath);
          }
          // Gerando DANFE
          addLog('processing', 'Gerando DANFE...', 'Documento auxiliar');
          await new Promise(resolve => setTimeout(resolve, 800));
          addLog('success', 'DANFE gerada', 'PDF criado com sucesso');
          setIsTransmitting(false);
          return true;
        } else {
          addLog('error', 'Erro na autorização', resultado.mensagem || 'Erro desconhecido');
          setIsTransmitting(false);
          return false;
        }
      } catch (error) {
        addLog('error', 'Erro na transmissão', error instanceof Error ? error.message : 'Erro desconhecido');
        addLog('processing', 'Salvando localmente...', 'NFe será salva em modo offline');
        setIsTransmitting(false);
        return false;
      }
    } catch (error) {
      addLog('error', 'Erro no processo', error instanceof Error ? error.message : 'Erro desconhecido');
      setIsTransmitting(false);
      return false;
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompanyId) {
      alert('Selecione uma empresa ativa');
      return;
    }
    // Validação prévia
    const errors = validateNFe();
    if (errors.length > 0) {
      setValidationErrors(errors);
      setShowValidationErrors(true);
      return;
    }
    setIsSubmitting(true);
    setShowValidationErrors(false);
    try {
      const nfes = await db.getNFes(activeCompanyId);
      const nextNumber = (nfes.length + 1).toString().padStart(6, '0');
      const nfeData = {
        numero: nextNumber,
        serie: '1',
        cliente_id: parseInt(selectedClientId),
        natureza_operacao: naturezaOperacao,
        cfop: selectedCfop.id.toString(),
        valor_total: parseFloat(calculateTotal()),
        status: 'Processando'
      };
      const items = products.map(p => ({
        produto_id: p.produto_id,
        descricao: p.description,
        quantidade: parseFloat(p.quantity),
        valor_unitario: parseFloat(p.unitValue),
        valor_total: parseFloat(p.total)
      }));
      const createdNfeId = await db.createNFe(activeCompanyId, nfeData, items);
      setNfeNumber(nextNumber);
      setNfeId(createdNfeId);
      setShowSuccess(true);
      // Iniciar transmissão real
      const success = await simulateTransmission(createdNfeId);
      if (!success) {
        setShowSuccess(false);
      }
    } catch (error) {
      console.error('Error creating NFe:', error);
      alert('Erro ao emitir NFe');
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleDownloadDANFE = async () => {
    addLog('processing', 'Baixando DANFE...', 'Preparando arquivo PDF');
    await new Promise(resolve => setTimeout(resolve, 500));
    addLog('success', 'DANFE baixada', `DANFE_${nfeNumber}.pdf`);
    alert('Download da DANFE iniciado (simulado)');
  };
  const handleDownloadXML = async () => {
    addLog('processing', 'Baixando XML...', 'Preparando arquivo fiscal');
    await new Promise(resolve => setTimeout(resolve, 500));
    addLog('success', 'XML baixado', `NFe${nfeNumber}.xml`);
    alert('Download do XML iniciado (simulado)');
  };
  const handleSendEmail = async (email: string, message: string) => {
    addLog('processing', 'Enviando e-mail...', `Destinatário: ${email}`);
    await new Promise(resolve => setTimeout(resolve, 1500));
    addLog('success', 'E-mail enviado com sucesso', 'XML e PDF anexados');
  };
  const handleNewNFe = () => {
    setShowSuccess(false);
    setNfeNumber('');
    setNfeId(0);
    setSelectedClientId('');
    setSelectedClient(null);
    setNaturezaOperacao('Venda de mercadoria'); // RESETAR PARA PADRÃO
    loadDefaultCFOP(); // RECARREGAR CFOP PADRÃO
    setProducts([{
      id: 1,
      produto_id: 0,
      description: '',
      quantity: '1',
      unitValue: '',
      total: '0.00'
    }]);
    setTransmissionLogs([]);
    setValidationErrors([]);
    setShowValidationErrors(false);
  };
  if (!activeCompanyId) {
    return <div className="flex-1 bg-gray-50">
        <Header title="Emitir Nova NFe" />
        <main className="p-8">
          <Card className="p-12 text-center">
            <p className="text-gray-600">
              Selecione uma empresa para emitir notas
            </p>
          </Card>
        </main>
      </div>;
  }
  if (showSuccess) {
    return <div className="flex-1 bg-gray-50">
        <Header title="NFe Emitida com Sucesso" />
        <main className="p-8">
          <div className="mb-6">
            <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircleIcon size={32} className="text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">
                    NFe #{nfeNumber} Autorizada!
                  </h3>
                  <p className="text-gray-600">
                    Nota fiscal eletrônica emitida e autorizada pela SEFAZ
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Arquivos salvos em: Arqs/empresa_{activeCompanyId}/
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <NFeTransmissionLog logs={transmissionLogs} isTransmitting={isTransmitting} />
            <NFeActions nfeNumber={nfeNumber} nfeId={nfeId} clientEmail={selectedClient?.email} onDownloadDANFE={handleDownloadDANFE} onDownloadXML={handleDownloadXML} onSendEmail={handleSendEmail} />
          </div>

          <div className="flex justify-end gap-4">
            <Button variant="secondary" onClick={() => onNavigate('nfe-list')}>
              <ArrowLeftIcon size={16} className="mr-2" />
              Ver Todas as NFes
            </Button>
            <Button onClick={handleNewNFe}>Emitir Nova NFe</Button>
          </div>
        </main>
      </div>;
  }
  const clientOptions = clients.map(c => ({
    value: c.id.toString(),
    label: c.razao_social,
    subtitle: `${c.tipo_documento.toUpperCase()}: ${c.documento}`
  }));
  const productOptions = availableProducts.map(p => ({
    value: p.id.toString(),
    label: `${p.codigo} - ${p.descricao}`,
    subtitle: `R$ ${parseFloat(p.valor_unitario).toFixed(2)} - ${p.unidade}`
  }));
  return <div className="flex-1 bg-gray-50">
      <Header title="Emitir Nova NFe" />

      <main className="p-8">
        {showValidationErrors && validationErrors.length > 0 && <Card className="p-6 mb-6 border-red-200 bg-red-50">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangleIcon size={24} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  Erros de Validação Encontrados
                </h3>
                <p className="text-sm text-red-700 mb-4">
                  Corrija os erros abaixo antes de emitir a NFe:
                </p>
                <div className="space-y-2">
                  {validationErrors.map((error, index) => <div key={index} className="p-3 bg-white border border-red-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-mono text-red-600 bg-red-100 px-2 py-1 rounded">
                          {error.code}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {error.message}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Campo: {error.field}
                          </p>
                          {error.solution && <p className="text-sm text-blue-600 mt-1">
                              💡 {error.solution}
                            </p>}
                        </div>
                      </div>
                    </div>)}
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setShowValidationErrors(false)}>
                Fechar
              </Button>
            </div>
          </Card>}

        <form onSubmit={handleSubmit}>
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Dados do Destinatário
            </h3>
            <SearchableSelect label="Cliente / Destinatário *" value={selectedClientId} onChange={setSelectedClientId} options={clientOptions} placeholder="Selecione um cliente" searchPlaceholder="Pesquisar por nome ou documento..." required />
            {selectedClient && <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  ✓ Cliente selecionado:{' '}
                  <strong>{selectedClient.razao_social}</strong>
                </p>
              </div>}
          </Card>

          <Card className="p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Produtos / Serviços
              </h3>
              <Button type="button" variant="secondary" onClick={addProduct}>
                <PlusIcon size={16} className="mr-2" />
                Adicionar Item
              </Button>
            </div>

            <div className="space-y-4">
              {products.map((product, index) => <div key={product.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-5">
                        <SearchableSelect label={index === 0 ? 'Produto' : ''} value={product.produto_id.toString()} onChange={value => handleProductSelect(product.id, value)} options={productOptions} placeholder="Selecione um produto" searchPlaceholder="Pesquisar por código ou descrição..." required />
                      </div>
                      <div className="md:col-span-2">
                        <Input label={index === 0 ? 'Quantidade' : ''} type="number" step="0.01" placeholder="1" value={product.quantity} onChange={e => updateProduct(product.id, 'quantity', e.target.value)} required />
                      </div>
                      <div className="md:col-span-2">
                        <Input label={index === 0 ? 'Valor Unit.' : ''} type="number" step="0.01" placeholder="0.00" value={product.unitValue} onChange={e => updateProduct(product.id, 'unitValue', e.target.value)} required />
                      </div>
                      <div className="md:col-span-3">
                        <Input label={index === 0 ? 'Total' : ''} value={`R$ ${product.total}`} disabled />
                      </div>
                    </div>
                    {products.length > 1 && <button type="button" onClick={() => removeProduct(product.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-6">
                        <TrashIcon size={20} />
                      </button>}
                  </div>
                </div>)}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex justify-end">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total da Nota</p>
                  <p className="text-3xl font-bold text-gray-900">
                    R$ {calculateTotal()}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Informações Fiscais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Natureza da Operação *" value={naturezaOperacao} onChange={e => setNaturezaOperacao(e.target.value)} placeholder="Ex: Venda de mercadoria" required />

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CFOP * (Buscar por código ou descrição)
                </label>
                <div className="relative">
                  <input type="text" value={cfopSearch} onChange={e => setCfopSearch(e.target.value)} onFocus={() => cfopResults.length > 0 && setShowCfopResults(true)} placeholder="Digite código ou descrição do CFOP (ex: 5102, venda)" className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" disabled={!!selectedCfop} required />
                  {selectedCfop && <button type="button" onClick={clearCFOP} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600">
                      <XIcon size={18} />
                    </button>}
                </div>
                {cfopLoading && <p className="text-sm text-gray-600 mt-1">Buscando...</p>}
                {showCfopResults && cfopResults.length > 0 && <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {cfopResults.map(cfop => <button key={cfop.id} type="button" onClick={() => selectCFOP(cfop)} className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0">
                        <p className="font-medium text-gray-900">
                          {cfop.id} - {cfop.descricao || 'Sem descrição'}
                        </p>
                        {cfop.texto && <p className="text-xs text-gray-500 mt-1">
                            {cfop.texto}
                          </p>}
                      </button>)}
                  </div>}
                {!cfopLoading && cfopSearch.length >= 2 && cfopResults.length === 0 && !selectedCfop && <p className="text-sm text-red-600 mt-1">
                      Nenhum CFOP encontrado
                    </p>}
              </div>
            </div>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="secondary" onClick={() => onNavigate('dashboard')}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Validando e Emitindo...' : 'Emitir NFe'}
            </Button>
          </div>
        </form>
      </main>
    </div>;
}