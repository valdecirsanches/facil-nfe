import React, { useEffect, useState, useRef } from 'react';
import { Header } from '../components/Header';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Table } from '../components/ui/Table';
import { SearchableSelect } from '../components/ui/SearchableSelect';
import { DeliveryAddresses } from '../components/DeliveryAddresses';
import { UserIcon, EditIcon, SearchIcon, MapPinIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { db } from '../utils/database';
import { useCompany } from '../context/CompanyContext';
import { useCEP } from '../hooks/useCEP';
const ITEMS_PER_PAGE = 20;
export function Clients() {
  const {
    activeCompanyId
  } = useCompany();
  const [clients, setClients] = useState<any[]>([]);
  const [filteredClients, setFilteredClients] = useState<any[]>([]);
  const [paginatedClients, setPaginatedClients] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [transportadoras, setTransportadoras] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showAddresses, setShowAddresses] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const {
    buscarCEP,
    loading: cepLoading
  } = useCEP();
  const numeroRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    tipo_documento: 'cnpj' as 'cnpj' | 'cpf',
    documento: '',
    razao_social: '',
    nome_fantasia: '',
    ie: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
    cep: '',
    codigo_municipio: '',
    telefone: '',
    email: '',
    transportadora_id: ''
  });
  useEffect(() => {
    if (activeCompanyId) {
      loadData();
    }
  }, [activeCompanyId]);
  useEffect(() => {
    filterAndPaginateClients();
  }, [searchTerm, clients, currentPage]);
  const normalizeText = (text: string) => {
    return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  };
  const filterAndPaginateClients = () => {
    let filtered = clients;
    if (searchTerm.trim() !== '') {
      const normalizedSearch = normalizeText(searchTerm);
      filtered = clients.filter(client => {
        const id = client.id.toString();
        const razaoSocial = normalizeText(client.razao_social || '');
        const nomeFantasia = normalizeText(client.nome_fantasia || '');
        const documento = client.documento || '';
        const cidade = normalizeText(client.cidade || '');
        const uf = normalizeText(client.uf || '');
        return id.includes(normalizedSearch) || razaoSocial.includes(normalizedSearch) || nomeFantasia.includes(normalizedSearch) || documento.includes(normalizedSearch) || cidade.includes(normalizedSearch) || uf.includes(normalizedSearch);
      });
    }
    setFilteredClients(filtered);
    const total = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    setTotalPages(total);
    const validPage = Math.min(currentPage, total || 1);
    setCurrentPage(validPage);
    const startIndex = (validPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    setPaginatedClients(filtered.slice(startIndex, endIndex));
  };
  const loadData = async () => {
    if (!activeCompanyId) return;
    try {
      await db.initialize();
      const [clientsData, transportadorasData] = await Promise.all([db.getClients(activeCompanyId), db.searchTransportadoras(activeCompanyId, '', 1000)]);
      setClients(clientsData);
      setTransportadoras(transportadorasData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleCEPChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCep = e.target.value;
    setFormData(prev => ({
      ...prev,
      cep: newCep
    }));
    const cleanCEP = newCep.replace(/\D/g, '');
    if (cleanCEP.length === 8) {
      const cepData = await buscarCEP(cleanCEP);
      if (cepData) {
        setFormData(prev => ({
          ...prev,
          endereco: cepData.endereco,
          bairro: cepData.bairro,
          cidade: cepData.cidade,
          uf: cepData.uf,
          codigo_municipio: cepData.codigo_municipio
        }));
        setTimeout(() => {
          numeroRef.current?.focus();
        }, 100);
      }
    }
  };
  const handleEdit = (client: any) => {
    setFormData({
      tipo_documento: client.tipo_documento,
      documento: client.documento,
      razao_social: client.razao_social,
      nome_fantasia: client.nome_fantasia || '',
      ie: client.ie || '',
      endereco: client.endereco || '',
      numero: client.numero || '',
      complemento: client.complemento || '',
      bairro: client.bairro || '',
      cidade: client.cidade || '',
      uf: client.uf || '',
      cep: client.cep || '',
      codigo_municipio: client.codigo_municipio || '',
      telefone: client.telefone || '',
      email: client.email || '',
      transportadora_id: client.transportadora_id?.toString() || ''
    });
    setEditingId(client.id);
    setShowForm(true);
    setShowAddresses(false);
  };
  const handleManageAddresses = (clientId: number) => {
    setSelectedClientId(clientId);
    setShowAddresses(true);
    setShowForm(false);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompanyId) {
      alert('Selecione uma empresa ativa primeiro');
      return;
    }
    // Validar código do município
    if (!formData.codigo_municipio) {
      alert('Por favor, busque o CEP para preencher o código do município automaticamente.');
      return;
    }
    try {
      const clientData = {
        ...formData,
        transportadora_id: formData.transportadora_id ? parseInt(formData.transportadora_id) : null
      };
      if (editingId) {
        await db.updateClient(activeCompanyId, {
          ...clientData,
          id: editingId
        });
      } else {
        await db.createClient(activeCompanyId, clientData);
      }
      await loadData();
      handleCancel();
    } catch (error) {
      console.error('Error saving client:', error);
      alert('Erro ao salvar cliente');
    }
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  const handleCancel = () => {
    setShowForm(false);
    setShowAddresses(false);
    setEditingId(null);
    setSelectedClientId(null);
    setFormData({
      tipo_documento: 'cnpj',
      documento: '',
      razao_social: '',
      nome_fantasia: '',
      ie: '',
      endereco: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      uf: '',
      cep: '',
      codigo_municipio: '',
      telefone: '',
      email: '',
      transportadora_id: ''
    });
  };
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  if (!activeCompanyId) {
    return <div className="flex-1 bg-gray-50">
        <Header title="Clientes (Destinatários)" />
        <main className="p-8">
          <Card className="p-12 text-center">
            <p className="text-gray-600">
              Selecione uma empresa ativa para gerenciar clientes
            </p>
          </Card>
        </main>
      </div>;
  }
  if (loading) {
    return <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Carregando...</p>
      </div>;
  }
  const transportadoraOptions = transportadoras.map(t => ({
    value: t.id.toString(),
    label: t.razao_social,
    subtitle: t.cnpj ? `CNPJ: ${t.cnpj}` : t.cidade || ''
  }));
  return <div className="flex-1 bg-gray-50">
      <Header title="Clientes (Destinatários)" />

      <main className="p-8">
        {showAddresses && selectedClientId && activeCompanyId ? <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Gerenciar Endereços de Entrega
              </h3>
              <Button variant="secondary" onClick={handleCancel}>
                Voltar para Clientes
              </Button>
            </div>
            <DeliveryAddresses companyId={activeCompanyId} clientId={selectedClientId} />
          </Card> : !showForm ? <>
            <div className="mb-6 flex justify-between items-center gap-4">
              <div className="flex-1 max-w-md relative">
                <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" value={searchTerm} onChange={e => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }} placeholder="Pesquisar por código, nome, documento, cidade..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <Button onClick={() => setShowForm(true)}>
                <UserIcon size={18} className="mr-2" />
                Novo Cliente
              </Button>
            </div>

            {filteredClients.length === 0 ? <Card className="p-12 text-center">
                {searchTerm ? <>
                    <SearchIcon size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Nenhum resultado encontrado
                    </h3>
                    <p className="text-gray-600">
                      Tente buscar por outro termo. A busca funciona com código,
                      nome, documento ou cidade.
                    </p>
                  </> : <>
                    <UserIcon size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Nenhum cliente cadastrado
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Cadastre clientes para emitir notas fiscais
                    </p>
                    <Button onClick={() => setShowForm(true)}>
                      Cadastrar Cliente
                    </Button>
                  </>}
              </Card> : <>
                <Card>
                  <Table headers={['Código', 'Nome/Razão Social', 'Documento', 'Cidade/UF', 'Telefone', 'Ações']}>
                    {paginatedClients.map(client => <tr key={client.id} className="hover:bg-gray-50 cursor-pointer" onDoubleClick={() => handleEdit(client)} title="Duplo clique para editar">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          #{client.id}
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">
                              {client.razao_social}
                            </p>
                            {client.nome_fantasia && <p className="text-sm text-gray-600">
                                {client.nome_fantasia}
                              </p>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {client.tipo_documento.toUpperCase()}:{' '}
                          {client.documento}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {client.cidade && client.uf ? `${client.cidade}/${client.uf}` : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {client.telefone || '-'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button onClick={e => {
                      e.stopPropagation();
                      handleEdit(client);
                    }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar cliente">
                              <EditIcon size={16} />
                            </button>
                            <button onClick={e => {
                      e.stopPropagation();
                      handleManageAddresses(client.id);
                    }} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Gerenciar endereços de entrega">
                              <MapPinIcon size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>)}
                  </Table>
                </Card>

                {totalPages > 1 && <div className="mt-6 flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1} a{' '}
                      {Math.min(currentPage * ITEMS_PER_PAGE, filteredClients.length)}{' '}
                      de {filteredClients.length} clientes
                    </p>
                    <div className="flex items-center gap-2">
                      <Button variant="secondary" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                        <ChevronLeftIcon size={16} />
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({
                  length: totalPages
                }, (_, i) => i + 1).map(page => {
                  if (page === 1 || page === totalPages || page >= currentPage - 2 && page <= currentPage + 2) {
                    return <button key={page} onClick={() => handlePageChange(page)} className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${page === currentPage ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                                {page}
                              </button>;
                  } else if (page === currentPage - 3 || page === currentPage + 3) {
                    return <span key={page} className="text-gray-400">
                                ...
                              </span>;
                  }
                  return null;
                })}
                      </div>
                      <Button variant="secondary" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                        <ChevronRightIcon size={16} />
                      </Button>
                    </div>
                  </div>}
              </>}
          </> : <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              {editingId ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Select label="Tipo de Documento *" name="tipo_documento" value={formData.tipo_documento} onChange={handleChange} options={[{
              value: 'cnpj',
              label: 'CNPJ'
            }, {
              value: 'cpf',
              label: 'CPF'
            }]} />
                <Input label={`${formData.tipo_documento.toUpperCase()} *`} name="documento" value={formData.documento} onChange={handleChange} placeholder={formData.tipo_documento === 'cnpj' ? '00.000.000/0000-00' : '000.000.000-00'} required />
                <Input label="Razão Social / Nome Completo *" name="razao_social" value={formData.razao_social} onChange={handleChange} required className="md:col-span-2" />
                <Input label="Nome Fantasia" name="nome_fantasia" value={formData.nome_fantasia} onChange={handleChange} />
                <Input label="Inscrição Estadual" name="ie" value={formData.ie} onChange={handleChange} />

                <SearchableSelect label="Transportadora Padrão" value={formData.transportadora_id} onChange={value => setFormData({
              ...formData,
              transportadora_id: value
            })} options={transportadoraOptions} placeholder="Selecione uma transportadora" searchPlaceholder="Pesquisar por nome, CNPJ ou cidade..." className="md:col-span-2" />

                <Input label="CEP *" name="cep" value={formData.cep} onChange={handleCEPChange} placeholder="00000-000" required disabled={cepLoading} />
                {cepLoading && <div className="flex items-center text-sm text-gray-600">
                    Buscando CEP...
                  </div>}
                <Input label="Endereço" name="endereco" value={formData.endereco} onChange={handleChange} className="md:col-span-2" />
                <Input label="Número *" name="numero" value={formData.numero} onChange={handleChange} ref={numeroRef} required />
                <Input label="Complemento" name="complemento" value={formData.complemento} onChange={handleChange} placeholder="Apto, Sala, etc" />
                <Input label="Bairro" name="bairro" value={formData.bairro} onChange={handleChange} />
                <Input label="Cidade" name="cidade" value={formData.cidade} onChange={handleChange} readOnly />
                <Input label="UF" name="uf" value={formData.uf} onChange={handleChange} placeholder="SP" maxLength={2} readOnly />
                <Input label="Código do Município (IBGE) *" name="codigo_municipio" value={formData.codigo_municipio} onChange={handleChange} placeholder="Preenchido automaticamente ao buscar CEP" required readOnly className={!formData.codigo_municipio ? 'bg-yellow-50' : ''} />
                <Input label="Telefone" name="telefone" value={formData.telefone} onChange={handleChange} />
                <Input label="E-mail" name="email" type="email" value={formData.email} onChange={handleChange} className="md:col-span-2" />
              </div>

              {!formData.codigo_municipio && <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    ⚠️ <strong>Atenção:</strong> O código do município é
                    obrigatório para emissão de NFe. Por favor, preencha o CEP e
                    clique fora do campo para buscar automaticamente.
                  </p>
                </div>}

              <div className="flex justify-end gap-4">
                <Button type="button" variant="secondary" onClick={handleCancel}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={!formData.codigo_municipio}>
                  {editingId ? 'Salvar Alterações' : 'Cadastrar Cliente'}
                </Button>
              </div>
            </form>
          </Card>}
      </main>
    </div>;
}