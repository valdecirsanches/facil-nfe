import React, { useEffect, useState } from 'react';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { AlertCircleIcon, CheckCircleIcon, LoaderIcon } from 'lucide-react';
import { toast } from 'sonner';
interface CompanyRegistrationProps {
  cnpj: string;
  planId: number;
  onSuccess: (companyId: number) => void;
  onCancel: () => void;
}
export function CompanyRegistration({
  cnpj,
  planId,
  onSuccess,
  onCancel
}: CompanyRegistrationProps) {
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [error, setError] = useState('');
  // Company data
  const [razaoSocial, setRazaoSocial] = useState('');
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [ie, setIe] = useState('');
  const [im, setIm] = useState('');
  const [cnae, setCnae] = useState('');
  const [crt, setCrt] = useState('1'); // 1 = Simples Nacional
  const [endereco, setEndereco] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [cep, setCep] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  useEffect(() => {
    fetchCompanyData();
  }, [cnpj]);
  const fetchCompanyData = async () => {
    setFetchingData(true);
    setError('');
    try {
      // Fetch from our backend proxy (avoids CORS issues)
      const response = await fetch(`http://localhost:5300/api/cnpj/${cnpj}/dados`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao buscar dados da empresa');
      }
      const data = await response.json();
      // Auto-fill form with API data
      setRazaoSocial(data.nome || '');
      setNomeFantasia(data.fantasia || data.nome || '');
      setEndereco(data.logradouro || '');
      setNumero(data.numero || '');
      setComplemento(data.complemento || '');
      setBairro(data.bairro || '');
      setCidade(data.municipio || '');
      setEstado(data.uf || '');
      setCep(data.cep?.replace(/\D/g, '') || '');
      setTelefone(data.telefone?.replace(/\D/g, '') || '');
      setEmail(data.email || '');
      // Extract CNAE principal
      if (data.atividade_principal && data.atividade_principal.length > 0) {
        const cnaeCode = data.atividade_principal[0].code?.replace(/\D/g, '');
        setCnae(cnaeCode || '');
      }
      toast.success('Dados da empresa carregados automaticamente!');
    } catch (err: any) {
      console.error('Error fetching company data:', err);
      setError(err.message || 'Erro ao buscar dados da empresa. Preencha manualmente.');
      toast.error('Não foi possível buscar os dados automaticamente. Preencha manualmente.');
    } finally {
      setFetchingData(false);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    // Validation
    if (!razaoSocial || !ie || !endereco || !cidade || !estado || !cep) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }
    if (cep.replace(/\D/g, '').length !== 8) {
      setError('CEP deve ter 8 dígitos');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5300/api/empresas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cnpj: cnpj.replace(/\D/g, ''),
          razao_social: razaoSocial,
          nome_fantasia: nomeFantasia || razaoSocial,
          ie: ie.replace(/\D/g, ''),
          im: im || null,
          cnae: cnae || null,
          crt: parseInt(crt),
          endereco,
          numero,
          complemento: complemento || null,
          bairro,
          cidade,
          estado,
          cep: cep.replace(/\D/g, ''),
          telefone: telefone || null,
          email: email || null,
          plano_id: planId,
          ativo: 1
        })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao cadastrar empresa');
      }
      const result = await response.json();
      toast.success('Empresa cadastrada com sucesso!');
      onSuccess(result.id);
    } catch (err: any) {
      console.error('Error creating company:', err);
      setError(err.message || 'Erro ao cadastrar empresa. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  if (fetchingData) {
    return <div className="text-center py-12">
        <LoaderIcon size={48} className="animate-spin text-green-600 mx-auto mb-4" />
        <p className="text-gray-600">Buscando dados da empresa...</p>
        <p className="text-sm text-gray-500 mt-2">CNPJ: {cnpj}</p>
      </div>;
  }
  return <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800 flex items-center gap-2">
            <AlertCircleIcon size={16} />
            {error}
          </p>
        </div>}

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2 text-blue-800 mb-2">
          <CheckCircleIcon size={20} />
          <p className="text-sm font-medium">
            Dados preenchidos automaticamente
          </p>
        </div>
        <p className="text-xs text-blue-700">
          Verifique e complete as informações abaixo
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Input label="Razão Social *" value={razaoSocial} onChange={e => setRazaoSocial(e.target.value)} required disabled={loading} />
        </div>

        <div className="md:col-span-2">
          <Input label="Nome Fantasia" value={nomeFantasia} onChange={e => setNomeFantasia(e.target.value)} disabled={loading} />
        </div>

        <Input label="Inscrição Estadual *" value={ie} onChange={e => setIe(e.target.value)} placeholder="000000000000" required disabled={loading} />

        <Input label="Inscrição Municipal" value={im} onChange={e => setIm(e.target.value)} placeholder="00000000" disabled={loading} />

        <Input label="CNAE" value={cnae} onChange={e => setCnae(e.target.value)} placeholder="0000000" disabled={loading} />

        <Select label="Regime Tributário *" value={crt} onChange={e => setCrt(e.target.value)} required disabled={loading}>
          <option value="1">Simples Nacional</option>
          <option value="2">Simples Nacional - Excesso</option>
          <option value="3">Regime Normal</option>
        </Select>
      </div>

      <div className="border-t pt-6">
        <h3 className="font-semibold text-gray-900 mb-4">Endereço</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input label="Logradouro *" value={endereco} onChange={e => setEndereco(e.target.value)} required disabled={loading} />
          </div>

          <Input label="Número *" value={numero} onChange={e => setNumero(e.target.value)} required disabled={loading} />

          <Input label="Complemento" value={complemento} onChange={e => setComplemento(e.target.value)} disabled={loading} />

          <Input label="Bairro *" value={bairro} onChange={e => setBairro(e.target.value)} required disabled={loading} />

          <Input label="CEP *" value={cep} onChange={e => setCep(e.target.value)} placeholder="00000000" maxLength={8} required disabled={loading} />

          <Input label="Cidade *" value={cidade} onChange={e => setCidade(e.target.value)} required disabled={loading} />

          <Input label="Estado *" value={estado} onChange={e => setEstado(e.target.value.toUpperCase())} placeholder="SP" maxLength={2} required disabled={loading} />
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="font-semibold text-gray-900 mb-4">Contato</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Telefone" value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="11999999999" disabled={loading} />

          <Input label="E-mail" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="contato@empresa.com" disabled={loading} />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading ? 'Cadastrando...' : 'Cadastrar Empresa'}
        </Button>
      </div>
    </form>;
}