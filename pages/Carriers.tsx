import React, { useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';
import { Header } from '../components/Header';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Table } from '../components/ui/Table';
import { TruckIcon, EditIcon, SearchIcon } from 'lucide-react';
import { db } from '../utils/database';
import { useCompany } from '../context/CompanyContext';
export function Carriers() {
  const {
    activeCompanyId
  } = useCompany();
  const [carriers, setCarriers] = useState<any[]>([]);
  const [filteredCarriers, setFilteredCarriers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    razao_social: '',
    cnpj: '',
    ie: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
    cep: '',
    telefone: '',
    email: '',
    nome_motorista: '',
    placa_veiculo: '',
    uf_veiculo: '',
    rntc: '',
    observacoes: ''
  });
  useEffect(() => {
    if (activeCompanyId) {
      loadCarriers();
    }
  }, [activeCompanyId]);
  useEffect(() => {
    filterCarriers();
  }, [searchTerm, carriers]);
  const normalizeText = (text: string) => {
    return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  };
  const filterCarriers = () => {
    if (searchTerm.trim() === '') {
      setFilteredCarriers(carriers);
    } else {
      const normalizedSearch = normalizeText(searchTerm);
      const filtered = carriers.filter(carrier => {
        const razaoSocial = normalizeText(carrier.razao_social || '');
        const cidade = normalizeText(carrier.cidade || '');
        const telefone = carrier.telefone || '';
        const cnpj = carrier.cnpj || '';
        return razaoSocial.includes(normalizedSearch) || cidade.includes(normalizedSearch) || telefone.includes(normalizedSearch) || cnpj.includes(normalizedSearch);
      });
      setFilteredCarriers(filtered);
    }
  };
  const loadCarriers = async () => {
    if (!activeCompanyId) return;
    try {
      await db.initialize();
      const data = await db.getCarriers(activeCompanyId);
      setCarriers(data);
      setFilteredCarriers(data);
    } catch (error) {
      console.error('Error loading carriers:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleEdit = (carrier: any) => {
    setFormData({
      razao_social: carrier.razao_social,
      cnpj: carrier.cnpj || '',
      ie: carrier.ie || '',
      endereco: carrier.endereco || '',
      numero: carrier.numero || '',
      complemento: carrier.complemento || '',
      bairro: carrier.bairro || '',
      cidade: carrier.cidade || '',
      uf: carrier.uf || carrier.estado || '',
      cep: carrier.cep || '',
      telefone: carrier.telefone || '',
      email: carrier.email || '',
      nome_motorista: carrier.nome_motorista || '',
      placa_veiculo: carrier.placa_veiculo || '',
      uf_veiculo: carrier.uf_veiculo || '',
      rntc: carrier.rntc || '',
      observacoes: carrier.observacoes || ''
    });
    setEditingId(carrier.id);
    setShowForm(true);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompanyId) {
      toast.warning('Selecione uma empresa ativa primeiro');
      return;
    }
    try {
      if (editingId) {
        await db.updateCarrier(activeCompanyId, {
          ...formData,
          id: editingId
        });
      } else {
        await db.createCarrier(activeCompanyId, formData);
      }
      await loadCarriers();
      handleCancel();
    } catch (error) {
      console.error('Error saving carrier:', error);
      toast.error('Erro ao salvar transportadora');
    }
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setSearchTerm('');
    setFormData({
      razao_social: '',
      cnpj: '',
      ie: '',
      endereco: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      uf: '',
      cep: '',
      telefone: '',
      email: '',
      nome_motorista: '',
      placa_veiculo: '',
      uf_veiculo: '',
      rntc: '',
      observacoes: ''
    });
  };
  if (!activeCompanyId) {
    return <div className="flex-1 bg-gray-50">
        <Header title="Transportadoras" />
        <main className="p-8">
          <Card className="p-12 text-center">
            <p className="text-gray-600">
              Selecione uma empresa ativa para gerenciar transportadoras
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
  return <div className="flex-1 bg-gray-50">
      <Header title="Transportadoras" />

      <main className="p-8">
        {!showForm ? <>
            <div className="mb-6 flex justify-between items-center gap-4">
              <div className="flex-1 max-w-md relative">
                <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Pesquisar por razão social, cidade ou telefone..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <Button onClick={() => setShowForm(true)}>
                <TruckIcon size={18} className="mr-2" />
                Nova Transportadora
              </Button>
            </div>

            {filteredCarriers.length === 0 ? <Card className="p-12 text-center">
                {searchTerm ? <>
                    <SearchIcon size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Nenhum resultado encontrado
                    </h3>
                    <p className="text-gray-600">
                      Tente buscar por outro termo. A busca funciona com razão
                      social, cidade ou telefone.
                    </p>
                  </> : <>
                    <TruckIcon size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Nenhuma transportadora cadastrada
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Cadastre transportadoras para usar nas notas fiscais
                    </p>
                    <Button onClick={() => setShowForm(true)}>
                      Cadastrar Transportadora
                    </Button>
                  </>}
              </Card> : <Card>
                <Table headers={['Razão Social', 'CNPJ', 'Cidade/UF', 'Telefone', 'Ações']}>
                  {filteredCarriers.map(carrier => <tr key={carrier.id} className="hover:bg-gray-50 cursor-pointer" onDoubleClick={() => handleEdit(carrier)} title="Duplo clique para editar">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {carrier.razao_social}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {carrier.cnpj || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {carrier.cidade && (carrier.uf || carrier.estado) ? `${carrier.cidade}/${carrier.uf || carrier.estado}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {carrier.telefone || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={e => {
                  e.stopPropagation();
                  handleEdit(carrier);
                }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <EditIcon size={16} />
                        </button>
                      </td>
                    </tr>)}
                </Table>
              </Card>}
          </> : <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              {editingId ? 'Editar Transportadora' : 'Cadastrar Nova Transportadora'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* Dados da Empresa */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-4">
                    Dados da Empresa
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Razão Social *" name="razao_social" value={formData.razao_social} onChange={handleChange} required className="md:col-span-2" />
                    <Input label="CNPJ" name="cnpj" value={formData.cnpj} onChange={handleChange} placeholder="00.000.000/0000-00" />
                    <Input label="Inscrição Estadual" name="ie" value={formData.ie} onChange={handleChange} />
                    <Input label="Telefone" name="telefone" value={formData.telefone} onChange={handleChange} />
                    <Input label="E-mail" name="email" type="email" value={formData.email} onChange={handleChange} />
                  </div>
                </div>

                {/* Endereço */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-4">
                    Endereço
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="CEP" name="cep" value={formData.cep} onChange={handleChange} placeholder="00000-000" />
                    <div></div>
                    <Input label="Endereço" name="endereco" value={formData.endereco} onChange={handleChange} className="md:col-span-2" />
                    <Input label="Número" name="numero" value={formData.numero} onChange={handleChange} />
                    <Input label="Complemento" name="complemento" value={formData.complemento} onChange={handleChange} placeholder="Apto, Sala, etc" />
                    <Input label="Bairro" name="bairro" value={formData.bairro} onChange={handleChange} />
                    <Input label="Cidade" name="cidade" value={formData.cidade} onChange={handleChange} />
                    <Input label="UF" name="uf" value={formData.uf} onChange={handleChange} placeholder="SP" maxLength={2} />
                  </div>
                </div>

                {/* Dados do Motorista e Veículo */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-4">
                    Motorista e Veículo
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Nome do Motorista" name="nome_motorista" value={formData.nome_motorista} onChange={handleChange} className="md:col-span-2" />
                    <Input label="Placa do Veículo" name="placa_veiculo" value={formData.placa_veiculo} onChange={handleChange} placeholder="ABC-1234" />
                    <Input label="UF do Veículo" name="uf_veiculo" value={formData.uf_veiculo} onChange={handleChange} placeholder="SP" maxLength={2} />
                    <Input label="RNTC" name="rntc" value={formData.rntc} onChange={handleChange} placeholder="Registro Nacional de Transportadores" className="md:col-span-2" />
                  </div>
                </div>

                {/* Observações */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observações
                  </label>
                  <textarea name="observacoes" value={formData.observacoes} onChange={handleChange} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Informações adicionais sobre a transportadora..." />
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <Button type="button" variant="secondary" onClick={handleCancel}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingId ? 'Salvar Alterações' : 'Cadastrar Transportadora'}
                </Button>
              </div>
            </form>
          </Card>}
      </main>
    </div>;
}