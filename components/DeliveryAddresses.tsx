import React, { useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Table } from './ui/Table';
import { SearchableSelect } from './ui/SearchableSelect';
import { MapPinIcon, PlusIcon, EditIcon, CheckCircleIcon } from 'lucide-react';
import { db } from '../utils/database';
import { useCEP } from '../hooks/useCEP';
interface DeliveryAddressesProps {
  companyId: number;
  clientId: number;
}
export function DeliveryAddresses({
  companyId,
  clientId
}: DeliveryAddressesProps) {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [transportadoras, setTransportadoras] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const {
    fetchCEP,
    loading: cepLoading
  } = useCEP();
  const [formData, setFormData] = useState({
    nome: '',
    cnpj_filial: '',
    ie: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
    cep: '',
    telefone: '',
    contato: '',
    transportadora_id: '',
    padrao: false
  });
  useEffect(() => {
    loadData();
  }, [clientId]);
  const loadData = async () => {
    try {
      const [addressesData, transportadorasData] = await Promise.all([fetch(`http://localhost:5300/api/empresas/${companyId}/clientes/${clientId}/enderecos`, {
        headers: {
          Authorization: `Bearer ${db.getToken()}`
        }
      }).then(res => res.json()), db.searchTransportadoras(companyId, '', 1000)]);
      console.log('Endereços carregados:', addressesData);
      console.log('Transportadoras disponíveis:', transportadorasData);
      setAddresses(addressesData);
      setTransportadoras(transportadorasData);
    } catch (error) {
      console.error('Error loading data:', error);
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
      const cepData = await fetchCEP(cleanCEP);
      if (cepData) {
        setFormData(prev => ({
          ...prev,
          endereco: cepData.logradouro,
          bairro: cepData.bairro,
          cidade: cepData.localidade,
          uf: cepData.uf
        }));
      }
    }
  };
  const handleEdit = (address: any) => {
    console.log('Editando endereço:', address);
    setFormData({
      nome: address.nome,
      cnpj_filial: address.cnpj_filial || '',
      ie: address.ie || '',
      endereco: address.endereco || '',
      numero: address.numero || '',
      complemento: address.complemento || '',
      bairro: address.bairro || '',
      cidade: address.cidade || '',
      uf: address.uf || '',
      cep: address.cep || '',
      telefone: address.telefone || '',
      contato: address.contato || '',
      transportadora_id: address.transportadora_id?.toString() || '',
      padrao: address.padrao === 1
    });
    setEditingId(address.id);
    setShowForm(true);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSend = {
        ...formData,
        transportadora_id: formData.transportadora_id ? parseInt(formData.transportadora_id) : null
      };
      console.log('Salvando endereço com dados:', dataToSend);
      const url = editingId ? `http://localhost:5300/api/empresas/${companyId}/clientes/${clientId}/enderecos/${editingId}` : `http://localhost:5300/api/empresas/${companyId}/clientes/${clientId}/enderecos`;
      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${db.getToken()}`
        },
        body: JSON.stringify(dataToSend)
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erro ao salvar:', errorData);
        throw new Error('Erro ao salvar endereço');
      }
      await loadData();
      handleCancel();
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Erro ao salvar endereço de entrega');
    }
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {
      name,
      value,
      type,
      checked
    } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      nome: '',
      cnpj_filial: '',
      ie: '',
      endereco: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      uf: '',
      cep: '',
      telefone: '',
      contato: '',
      transportadora_id: '',
      padrao: false
    });
  };
  const transportadoraOptions = transportadoras.map(t => ({
    value: t.id.toString(),
    label: t.razao_social,
    subtitle: t.cnpj ? `CNPJ: ${t.cnpj}` : t.cidade || ''
  }));
  return <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPinIcon size={20} className="text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Endereços de Entrega
          </h3>
        </div>
        {!showForm && <Button onClick={() => setShowForm(true)} variant="secondary">
            <PlusIcon size={16} className="mr-2" />
            Novo Endereço
          </Button>}
      </div>

      {showForm ? <Card className="p-6 mb-4">
          <h4 className="text-md font-semibold text-gray-900 mb-4">
            {editingId ? 'Editar Endereço de Entrega' : 'Novo Endereço de Entrega'}
          </h4>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Input label="Nome do Local *" name="nome" value={formData.nome} onChange={handleChange} placeholder="Ex: Filial Centro, Depósito Sul" required className="md:col-span-2" />
              <Input label="CNPJ da Filial" name="cnpj_filial" value={formData.cnpj_filial} onChange={handleChange} placeholder="00.000.000/0000-00" />
              <Input label="Inscrição Estadual" name="ie" value={formData.ie} onChange={handleChange} placeholder="IE da filial" />
              <Input label="Contato" name="contato" value={formData.contato} onChange={handleChange} placeholder="Nome do responsável" />
              <Input label="Telefone" name="telefone" value={formData.telefone} onChange={handleChange} />
              <Input label="CEP *" name="cep" value={formData.cep} onChange={handleCEPChange} placeholder="00000-000" required disabled={cepLoading} />
              {cepLoading && <div className="flex items-center text-sm text-gray-600">
                  Buscando CEP...
                </div>}
              <Input label="Endereço" name="endereco" value={formData.endereco} onChange={handleChange} className="md:col-span-2" />
              <Input label="Número *" name="numero" value={formData.numero} onChange={handleChange} required />
              <Input label="Complemento" name="complemento" value={formData.complemento} onChange={handleChange} />
              <Input label="Bairro" name="bairro" value={formData.bairro} onChange={handleChange} />
              <Input label="Cidade" name="cidade" value={formData.cidade} onChange={handleChange} />
              <Input label="UF" name="uf" value={formData.uf} onChange={handleChange} placeholder="SP" maxLength={2} />

              <SearchableSelect label="Transportadora Padrão" value={formData.transportadora_id} onChange={value => setFormData({
            ...formData,
            transportadora_id: value
          })} options={transportadoraOptions} placeholder="Selecione uma transportadora" searchPlaceholder="Pesquisar por nome, CNPJ ou cidade..." className="md:col-span-2" />

              <div className="md:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="padrao" checked={formData.padrao} onChange={handleChange} className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500" />
                  <span className="text-sm text-gray-700">
                    Definir como endereço padrão
                  </span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="secondary" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingId ? 'Salvar Alterações' : 'Adicionar Endereço'}
              </Button>
            </div>
          </form>
        </Card> : addresses.length === 0 ? <Card className="p-8 text-center">
          <MapPinIcon size={40} className="mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 mb-4">
            Nenhum endereço de entrega cadastrado
          </p>
          <Button onClick={() => setShowForm(true)} variant="secondary">
            Adicionar Primeiro Endereço
          </Button>
        </Card> : <Card>
          <Table headers={['Nome', 'CNPJ/IE', 'Endereço', 'Cidade/UF', 'Transportadora', 'Padrão', 'Ações']}>
            {addresses.map(address => {
          const transportadora = transportadoras.find(t => t.id === address.transportadora_id);
          return <tr key={address.id} className="hover:bg-gray-50 cursor-pointer" onDoubleClick={() => handleEdit(address)} title="Duplo clique para editar">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{address.nome}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {address.cnpj_filial && <p>CNPJ: {address.cnpj_filial}</p>}
                    {address.ie && <p>IE: {address.ie}</p>}
                    {!address.cnpj_filial && !address.ie && '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {address.endereco && address.numero ? `${address.endereco}, ${address.numero}` : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {address.cidade && address.uf ? `${address.cidade}/${address.uf}` : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {transportadora ? <div>
                        <p className="font-medium">
                          {transportadora.razao_social}
                        </p>
                        {transportadora.cidade && <p className="text-xs text-gray-500">
                            {transportadora.cidade}
                          </p>}
                      </div> : address.transportadora_id ? <span className="text-red-600 text-xs">
                        ID: {address.transportadora_id} (não encontrada)
                      </span> : '-'}
                  </td>
                  <td className="px-6 py-4">
                    {address.padrao === 1 && <CheckCircleIcon size={18} className="text-green-600" />}
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={e => {
                e.stopPropagation();
                handleEdit(address);
              }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <EditIcon size={16} />
                    </button>
                  </td>
                </tr>;
        })}
          </Table>
        </Card>}
    </div>;
}